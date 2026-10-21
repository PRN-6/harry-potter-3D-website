"""
THE GREAT HALL — SCROLL TOUR BUILDER
=====================================

Builds the scroll-driven camera tour for the Enchanthia festival site, and
rigs the main doors so they can swing open on the website.

WHAT THIS SCRIPT DOES
---------------------
1.  Imports `public/models/hogwarts_dining_hall.glb` (the Sketchfab export
    by Asmodeo666, CC-BY-4.0).
2.  Detects the hall from the geometry itself — the floor height, the wall
    span, the entrance wall, the main doors and the four house tables. No
    hard-coded coordinates, so it keeps working if the model is re-exported.
3.  Rigs the doors: the two leaves are separated out of the single merged
    door mesh, grouped into a left and a right leaf, and parented to two
    hinge empties. The empties are named and tagged, so the website can
    find them and swing the doors open as the visitor scrolls.
4.  Animates a camera along a smooth Catmull-Rom spline: the doors open,
    the camera walks in and stops at the first row of each house table in
    turn, then turns to face the High Table.
5.  Exports:
      • a RIGGED GLB  → `public/models/hogwarts_dining_hall_rigged.glb`
      • a JSON manifest → `public/data/hall-tour.json`
    The manifest carries the camera path and the door timing in *three.js
    world space*, which is exactly the space `DiningHallModel.tsx` puts the
    model in, so the website can play the path back with no conversion.

    It also saves a .blend and can render a preview MP4.

RUNNING IT
-----------
    blender --background --python blender/dining_hall_scroll_tour.py
    blender --background --python blender/dining_hall_scroll_tour.py -- --report
    blender --background --python blender/dining_hall_scroll_tour.py -- --render

The `--` separator passes the arguments on to this script. `--report` prints
the detected layout and exits without writing anything.

WHY THE COORDINATES ARE CONVERTED
----------------------------------
The GLB is authored Z-up, and three.js's GLTFLoader applies the file's own
root matrix so the model lands in three.js Y-up space. The hall therefore
runs along three.js Z, with the entrance at +Z and the High Table at -Z.
`fitModel()` in `DiningHallModel.tsx` then scales and centres the model.
This script reproduces that exact transform so the manifest's numbers can be
fed straight to the camera without any further maths.
"""

import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

# ═══════════════════════════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# The project root, i.e. the folder that holds `package.json`.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The model to animate. Override with `--model <path>`.
DEFAULT_MODEL = os.path.join(
    PROJECT_ROOT, "public", "models", "hogwarts_dining_hall.glb"
)

# Where the generated files go.
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

# The rigged model and the manifest are also copied into `public/`, because
# that is where the website expects to load them from.
RIGGED_GLB = os.path.join(PROJECT_ROOT, "public", "models", "hogwarts_dining_hall_rigged.glb")
MANIFEST_JSON = os.path.join(PROJECT_ROOT, "public", "data", "hall-tour.json")

# MUST match `TARGET_LENGTH` in src/three/DiningHallModel.tsx. If the two
# drift apart, the manifest's coordinates will not line up with the model
# on the website.
TARGET_LENGTH = 56.0

FPS = 30
RESOLUTION = (1920, 1080)

# The names the website looks for when it plays the tour back.
HINGE_LEFT = "DoorHinge_L"
HINGE_RIGHT = "DoorHinge_R"
CAMERA_TARGET = "CameraTarget"

# How far the doors swing open, in radians (~100 degrees).
DOOR_OPEN_ANGLE = math.radians(100.0)

# The house at each of the four tables, in the order the camera visits them.
# The hall's tables are numbered left-to-right as seen from the entrance.
TABLE_HOUSES = ["gryffindor", "ravenclaw", "slytherin", "hufflepuff"]


# ═══════════════════════════════════════════════════════════════════════════
#  ARGUMENT PARSING
# ═══════════════════════════════════════════════════════════════════════════


def script_args():
    """Returns the arguments after the `--` separator Blender passes through."""
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def has_flag(name):
    return name in script_args()


