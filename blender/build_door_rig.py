"""
THE GREAT HALL — DOOR RIG BUILDER
==================================

Turns the raw hall model into one the website can animate.

WHAT THE MODEL ACTUALLY LOOKS LIKE
----------------------------------
Three facts, each established by measurement rather than by eye:

  1. THE VISIBLE DOOR LIVES IN THE WALL. The great door is not a
     separate object standing in an opening — it is a panelled relief
     carried by the end wall's own mesh, and the wall behind it is
     SOLID. A ray fired at the doorway from outside the building hits
     the wall at its outer face and stops.

  2. THE WALL IS AN OPEN SHELL. 67,164 of its 70,344 edges are used
     exactly once. This is how SketchUp exports: neighbouring faces do
     not share vertices, so the surface has no inside and no outside.
     A Boolean modifier cannot cut it — the EXACT solver needs to know
     which side of a face is the interior, and on an open shell that
     question has no answer. This is why every attempt to Boolean the
     doorway out did nothing at all.

  3. THERE IS ALSO A DOOR SLAB. A separate object stands in the same
     place, carrying the same stiles and the same ring handles. It is
     the clean, separable version of the door, and it is the thing to
     animate.

So the doorway is cut by FACE DELETION, not by Boolean: the wall's
faces that belong to the door are removed, which leaves a genuine hole.

THE PIPELINE
------------
  1. find the entrance — the high-Y end of the hall — and the door slab
     standing in it
  2. rasterise the slab's own faces to get the door's exact silhouette
  3. delete the wall's faces inside that silhouette, escalating until
     a ray from outside actually reaches the far end of the hall
  4. bisect the slab into two leaves (it is one welded mesh, so
     connectivity cannot split it — only a geometric cut can)
  5. hang each leaf on a hinge empty, and export them
  6. write the doorway's position in three.js world space, so the
     website can put the camera exactly outside the doors

RUNNING IT
-----------
    blender --background --python blender/build_door_rig.py
    blender --background --python blender/build_door_rig.py -- --report

THE ORIENTATION
----------------
    In the source model the hall runs along Blender's Y axis:
        HIGH Y = the entrance and the great gothic door
        LOW  Y = the High Table wall
    The glTF file rotates that into three.js's Y-up space, so the
    entrance ends up at three.js -Z. The rig below is built in
    Blender's space and converted on the way out.
"""

import json
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

# ═══════════════════════════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEFAULT_MODEL = os.path.join(PROJECT_ROOT, "blender", "source", "undifined.glb")
RIGGED_GLB = os.path.join(PROJECT_ROOT, "public", "models", "hogwarts_dining_hall_rigged.glb")
MANIFEST_JSON = os.path.join(PROJECT_ROOT, "public", "data", "hall-door.json")
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

# MUST match `TARGET_LENGTH` in src/three/DiningHallModel.tsx. The
# manifest's coordinates are only right if the two agree.
TARGET_LENGTH = 56.0

# The names the website looks for.
HINGE_LEFT = "DoorHinge_L"
HINGE_RIGHT = "DoorHinge_R"

# How far the leaves swing open, in radians.
DOOR_OPEN_ANGLE = math.radians(100.0)

# The resolution of the door's silhouette raster, in model units.
RASTER_STEP = 0.5


# ═══════════════════════════════════════════════════════════════════════════
#  ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════


def script_args():
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


def to_world(mw, points):
    """Transforms an (N, 3) array of local points into world space."""
    pts = np.asarray(points, dtype=np.float64)
    return pts @ mw[:3, :3].T + mw[:3, 3]


def mesh_matrix(ob):
    return np.array(ob.matrix_world, dtype=np.float64)


def world_verts(ob):
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    return to_world(mesh_matrix(ob), local)


def world_bounds(ob):
    w = world_verts(ob)
    if w.size == 0:
        return np.zeros(3), np.zeros(3)
    return w.min(axis=0), w.max(axis=0)


def scene_bounds(objs):
    chunks = [world_verts(ob) for ob in objs if ob.type == "MESH" and ob.data.vertices]
    if not chunks:
        raise RuntimeError("No geometry in the scene.")
    allv = np.concatenate(chunks, axis=0)
    return allv.min(axis=0), allv.max(axis=0)


def activate(ob):
    """Makes `ob` the only selected, active object, in object mode."""
    if bpy.context.object is not None and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


