"""
Throwaway probe: can the entrance doors actually be rigged to swing?

The tour script splits `Material3.009` (the entrance) into loose parts and
classifies them as left leaf / right leaf / static. This probe renders the
split with the three classes in three flat colours, so the classification
can be checked by eye, and then renders the same door with the leaves
swung open to see whether the hinge points are right.

Red   = left leaf
Green = right leaf
Blue  = static (arch, threshold)
"""

import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


def clusters(values, gap):
    v = np.sort(np.asarray(values, dtype=np.float64))
    if v.size == 0:
        return []
    b = np.where(np.diff(v) > gap)[0]
    return [(float(g[0]), float(g[-1])) for g in np.split(v, b + 1) if g.size]


# ── Split the entrance into loose parts ───────────────────────────────────
door = bpy.data.objects.get("Material3.009")
assert door is not None

bpy.ops.object.select_all(action="DESELECT")
door.select_set(True)
bpy.context.view_layer.objects.active = door
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

pieces = [o for o in scn.objects if o.type == "MESH" and o.name.startswith("Material3.009")]
print(f"=== {len(pieces)} LOOSE PARTS ===")

boxes = []
for p in pieces:
    w = obj_world_bounds(p)
    boxes.append((p, w.min(axis=0), w.max(axis=0)))

for p, lo, hi in sorted(boxes, key=lambda t: t[1][0]):
    print(f"  {p.name:<26} polys={len(p.data.polygons):4d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:7.1f}..{hi[2]:7.1f}")

# ── Classify, the same way the tour script does ───────────────────────────
sill = min(b[1][2] for b in boxes)
leaf_height = (max(b[2][2] for b in boxes) - sill) * 0.72
low = [(p, lo, hi) for p, lo, hi in boxes if lo[2] < sill + leaf_height]

spans = sorted((float(lo[0]), float(hi[0])) for _, lo, hi in low)
best_gap = (0.0, 0.0, 0.0)
cursor = spans[0][0]
for lo, hi in spans:
    if lo - cursor > best_gap[0]:
        best_gap = (lo - cursor, cursor, lo)
    cursor = max(cursor, hi)

gap_start, gap_end = best_gap[1], best_gap[2]
print(f"\ndoorway gap: x {gap_start:.1f} .. {gap_end:.1f}  (width {gap_end - gap_start:.1f})")
print(f"sill z = {sill:.1f}, leaf height limit z = {sill + leaf_height:.1f}")

left, right, static = [], [], []
for p, lo, hi in low:
    if lo[0] >= gap_start and hi[0] <= gap_end:
        static.append(p)
    elif hi[0] <= gap_start:
        left.append(p)
    elif lo[0] >= gap_end:
        right.append(p)
    else:
        static.append(p)

for p, lo, hi in boxes:
    if lo[2] >= sill + leaf_height:
        static.append(p)

print(f"left={len(left)}  right={len(right)}  static={len(static)}")

# The outer edge of each leaf is its hinge.
left_hinge = min((obj_world_bounds(p).min(axis=0)[0]) for p in left)
right_hinge = max((obj_world_bounds(p).max(axis=0)[0]) for p in right)
print(f"left hinge  x = {left_hinge:.1f}")
print(f"right hinge x = {right_hinge:.1f}")
print(f"door spans  x = {min(b[1][0] for b in boxes):.1f} .. {max(b[2][0] for b in boxes):.1f}")

# ── Colour them ────────────────────────────────────────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


RED = flat_mat("L", (0.9, 0.12, 0.12))
GREEN = flat_mat("R", (0.12, 0.85, 0.2))
BLUE = flat_mat("S", (0.15, 0.35, 0.95))

for p in left:
    p.data.materials.clear()
    p.data.materials.append(RED)
for p in right:
    p.data.materials.clear()
    p.data.materials.append(GREEN)
for p in static:
    p.data.materials.clear()
    p.data.materials.append(BLUE)

# Everything else in the hall: neutral grey, so the context is visible.
GREY = flat_mat("G", (0.55, 0.55, 0.58))
for ob in scn.objects:
    if ob.type == "MESH" and ob.name.startswith("Material3.009"):
        continue
    ob.data.materials.clear()
    ob.data.materials.append(GREY)

# ── Render ─────────────────────────────────────────────────────────────────
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scn.render.engine = engine
        break
    except TypeError:
        continue
scn.render.resolution_x = 1400
scn.render.resolution_y = 1000
scn.render.image_settings.file_format = "PNG"

if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.4, 0.4, 0.45, 1)
bg.inputs["Strength"].default_value = 1.8

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 4.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (np.radians(45), 0, np.radians(30))
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.lens = 40.0
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_X = (min(b[1][0] for b in boxes) + max(b[2][0] for b in boxes)) * 0.5
DOOR_Y = min(b[1][1] for b in boxes)
DOOR_Z = (min(b[1][2] for b in boxes) + max(b[2][2] for b in boxes)) * 0.5


def shoot(name, loc, look, lens=40.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From inside the hall, looking back at the entrance.
shoot("doors_split_inside", (DOOR_X, 200, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
# From outside, looking in.
shoot("doors_split_outside", (DOOR_X, DOOR_Y - 260, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))

# ── Now try the swing ──────────────────────────────────────────────────────
import math


def build_hinge(name, parts, hinge_x, angle):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 30.0
    scn.collection.objects.link(empty)
    empty.location = (hinge_x, DOOR_Y, sill)
    empty.rotation_mode = "XYZ"
    for part in parts:
        part.parent = empty
        part.matrix_parent_inverse = empty.matrix_world.inverted()
    empty.rotation_euler = (0.0, 0.0, angle)
    return empty


build_hinge("HingeL", left, left_hinge, math.radians(100))
build_hinge("HingeR", right, right_hinge, math.radians(-100))

shoot("doors_swung_inside", (DOOR_X, 200, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
shoot("doors_swung_outside", (DOOR_X, DOOR_Y - 260, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))

print("=== DONE ===")