def flag_value(name, default=None):
    args = script_args()
    if name in args:
        index = args.index(name)
        if index + 1 < len(args):
            return args[index + 1]
    return default


# ═══════════════════════════════════════════════════════════════════════════
#  GEOMETRY HELPERS
# ═══════════════════════════════════════════════════════════════════════════


def world_vertices():
    """
    Every mesh vertex in the scene, in world space, as an (N, 3) array.

    Uses `foreach_get` rather than a Python loop over the vertices: the hall
    is half a million triangles, and a plain loop takes tens of seconds.
    """
    chunks = []
    for ob in bpy.context.scene.objects:
        if ob.type != "MESH" or not ob.data.vertices:
            continue
        co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
        ob.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3).astype(np.float64)
        matrix = np.array(ob.matrix_world, dtype=np.float64)
        chunks.append(co @ matrix[:3, :3].T + matrix[:3, 3])
    if not chunks:
        return np.zeros((0, 3))
    return np.concatenate(chunks, axis=0)


def cluster_values(values, gap):
    """
    Groups sorted values into runs, starting a new run whenever the jump
    between neighbours is bigger than `gap`.

    This is how the tables are found: at table height the geometry forms a
    few long runs along the hall's length, separated by the gaps between
    the tables and by the central aisle.
    """
    values = np.sort(np.asarray(values, dtype=np.float64))
    if values.size == 0:
        return []
    breaks = np.where(np.diff(values) > gap)[0]
    groups = np.split(values, breaks + 1)
    return [(float(g[0]), float(g[-1])) for g in groups if g.size]


def scene_bounds(vertices):
    """The world-space bounding box of the whole imported model."""
    if vertices.size == 0:
        raise RuntimeError("The scene contains no geometry.")
    return vertices.min(axis=0), vertices.max(axis=0)


# ═══════════════════════════════════════════════════════════════════════════
#  DETECTION
# ═══════════════════════════════════════════════════════════════════════════


def detect_floor(vertices):
    """The floor's height — the lowest Z that carries a lot of geometry."""
    z = vertices[:, 2]
    # The floor is a huge horizontal slab, so the low end of the Z
    # distribution is packed with vertices.
    return float(np.percentile(z, 0.5))


def detect_tables(vertices, floor_z):
    """
    Finds the four banquet tables.

    A table top is a wide, flat, horizontal surface. So the search is:
    look for a thin horizontal slab of geometry, and inside that slab look
    for long runs of X separated by the gaps between the tables.

    Returns a list of dicts with the table's X centre and its Z extent along
    the hall (Y in Blender's space).
    """
    z = vertices[:, 2]
    step = 2.0
    buckets = np.round(z / step).astype(int)
    counts = np.bincount(buckets)
    # Only look above the floor — the floor itself is the biggest slab.
    first = int((floor_z + 12.0) / step)

    candidates = [
        (counts[i], i * step) for i in range(first, len(counts)) if counts[i] > 0
    ]
    candidates.sort(reverse=True)

    for count, slab_z in candidates:
        mask = np.abs(z - slab_z) <= 3.0
        if mask.sum() < 500:
            continue
        subset = vertices[mask]
        bands = cluster_values(subset[:, 0], gap=25.0)

        tables = []
        for lo, hi in bands:
            if hi - lo < 40.0:
                continue
            in_band = subset[
                (subset[:, 0] >= lo) & (subset[:, 0] <= hi)
            ]
            y_lo = float(in_band[:, 1].min())
            y_hi = float(in_band[:, 1].max())
            # A banquet table runs most of the length of the hall. The dais
            # near the entrance is also wide, but it is short.
            if y_hi - y_lo < 400.0:
                continue
            tables.append(
                {
                    "x_lo": lo,
                    "x_hi": hi,
                    "x": (lo + hi) * 0.5,
                    "y_near": y_lo,
                    "y_far": y_hi,
                    "z": slab_z,
                }
            )

        if len(tables) == 4:
            tables.sort(key=lambda t: t["x"])
            return tables

    raise RuntimeError(
        "Could not find the four banquet tables. "
        "The model's layout may have changed."
    )