# ═══════════════════════════════════════════════════════════════════════════
#  DETECTION
# ═══════════════════════════════════════════════════════════════════════════


def detect_entrance(meshes):
    """
    Finds the great door.

    The entrance is at the HIGH-Y end of the hall. The door is the one
    object there that is thin in Y — it fills a hole in the end wall, so
    it is only a few units deep — and wide and tall in the other two
    axes.

    The High Table wall is at the LOW-Y end. The previous version of this
    script had those two the wrong way round and found the wrong door.
    """
    lo, hi = scene_bounds(meshes)
    high_y = float(hi[1])

    best = None
    for ob in meshes:
        if not ob.data.vertices or not ob.data.polygons:
            continue
        mlo, mhi = world_bounds(ob)
        depth = float(mhi[1] - mlo[1])
        width = float(mhi[0] - mlo[0])
        height = float(mhi[2] - mlo[2])

        # The door fills the end wall, so it reaches the end of the hall.
        if mhi[1] < high_y - 40.0:
            continue
        # Thin: it is a slab in a wall, not a room.
        if depth > 40.0:
            continue
        # Big enough to be a door.
        if width < 80.0 or height < 120.0:
            continue

        score = width + height
        if best is None or score > best["score"]:
            best = {
                "object": ob,
                "score": score,
                "x_lo": float(mlo[0]),
                "x_hi": float(mhi[0]),
                "y_lo": float(mlo[1]),
                "y_hi": float(mhi[1]),
                "z_lo": float(mlo[2]),
                "z_hi": float(mhi[2]),
            }

    if best is None:
        raise RuntimeError("Could not find the entrance door.")
    return best


def detect_wall(door, meshes):
    """
    Finds the end wall the door is set into.

    The wall is not found by guessing from the vertex counts — several
    objects span the whole hall. It is found by asking the scene what is
    actually IN FRONT of the doorway: a ray fired at the doorway from
    outside the building lands on the wall, and that is the object to
    cut.
    """
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    mid_x = (door["x_lo"] + door["x_hi"]) * 0.5
    mid_z = (door["z_lo"] + door["z_hi"]) * 0.5
    origin = Vector((mid_x, door["y_hi"] + 400.0, mid_z))
    direction = Vector((0.0, -1.0, 0.0))

    hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(
        depsgraph, origin, direction
    )
    if not hit or obj is None or obj.type != "MESH":
        raise RuntimeError("Nothing blocks the doorway — there is no wall to cut.")

    mlo, mhi = world_bounds(obj)
    return {
        "object": obj,
        "hit_y": float(location.y),
        "x_lo": float(mlo[0]),
        "x_hi": float(mhi[0]),
        "y_lo": float(mlo[1]),
        "y_hi": float(mhi[1]),
        "z_lo": float(mlo[2]),
        "z_hi": float(mhi[2]),
    }


# ═══════════════════════════════════════════════════════════════════════════
#  THE DOOR'S SILHOUETTE
# ═══════════════════════════════════════════════════════════════════════════


def door_silhouette(door):
    """
    Rasterises the door's outline in the XZ plane.

    Every face of the door slab is projected down onto the XZ plane, and
    the cells they cover are marked. The result is the door's exact
    silhouette — including its arched top, which a bounding box would
    flatten into a rectangle and take a bite out of the arch above it.
    """
    ob = door["object"]
    verts = world_verts(ob)

    x0 = door["x_lo"] - 1.0
    x1 = door["x_hi"] + 1.0
    z0 = door["z_lo"] - 1.0
    z1 = door["z_hi"] + 1.0
    nx = max(1, int((x1 - x0) / RASTER_STEP) + 1)
    nz = max(1, int((z1 - z0) / RASTER_STEP) + 1)

    grid = np.zeros((nz, nx), dtype=bool)

    for poly in ob.data.polygons:
        pts = verts[list(poly.vertices)]
        px0, px1 = pts[:, 0].min(), pts[:, 0].max()
        pz0, pz1 = pts[:, 2].min(), pts[:, 2].max()
        ix0 = max(0, int((px0 - x0) / RASTER_STEP))
        ix1 = min(nx - 1, int((px1 - x0) / RASTER_STEP))
        iz0 = max(0, int((pz0 - z0) / RASTER_STEP))
        iz1 = min(nz - 1, int((pz1 - z0) / RASTER_STEP))
        if ix1 >= ix0 and iz1 >= iz0:
            grid[iz0 : iz1 + 1, ix0 : ix1 + 1] = True

    return grid, (x0, z0, RASTER_STEP, nx, nz)