def detect_door(vertices, hall):
    """
    Finds the main doors.

    The doors are the tall, narrow structure on the entrance wall: the wall
    is the end of the hall nearest the camera's start point, and the door
    mesh is the one object that spans a narrow band of the hall's length
    while reaching a long way up.
    """
    entrance_y = hall["y_min"]

    best = None
    for ob in bpy.context.scene.objects:
        if ob.type != "MESH" or not ob.data.vertices:
            continue
        co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
        ob.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3).astype(np.float64)
        matrix = np.array(ob.matrix_world, dtype=np.float64)
        world = co @ matrix[:3, :3].T + matrix[:3, 3]

        lo = world.min(axis=0)
        hi = world.max(axis=0)
        height = hi[2] - lo[2]
        depth = hi[1] - lo[1]
        width = hi[0] - lo[0]

        # The doors: a wide-ish panel, thin in the hall's length, standing
        # on the entrance wall and reaching well up.
        if depth > 120.0:
            continue
        if height < 150.0:
            continue
        if width < 100.0 or width > hall["width"] * 0.9:
            continue
        if lo[1] > entrance_y + 140.0:
            continue

        score = height + width
        if best is None or score > best["score"]:
            best = {
                "object": ob,
                "score": score,
                "x_lo": float(lo[0]),
                "x_hi": float(hi[0]),
                "y_lo": float(lo[1]),
                "y_hi": float(hi[1]),
                "z_lo": float(lo[2]),
                "z_hi": float(hi[2]),
                "x": float((lo[0] + hi[0]) * 0.5),
                "y": float((lo[1] + hi[1]) * 0.5),
                "z": float((lo[2] + hi[2]) * 0.5),
            }

    if best is None:
        raise RuntimeError("Could not find the main doors.")
    return best


def detect_hall(vertices):
    """The overall shape of the room."""
    lo, hi = scene_bounds(vertices)
    floor_z = detect_floor(vertices)
    return {
        "x_min": float(lo[0]),
        "x_max": float(hi[0]),
        "y_min": float(lo[1]),
        "y_max": float(hi[1]),
        "z_min": float(lo[2]),
        "z_max": float(hi[2]),
        "width": float(hi[0] - lo[0]),
        "length": float(hi[1] - lo[1]),
        "height": float(hi[2] - lo[2]),
        "floor_z": floor_z,
    }


# ═══════════════════════════════════════════════════════════════════════════
#  THE DOOR RIG
# ═══════════════════════════════════════════════════════════════════════════


def classify_door_parts(door):
    """
    Splits the door mesh's loose parts into a left leaf, a right leaf and
    the static frame.

    The door is a single merged mesh of a lot of separate pieces: two leaves,
    the arch above them, the threshold between them. The pieces are split
    apart, and then sorted by where they sit along the opening.

    The trick for telling the leaves from the arch is a gap in the middle:
    the two leaves meet around the centre of the opening, and the doorway
    itself is empty, so the pieces cluster into a group on the left, a
    group on the right, and a handful of pieces that bridge the gap.
    """
    ob = door["object"]
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    # Split the merged mesh into its individual pieces.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")

    pieces = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    boxes = []
    for piece in pieces:
        co = np.empty(len(piece.data.vertices) * 3, dtype=np.float32)
        piece.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3).astype(np.float64)
        boxes.append((co.min(axis=0), co.max(axis=0)))

    # A piece that belongs to the leaves starts at the sill. Everything that
    # starts well above the sill is the arch, and stays put.
    sill = door["z_lo"]
    leaf_height = (door["z_hi"] - door["z_lo"]) * 0.72
    low_pieces = [
        (p, b) for p, b in zip(pieces, boxes) if b[0][2] < sill + leaf_height
    ]

    # Find the widest empty band in the middle of the opening: that is the
    # doorway the camera walks through.
    spans = sorted((float(b[0][0]), float(b[1][0])) for _, b in low_pieces)
    best_gap = (0.0, door["x"], door["x"])
    cursor = spans[0][0]
    for lo, hi in spans:
        if lo - cursor > best_gap[0]:
            best_gap = (lo - cursor, cursor, lo)
        cursor = max(cursor, hi)

    gap_start, gap_end = best_gap[1], best_gap[2]
    if best_gap[0] < 20.0:
        # No usable gap — fall back to a simple split at the centre.
        gap_start = gap_end = door["x"]

    left, right, static = [], [], []
    for piece, (lo, hi) in low_pieces:
        if lo[0] >= gap_start and hi[0] <= gap_end:
            # Sits entirely inside the doorway — a threshold or step.
            static.append(piece)
        elif hi[0] <= gap_start:
            left.append(piece)
        elif lo[0] >= gap_end:
            right.append(piece)
        else:
            # Spans the doorway, so it bridges both leaves: the arch springing.
            static.append(piece)

    # Anything above the sill line is the arch, which never moves.
    for piece, (lo, hi) in zip(pieces, boxes):
        if lo[2] >= sill + leaf_height:
            static.append(piece)

    return left, right, static


def build_door_rig(door):
    """
    Parents each door leaf to a hinge empty and returns the two empties.

    The empties are what the website animates. Each one sits on its leaf's
    outer edge, so rotating it swings that leaf open like a real door.
    """
    left, right, static = classify_door_parts(door)

    if not left or not right:
        raise RuntimeError(
            "Could not split the door into two leaves "
            f"(left={len(left)}, right={len(right)})."
        )

    # The outer edge of each leaf is its hinge.
    left_hinge_x = min(
        p.matrix_world @ Vector(corner)
        for p in left
        for corner in [p.bound_box[0]]
    ).x
    right_hinge_x = max(
        p.matrix_world @ Vector(corner)
        for p in right
        for corner in [p.bound_box[6]]
    ).x

    hinges = []
    for name, parts, hinge_x, direction in (
        (HINGE_LEFT, left, left_hinge_x, 1.0),
        (HINGE_RIGHT, right, right_hinge_x, -1.0),
    ):
        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = "PLAIN_AXES"
        empty.empty_display_size = 40.0
        bpy.context.scene.collection.objects.link(empty)
        empty.location = (hinge_x, door["y"], door["z_lo"])
        empty.rotation_mode = "XYZ"
        # Tagged so the website can find the hinge by role, not just by name.
        empty["role"] = "door_hinge"
        empty["side"] = "left" if direction > 0 else "right"
        empty["open_angle"] = DOOR_OPEN_ANGLE * direction

        for part in parts:
            part.parent = empty
            part.matrix_parent_inverse = empty.matrix_world.inverted()

        hinges.append(empty)

    return hinges, len(left), len(right), len(static)


# ═══════════════════════════════════════════════════════════════════════════
#  THE CAMERA PATH
# ═══════════════════════════════════════════════════════════════════════════


def catmull_rom(p0, p1, p2, p3, t):
    """
    The Catmull-Rom spline through four control points.

    Catmull-Rom is used rather than a simple Bezier because it passes
    THROUGH its control points, so the camera lands exactly on the table it
    is meant to frame.
    """
    t2 = t * t
    t3 = t2 * t
    return 0.5 * (
        (2.0 * p1)
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    )


def smoothstep(t):
    """An ease-in-ease-out curve, so the camera accelerates and settles."""
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