def in_silhouette(grid, geom, x, z):
    """Is the point (x, z) inside the rasterised silhouette?"""
    x0, z0, step, nx, nz = geom
    ix = int((x - x0) / step)
    iz = int((z - z0) / step)
    if ix < 0 or ix >= nx or iz < 0 or iz >= nz:
        return False
    return bool(grid[iz, ix])


def in_box(door, x, z, grow=0.0):
    return (
        door["x_lo"] - grow <= x <= door["x_hi"] + grow
        and door["z_lo"] - grow <= z <= door["z_hi"] + grow
    )


# ═══════════════════════════════════════════════════════════════════════════
#  CUTTING THE OPENING
# ═══════════════════════════════════════════════════════════════════════════


def delete_faces(ob, predicate):
    """Deletes every face of `ob` for which `predicate(x, z, y) is True."""
    mw = mesh_matrix(ob)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()

    doomed = []
    for face in bm.faces:
        c = to_world(mw, [face.calc_center_median()[:]])[0]
        if predicate(c[0], c[2], c[1]):
            doomed.append(face)

    if not doomed:
        bm.free()
        return 0

    bmesh.ops.delete(bm, geom=doomed, context="FACES")
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    return len(doomed)


def ray_through_doorway(door, ignore=None):
    """
    Fires a ray at the doorway from outside and reports every surface it
    hits.

    `ignore` is a set of object names to step over — the door slab, for
    one. The door is SUPPOSED to be in the way while it is closed; what
    must not be in the way is the wall.
    """
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    mid_x = (door["x_lo"] + door["x_hi"]) * 0.5
    mid_z = (door["z_lo"] + door["z_hi"]) * 0.5

    origin = Vector((mid_x, door["y_hi"] + 400.0, mid_z))
    direction = Vector((0.0, -1.0, 0.0))
    hits = []
    for _ in range(40):
        hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(
            depsgraph, origin, direction
        )
        if not hit:
            break
        if obj is not None and obj.type == "MESH":
            if ignore is None or obj.name not in ignore:
                hits.append((obj.name, float(location.y)))
        origin = location + direction * 0.05
    return hits


def doorway_is_open(door, hits):
    """
    The doorway is open if the ray reaches the far end of the hall.

    The door slab itself is stepped over, because a closed door is
    supposed to be in the way — it is the WALL that must not be.
    """
    if not hits:
        return True
    return hits[0][1] < door["y_lo"] - 40.0