class TourPath:
    """
    The camera's journey, as a list of stops with a dwell time at each.

    Each stop is a point the camera looks AT, plus where the camera sits.
    The camera glides from stop to stop along a Catmull-Rom spline, and
    pauses at each one so the visitor has time to read the cards.
    """

    def __init__(self, stops):
        self.stops = stops
        self.positions = [np.array(s["pos"], dtype=np.float64) for s in stops]
        self.targets = [np.array(s["target"], dtype=np.float64) for s in stops]

    def _segment(self, index):
        """The four control points for the spline around stop `index`."""
        n = len(self.stops)
        return (
            self.positions[max(index - 1, 0)],
            self.positions[index],
            self.positions[min(index + 1, n - 1)],
            self.positions[min(index + 2, n - 1)],
        )

    def _target_segment(self, index):
        n = len(self.stops)
        return (
            self.targets[max(index - 1, 0)],
            self.targets[index],
            self.targets[min(index + 1, n - 1)],
            self.targets[min(index + 2, n - 1)],
        )

    def sample(self, time):
        """The camera position and look-at point at a given time."""
        stops = self.stops
        # Find the segment the time falls in.
        index = len(stops) - 2
        for i in range(len(stops) - 1):
            if time <= stops[i + 1]["t"]:
                index = i
                break

        start = stops[index]["t"]
        end = stops[index + 1]["t"]
        span = max(end - start, 1e-6)
        u = smoothstep((time - start) / span)

        p = catmull_rom(*self._segment(index), u)
        q = catmull_rom(*self._target_segment(index), u)
        return p, q


def build_stops(door, tables, hall):
    """
    Lays out the tour.

    The camera starts outside the doors, watches them swing open, walks in,
    then stops at the first row of each house table in turn before turning
    to face the High Table.
    """
    door_x = door["x"]
    door_y = door["y"]
    floor = hall["floor_z"]

    # Eye height: a little above a standing person, so the table tops are
    # visible and the cards have somewhere to sit.
    eye = floor + 72.0

    stops = [
        {
            "id": "outside",
            "house": None,
            "t": 0.0,
            "pos": (door_x, door_y - 470.0, eye + 30.0),
            "target": (door_x, door_y, eye),
            "label": "The Doors of the Great Hall",
        },
        {
            "id": "doors",
            "house": None,
            "t": 3.0,
            "pos": (door_x, door_y - 250.0, eye + 12.0),
            "target": (door_x, door_y + 40.0, eye - 10.0),
            "label": "The Doors Swing Open",
        },
        {
            "id": "entrance",
            "house": None,
            "t": 6.5,
            "pos": (door_x, door_y - 30.0, eye),
            "target": (door_x, door_y + 220.0, eye - 20.0),
            "label": "Welcome to the Great Hall",
        },
    ]

    # One stop per house table. The camera drifts off the centre line to
    # frame the table, then carries on down the hall.
    table_stop = 4.0
    for index, table in enumerate(tables):
        # Stand a little short of the table's first row and look down it.
        stand_y = table["y_near"] - 60.0
        look_y = table["y_near"] + 210.0
        side = -1.0 if table["x"] < door_x else 1.0
        stops.append(
            {
                "id": f"table-{index}",
                "house": TABLE_HOUSES[index],
                "t": stops[-1]["t"] + table_stop,
                "pos": (table["x"] + side * 34.0, stand_y, eye),
                "target": (table["x"], look_y, table["z"] + 18.0),
                "label": f"{TABLE_HOUSES[index].title()} Table",
            }
        )

    # Finally, turn and look down the hall towards the High Table.
    stops.append(
        {
            "id": "hightable",
            "house": None,
            "t": stops[-1]["t"] + 4.5,
            "pos": (door_x, tables[-1]["y_near"] + 300.0, eye + 30.0),
            "target": (door_x, hall["y_max"] - 40.0, floor + 130.0),
            "label": "The High Table",
        }
    )

    return stops


# ═══════════════════════════════════════════════════════════════════════════
#  THE THREE.JS TRANSFORM
# ═══════════════════════════════════════════════════════════════════════════


def three_transform(hall):
    """
    Reproduces `fitModel()` from `src/three/DiningHallModel.tsx`.

    Blender's space has the hall running along Y with Z up. The glTF file
    has it running along Z with Y up, and three.js applies the file's own
    root matrix to get there. `fitModel` then scales the model to
    `TARGET_LENGTH` and centres it.

    Returns a function that maps a Blender-space point to three.js world
    space, plus the numbers themselves for the manifest.
    """
    # Blender (x, y, z)  →  glTF (x, z, -y)
    # glTF size: x = width, z = length.
    size_x = hall["x_max"] - hall["x_min"]
    size_z = hall["y_max"] - hall["y_min"]
    longest = max(size_x, size_z)
    scale = TARGET_LENGTH / longest

    center_x = (hall["x_min"] + hall["x_max"]) * 0.5
    center_z = -(hall["y_min"] + hall["y_max"]) * 0.5
    min_y = hall["z_min"]

    offset = (
        -center_x * scale,
        -min_y * scale,
        -center_z * scale,
    )

    def to_three(point):
        bx, by, bz = point
        gx, gy, gz = bx, bz, -by
        return (
            gx * scale + offset[0],
            gy * scale + offset[1],
            gz * scale + offset[2],
        )

    return to_three, {
        "scale": scale,
        "offset": list(offset),
        "gltfSize": [size_x, hall["height"], size_z],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  ANIMATION
# ═══════════════════════════════════════════════════════════════════════════


def setup_scene(hall, duration):
    """Frame rate, resolution, engine and the world background."""
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = int(duration * FPS) + 1
    scene.render.fps = FPS
    scene.render.resolution_x = RESOLUTION[0]
    scene.render.resolution_y = RESOLUTION[1]
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False

    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue

    if scene.world is None:
        scene.world = bpy.data.worlds.new("GreatHall")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.02, 0.015, 0.04, 1.0)
        background.inputs["Strength"].default_value = 0.35

    # A warm fill light so the hall is not pitch black in the preview.
    if not any(o.type == "LIGHT" for o in scene.objects):
        light_data = bpy.data.lights.new("Fill", type="SUN")
        light_data.energy = 2.0
        light_data.angle = math.radians(20)
        light = bpy.data.objects.new("Fill", light_data)
        light.rotation_euler = (math.radians(50), 0.0, math.radians(30))
        scene.collection.objects.link(light)