def cut_the_opening(door, wall, meshes):
    """
    Removes the wall's door region, escalating until the doorway is
    genuinely open.

    Three passes, each a little more aggressive than the last:

      1. delete the wall faces inside the door's rasterised silhouette
      2. delete every wall face inside the door's bounding box, at any
         depth — this also clears the wall that lies BEHIND the relief
      3. delete every wall face inside the box, extended, to catch the
         jambs
    """
    grid, geom = door_silhouette(door)

    passes = [
        (
            "the door's silhouette",
            lambda x, z, y: in_silhouette(grid, geom, x, z),
        ),
        (
            "the door's bounding box, at any depth",
            lambda x, z, y: in_box(door, x, z),
        ),
        (
            "the door's bounding box, extended by 6",
            lambda x, z, y: in_box(door, x, z, grow=6.0),
        ),
    ]

    for name, predicate in passes:
        removed = delete_faces(wall["object"], predicate)
        bpy.context.view_layer.update()

        hits = ray_through_doorway(door, ignore={door["object"].name})
        if hits:
            summary = ", ".join(f"{n}@y{y:.0f}" for n, y in hits[:4])
        else:
            summary = "(nothing — open to the sky)"
        print(f"  pass '{name}': removed {removed} faces")
        print(f"    ray from outside (past the door) now hits: {summary}")

        if doorway_is_open(door, hits):
            print("    => the doorway is OPEN.")
            return name, removed

    raise RuntimeError(
        "The doorway is still blocked after every pass. The wall cannot be "
        "opened by face deletion, and the camera would walk into masonry."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  SPLITTING AND HINGING THE DOOR
# ═══════════════════════════════════════════════════════════════════════════


def split_door(door):
    """
    Splits the door slab into its two leaves.

    The slab is a single welded mesh, so connectivity cannot split it —
    `separate(type='LOOSE')` returns one part and changes nothing. A
    geometric bisect at the middle can: each half then gets its own
    object, and the cut edge is exactly where the two leaves meet.

    THE COPY MUST KEEP ITS WORLD TRANSFORM
      The slab arrives as a child of the Sketchfab node chain, which
      carries the Z-up rotation. Linking a copy straight to the scene
      collection drops that chain, and the leaf would end up rotated
      into a completely different place — a door hanging in mid-air,
      with a hole in the wall that nothing covers. So the copy's world
      matrix is set explicitly before it is re-parented.
    """
    src = door["object"]
    mid_x = (door["x_lo"] + door["x_hi"]) * 0.5
    src_world = src.matrix_world.copy()

    low = src.copy()
    low.data = src.data.copy()
    low.name = "DoorLeaf_LowX"
    bpy.context.scene.collection.objects.link(low)
    low.matrix_world = src_world.copy()

    high = src.copy()
    high.data = src.data.copy()
    high.name = "DoorLeaf_HighX"
    bpy.context.scene.collection.objects.link(high)
    high.matrix_world = src_world.copy()

    # `clear_inner` removes the geometry BEHIND the plane (-X) and
    # `clear_outer` removes the geometry IN FRONT (+X) — the opposite of
    # what the names suggest.
    #
    # The bisect plane is given in WORLD space, so the leaf's own origin
    # has to sit at the world origin for the cut to land where the door
    # actually is. The leaf's local coordinates are shifted to match, and
    # the origin is moved back afterwards.
    for leaf, keep_negative in ((low, False), (high, True)):
        offset = leaf.matrix_world.translation.copy()
        leaf.data.transform(
            __import__("mathutils").Matrix.Translation(-offset)
        )
        leaf.matrix_world = src_world.copy()
        leaf.data.update()

        activate(leaf)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.bisect(
            plane_co=(mid_x, 0.0, 0.0),
            plane_no=(1.0, 0.0, 0.0),
            use_fill=False,
            clear_inner=keep_negative,
            clear_outer=not keep_negative,
        )
        bpy.ops.object.mode_set(mode="OBJECT")

    # The original is now redundant and would sit on top of the leaves.
    bpy.data.objects.remove(src, do_unlink=True)
    return low, high


def hinge(leaf, name, hinge_x, hinge_y, hinge_z, angle, side):
    """
    Hangs a leaf on an empty at its outer edge.

    The empty sits on the leaf's outer edge and at the door's own depth,
    so rotating the empty swings the leaf exactly like a real door.

    THE LEAF MUST NOT MOVE
      Parenting normally leaves a child where it was, but only if the
      parent inverse is right. The leaf's world matrix is captured
      before the parent is set and restored afterwards, so hanging the
      leaf on the hinge does not shift it by even a millimetre.

    Blender's Z is the room's up axis, so a rotation about +Z is what
    becomes a rotation about +Y in three.js — the site can drive the
    hinge straight from the scroll.
    """
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 30.0
    bpy.context.scene.collection.objects.link(empty)

    empty.location = (hinge_x, hinge_y, hinge_z)
    empty.rotation_mode = "XYZ"
    empty.rotation_euler = (0.0, 0.0, 0.0)

    # Tagged so the website can find the hinge by role, not just by name,
    # and so it knows which way to turn it.
    empty["role"] = "door_hinge"
    empty["side"] = side
    empty["openAngle"] = angle
    empty["hingeAxis"] = "Z"

    leaf_world = leaf.matrix_world.copy()

    activate(leaf)
    leaf.parent = empty
    leaf.matrix_parent_inverse = empty.matrix_world.inverted()
    leaf.matrix_world = leaf_world

    return empty


# ═══════════════════════════════════════════════════════════════════════════
#  THE THREE.JS TRANSFORM
# ═══════════════════════════════════════════════════════════════════════════


def three_transform(meshes):
    """
    Reproduces `fitModel()` from `src/three/DiningHallModel.tsx`.

    Blender (x, y, z) → glTF (x, z, -y) → three.js, then scaled to
    TARGET_LENGTH and centred.
    """
    lo, hi = scene_bounds(meshes)
    size_x = float(hi[0] - lo[0])
    size_z = float(hi[1] - lo[1])
    longest = max(size_x, size_z)
    scale = TARGET_LENGTH / longest

    center_x = (float(lo[0]) + float(hi[0])) * 0.5
    center_z = -(float(lo[1]) + float(hi[1])) * 0.5
    min_y = float(lo[2])

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
        "gltfSize": [size_x, float(hi[2] - lo[2]), size_z],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  EXPORT
# ═══════════════════════════════════════════════════════════════════════════


def export_gltf(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.context.scene.objects:
        if ob.type in {"MESH", "EMPTY"}:
            ob.select_set(True)

    kwargs = {
        "filepath": filepath,
        "export_format": "GLB",
        "use_selection": True,
        "export_extras": True,
        "export_cameras": False,
        "export_lights": False,
        "export_yup": True,
        "export_animations": False,
        "export_apply": True,
    }
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        # Blender renames these from time to time.
        for key in ("export_extras", "export_yup", "export_animations", "export_apply"):
            kwargs.pop(key, None)
        bpy.ops.export_scene.gltf(**kwargs)


def write_manifest(path, door, hinges, transform):
    to_three, numbers = transform

    def span(lo, hi, which):
        if which == "x":
            return [
                round(to_three((lo, 0, 0))[0], 4),
                round(to_three((hi, 0, 0))[0], 4),
            ]
        if which == "y":
            return [
                round(to_three((0, 0, lo))[1], 4),
                round(to_three((0, 0, hi))[1], 4),
            ]
        return [
            round(to_three((0, lo, 0))[2], 4),
            round(to_three((0, hi, 0))[2], 4),
        ]

    manifest = {
        "version": 1,
        "model": {"url": "/models/hogwarts_dining_hall_rigged.glb"},
        "scale": round(numbers["scale"], 8),
        "offset": [round(v, 6) for v in numbers["offset"]],
        "gltfSize": [round(v, 2) for v in numbers["gltfSize"]],
        "doorway": {
            "x": span(door["x_lo"], door["x_hi"], "x"),
            "y": span(door["z_lo"], door["z_hi"], "y"),
            "z": span(door["y_lo"], door["y_hi"], "z"),
        },
        "hinges": {
            HINGE_LEFT: {
                "side": "left",
                "openAngle": round(hinges["left"]["angle"], 5),
                "position": [round(v, 4) for v in to_three(hinges["left"]["position"])],
            },
            HINGE_RIGHT: {
                "side": "right",
                "openAngle": round(hinges["right"]["angle"], 5),
                "position": [round(v, 4) for v in to_three(hinges["right"]["position"])],
            },
        },
    }

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
    return manifest


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════


def main():
    model = flag_value("--model", DEFAULT_MODEL)
    report_only = has_flag("--report")

    if not os.path.isfile(model):
        raise SystemExit(f"Model not found: {model}")

    print("=" * 72)
    print("THE GREAT HALL — DOOR RIG BUILDER")
    print("=" * 72)
    print(f"Model: {model}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=model)
    print("Import finished.")

    meshes = [
        ob for ob in bpy.context.scene.objects
        if ob.type == "MESH" and ob.data.vertices
    ]
    lo, hi = scene_bounds(meshes)
    print(
        f"Hall  x {lo[0]:.1f}..{hi[0]:.1f}   y {lo[1]:.1f}..{hi[1]:.1f}   "
        f"z {lo[2]:.1f}..{hi[2]:.1f}"
    )

    door = detect_entrance(meshes)
    print()
    print("── THE ENTRANCE " + "─" * 49)
    print(f"  door slab  {door['object'].name}")
    print(f"    x {door['x_lo']:.1f} .. {door['x_hi']:.1f}   (width {door['x_hi'] - door['x_lo']:.1f})")
    print(f"    y {door['y_lo']:.1f} .. {door['y_hi']:.1f}   (depth {door['y_hi'] - door['y_lo']:.1f})")
    print(f"    z {door['z_lo']:.1f} .. {door['z_hi']:.1f}   (height {door['z_hi'] - door['z_lo']:.1f})")

    wall = detect_wall(door, meshes)
    print(f"  end wall   {wall['object'].name}   (ray from outside hits it at y={wall['hit_y']:.1f})")
    print(f"    x {wall['x_lo']:.1f} .. {wall['x_hi']:.1f}   "
          f"y {wall['y_lo']:.1f} .. {wall['y_hi']:.1f}")

    if report_only:
        print()
        print("--report given: nothing written.")
        return

    # ── Cut the opening ─────────────────────────────────────────────────────
    print()
    print("── CUTTING THE OPENING " + "─" * 43)
    before = len(wall["object"].data.polygons)
    cut_the_opening(door, wall, meshes)
    after = len(wall["object"].data.polygons)
    print(f"  the wall went from {before} faces to {after}.")

    # ── Split and hinge ─────────────────────────────────────────────────────
    print()
    print("── THE DOOR RIG " + "─" * 48)
    low_leaf, high_leaf = split_door(door)

    # The hinge axis runs vertically at each leaf's outer edge, at the
    # door's own mid-depth.
    hinge_y = (door["y_lo"] + door["y_hi"]) * 0.5
    hinge_z = door["z_lo"]

    # The leaf hinged at the LOW X swings INWARD (towards -Y, the hall) with
    # a NEGATIVE rotation, because +Z rotation carries +X towards +Y.
    # The leaf hinged at the HIGH X swings inward with a POSITIVE rotation.
    left_hinge = hinge(
        low_leaf, HINGE_LEFT, door["x_lo"], hinge_y, hinge_z, -DOOR_OPEN_ANGLE, "left"
    )
    right_hinge = hinge(
        high_leaf, HINGE_RIGHT, door["x_hi"], hinge_y, hinge_z, DOOR_OPEN_ANGLE, "right"
    )

    for leaf, label in ((low_leaf, "left "), (high_leaf, "right")):
        w = world_bounds(leaf)
        print(f"  {label} leaf  x {w[0][0]:7.1f}..{w[1][0]:7.1f}  "
              f"y {w[0][1]:7.1f}..{w[1][1]:7.1f}  "
              f"z {w[0][2]:7.1f}..{w[1][2]:7.1f}  "
              f"{len(leaf.data.polygons):5d} faces")
    print(f"  {HINGE_LEFT}  x={left_hinge.location.x:.1f}  "
          f"angle={left_hinge['openAngle']:.4f}")
    print(f"  {HINGE_RIGHT} x={right_hinge.location.x:.1f}  "
          f"angle={right_hinge['openAngle']:.4f}")

    # ── The leaves must still COVER the hole ────────────────────────────────
    # A door that has drifted out of the doorway leaves the wall open with
    # nothing in front of it, and the visitor walks into the dark.
    closed_hits = ray_through_doorway(door, ignore=set())
    covered = any(
        n.startswith("DoorLeaf") for n, _ in closed_hits
    )
    if not covered:
        raise RuntimeError(
            "The door leaves are not covering the doorway: "
            f"the ray from outside hits {closed_hits[:2]}. "
            "The leaves have moved out of the opening."
        )
    print("  the closed leaves cover the doorway.")

    # ── The manifest ────────────────────────────────────────────────────────
    # The list is rebuilt from the scene, because the original door slab has
    # been removed and a stale reference would raise.
    live = [
        ob for ob in bpy.context.scene.objects
        if ob.type == "MESH" and ob.data.vertices
    ]
    to_three, numbers = three_transform(live)
    print()
    print("── TRANSFORM " + "─" * 50)
    print(f"  scale {numbers['scale']:.6f}   offset {[round(v, 3) for v in numbers['offset']]}")

    manifest = write_manifest(
        MANIFEST_JSON,
        door,
        {
            "left": {"angle": -DOOR_OPEN_ANGLE, "position": tuple(left_hinge.location)},
            "right": {"angle": DOOR_OPEN_ANGLE, "position": tuple(right_hinge.location)},
        },
        (to_three, numbers),
    )
    print(f"  manifest → {MANIFEST_JSON}")
    print("  doorway in three.js space:")
    print(f"    x {manifest['doorway']['x']}")
    print(f"    y {manifest['doorway']['y']}")
    print(f"    z {manifest['doorway']['z']}")

    # ── Export ──────────────────────────────────────────────────────────────
    export_gltf(RIGGED_GLB)
    print(f"  rigged model → {RIGGED_GLB}")

    os.makedirs(OUT_DIR, exist_ok=True)
    blend_path = os.path.join(OUT_DIR, "hogwarts_door_rig.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"  blend → {blend_path}")

    print()
    print("Done.")


if __name__ == "__main__":
    main()