def build_camera(stops):
    """The camera rig, with a Track To constraint onto an animated target."""
    scene = bpy.context.scene

    # The model ships with its own camera; it would fight with ours.
    for ob in list(scene.objects):
        if ob.type == "CAMERA":
            bpy.data.objects.remove(ob, do_unlink=True)

    target = bpy.data.objects.new(CAMERA_TARGET, None)
    target.empty_display_type = "SPHERE"
    target.empty_display_size = 20.0
    scene.collection.objects.link(target)

    camera_data = bpy.data.cameras.new("TourCamera")
    camera_data.lens = 32.0
    camera_data.clip_start = 1.0
    camera_data.clip_end = 6000.0
    camera = bpy.data.objects.new("TourCamera", camera_data)
    scene.collection.objects.link(camera)

    constraint = camera.constraints.new("TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    scene.camera = camera
    return camera, target


def keyframe_camera(camera, target, path, duration):
    """Bakes the spline into keyframes, one per frame."""
    scene = bpy.context.scene
    step = 1.0 / FPS

    for frame in range(scene.frame_start, scene.frame_end + 1):
        time = (frame - scene.frame_start) * step
        position, look = path.sample(min(time, duration))
        camera.location = tuple(position)
        target.location = tuple(look)
        camera.keyframe_insert(data_path="location", frame=frame)
        target.keyframe_insert(data_path="location", frame=frame)

    # Smooth the keyframes so a scrub through the timeline in Blender is
    # not a stutter even though the samples themselves are dense.
    for fcurve in camera.animation_data.action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "LINEAR"


def keyframe_doors(hinges, stops, duration):
    """Swings the doors open as the camera reaches them."""
    scene = bpy.context.scene
    open_start = stops[1]["t"]
    open_end = stops[2]["t"] + 1.5

    for hinge in hinges:
        angle = hinge["open_angle"]
        for frame in range(scene.frame_start, scene.frame_end + 1):
            time = (frame - scene.frame_start) / FPS
            u = smoothstep((time - open_start) / max(open_end - open_start, 1e-6))
            hinge.rotation_euler = (0.0, 0.0, angle * u)
            hinge.keyframe_insert(data_path="rotation_euler", frame=frame)

        for fcurve in hinge.animation_data.action.fcurves:
            for point in fcurve.keyframe_points:
                point.interpolation = "LINEAR"


# ═══════════════════════════════════════════════════════════════════════════
#  EXPORT
# ═══════════════════════════════════════════════════════════════════════════


def export_gltf(filepath):
    """
    Writes the rigged model out as a GLB.

    The camera and its animation are left behind — the website drives the
    camera itself, and shipping a dead camera clip would only bloat the
    file.
    """
    for path in (filepath,):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.context.scene.objects:
        if ob.type in {"MESH", "EMPTY"}:
            ob.select_set(True)

    kwargs = {
        "filepath": filepath,
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": True,
        "export_animations": False,
        "export_extras": True,
        "export_cameras": False,
        "export_lights": False,
        "export_yup": True,
    }
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        # Older/newer Blender builds have renamed a few of these.
        for key in ("export_apply", "export_extras", "export_yup"):
            kwargs.pop(key, None)
        bpy.ops.export_scene.gltf(**kwargs)


def write_manifest(path, path_obj, stops, hall, door, tables, hinges, transform):
    """
    Writes the JSON the website reads.

    The camera samples are in three.js world space, so the site can hand
    them straight to the camera with no conversion.
    """
    to_three, numbers = transform
    duration = stops[-1]["t"]

    samples = []
    step = 1.0 / FPS
    total_frames = int(duration * FPS) + 1
    for frame in range(total_frames):
        time = frame * step
        position, look = path_obj.sample(time)
        samples.append(
            {
                "t": round(time, 4),
                "pos": [round(v, 4) for v in to_three(position)],
                "target": [round(v, 4) for v in to_three(look)],
            }
        )

    manifest_stops = []
    for stop in stops:
        manifest_stops.append(
            {
                "id": stop["id"],
                "house": stop["house"],
                "label": stop["label"],
                "t": round(stop["t"], 4),
                "pos": [round(v, 4) for v in to_three(stop["pos"])],
                "target": [round(v, 4) for v in to_three(stop["target"])],
            }
        )

    manifest_tables = []
    for index, table in enumerate(tables):
        anchor = (table["x"], table["y_near"] + 110.0, table["z"] + 40.0)
        manifest_tables.append(
            {
                "house": TABLE_HOUSES[index],
                "center": [round(v, 4) for v in to_three(anchor)],
                "x": round(to_three((table["x"], 0.0, 0.0))[0], 4),
                "z": round(to_three((0.0, table["y_near"], 0.0))[2], 4),
                "near": round(to_three((0.0, table["y_near"], 0.0))[2], 4),
                "far": round(to_three((0.0, table["y_far"], 0.0))[2], 4),
            }
        )

    manifest = {
        "version": 1,
        "fps": FPS,
        "duration": round(duration, 4),
        "model": {
            "url": "/models/hogwarts_dining_hall_rigged.glb",
            "scale": round(numbers["scale"], 8),
            "offset": [round(v, 6) for v in numbers["offset"]],
        },
        "door": {
            "left": HINGE_LEFT,
            "right": HINGE_RIGHT,
            "openAngle": round(DOOR_OPEN_ANGLE, 5),
            "t0": round(stops[1]["t"], 4),
            "t1": round(stops[2]["t"] + 1.5, 4),
        },
        "hall": {
            "length": round(TARGET_LENGTH, 4),
            "gltfSize": [round(v, 2) for v in numbers["gltfSize"]],
        },
        "stops": manifest_stops,
        "tables": manifest_tables,
        "samples": samples,
    }

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
    return manifest


def render_preview(filepath):
    """Renders the animation to an MP4, if this Blender build can."""
    scene = bpy.context.scene
    scene.render.filepath = filepath
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    bpy.ops.render.render(animation=True)


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════


def main():
    model = flag_value("--model", DEFAULT_MODEL)
    report_only = has_flag("--report")
    do_render = has_flag("--render")

    if not os.path.isfile(model):
        raise SystemExit(f"Model not found: {model}")

    print("=" * 70)
    print("THE GREAT HALL — SCROLL TOUR BUILDER")
    print("=" * 70)
    print(f"Model: {model}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=model)
    print("Import finished.")

    vertices = world_vertices()
    hall = detect_hall(vertices)
    tables = detect_tables(vertices, hall["floor_z"])
    door = detect_door(vertices, hall)

    print()
    print("── HALL " + "─" * 58)
    print(f"  width  {hall['width']:.1f}   length {hall['length']:.1f}   height {hall['height']:.1f}")
    print(f"  floor  z={hall['floor_z']:.1f}   ceiling z={hall['z_max']:.1f}")
    print(f"  x {hall['x_min']:.1f} .. {hall['x_max']:.1f}")
    print(f"  y {hall['y_min']:.1f} .. {hall['y_max']:.1f}")

    print()
    print("── DOOR " + "─" * 58)
    print(f"  object  {door['object'].name}")
    print(f"  x {door['x_lo']:.1f} .. {door['x_hi']:.1f}   y {door['y_lo']:.1f} .. {door['y_hi']:.1f}")
    print(f"  z {door['z_lo']:.1f} .. {door['z_hi']:.1f}   centre x={door['x']:.1f} y={door['y']:.1f}")

    print()
    print("── TABLES " + "─" * 56)
    for index, table in enumerate(tables):
        print(
            f"  {index}  {TABLE_HOUSES[index]:<12} x {table['x']:7.1f}  "
            f"y {table['y_near']:7.1f} .. {table['y_far']:7.1f}  z {table['z']:.1f}"
        )

    if report_only:
        print()
        print("--report given: nothing written.")
        return

    # ── Rig the doors ──────────────────────────────────────────────────────
    hinges, n_left, n_right, n_static = build_door_rig(door)
    print()
    print(f"── DOOR RIG " + "─" * 54)
    print(f"  left leaf  {n_left} pieces")
    print(f"  right leaf {n_right} pieces")
    print(f"  static     {n_static} pieces")
    for hinge in hinges:
        print(f"  {hinge.name}  at x={hinge.location.x:.1f}  angle={hinge['open_angle']:.3f}")

    # ── Build the tour ─────────────────────────────────────────────────────
    stops = build_stops(door, tables, hall)
    duration = stops[-1]["t"]
    path = TourPath(stops)

    print()
    print("── TOUR " + "─" * 59)
    for stop in stops:
        print(f"  t={stop['t']:6.2f}  {stop['id']:<12} {stop['label']}")

    # ── Animate ────────────────────────────────────────────────────────────
    setup_scene(hall, duration)
    camera, target = build_camera(stops)
    keyframe_camera(camera, target, path, duration)
    keyframe_doors(hinges, stops, duration)
    bpy.context.scene.frame_set(bpy.context.scene.frame_start)

    # ── Export ─────────────────────────────────────────────────────────────
    to_three, numbers = three_transform(hall)
    print()
    print(f"── TRANSFORM " + "─" * 52)
    print(f"  scale {numbers['scale']:.6f}   offset {[round(v, 3) for v in numbers['offset']]}")

    manifest = write_manifest(
        MANIFEST_JSON, path, stops, hall, door, tables, hinges, (to_three, numbers)
    )
    print(f"  manifest → {MANIFEST_JSON}  ({len(manifest['samples'])} samples)")

    export_gltf(RIGGED_GLB)
    print(f"  rigged model → {RIGGED_GLB}")

    blend_path = os.path.join(OUT_DIR, "hogwarts_scroll_tour.blend")
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"  blend → {blend_path}")

    if do_render:
        preview = os.path.join(OUT_DIR, "hogwarts_scroll_tour.mp4")
        print(f"  rendering preview → {preview}")
        render_preview(preview)
        print("  render finished.")

    print()
    print("Done.")


if __name__ == "__main__":
    main()
