"""
Throwaway probe: the entrance door, and whether it can be rigged.

`Material3.010` sits at the HIGH-Y end of the hall (y 1344..1352) — that
is the grand gothic doorway. `Material3.009`, which the tour script
currently picks, sits at the LOW-Y end: that is the High Table.

This probe splits the entrance into loose parts, classifies them the way
the tour script does, and renders the result with the two leaves in
different flat colours — then renders the leaves swung open on their
hinges, so the hinge points can be checked by eye.

Red   = left leaf
Green = right leaf
Blue  = static (arch, threshold)
"""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\blender\source\undifined.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

DOOR_NAME = "Material3.010"


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


door = bpy.data.objects.get(DOOR_NAME)
assert door is not None, f"{DOOR_NAME} not found"

bpy.ops.object.select_all(action="DESELECT")
door.select_set(True)
bpy.context.view_layer.objects.active = door
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

parts = [o for o in scn.objects if o.type == "MESH" and o.name.startswith(DOOR_NAME)]
boxes = [(p,) + tuple(obj_world_bounds(p).min(axis=0)) + tuple(obj_world_bounds(p).max(axis=0))
         for p in parts]

print(f"=== {len(parts)} LOOSE PARTS of {DOOR_NAME} ===")
for p, lo, hi in sorted(boxes, key=lambda b: b[1]):
    print(f"  {p.name:<28} polys={len(p.data.polygons):5d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:6.1f}..{hi[2]:6.1f}")

sill = min(b[3] for b in boxes)
top = max(b[6] for b in boxes)
leaf_height = (top - sill) * 0.72
low = [b for b in boxes if b[3] < sill + leaf_height]

spans = sorted((b[1], b[4]) for b in low)
best_gap = (0.0, 0.0, 0.0)
cursor = spans[0][0]
for lo, hi in spans:
    if lo - cursor > best_gap[0]:
        best_gap = (lo - cursor, cursor, lo)
    cursor = max(cursor, hi)

gap_start, gap_end = best_gap[1], best_gap[2]
print(f"\nsill z={sill:.1f}  top z={top:.1f}  leaf height limit z={sill + leaf_height:.1f}")
print(f"doorway gap: x {gap_start:.1f} .. {gap_end:.1f}  (width {gap_end - gap_start:.1f})")

left, right, static = [], [], []
for b in low:
    p, lo, hi = b[0], b[1:4], b[4:7]
    if lo[0] >= gap_start and hi[0] <= gap_end:
        static.append(p)
    elif hi[0] <= gap_start:
        left.append(p)
    elif lo[0] >= gap_end:
        right.append(p)
    else:
        static.append(p)
for b in boxes:
    if b[3] >= sill + leaf_height:
        static.append(b[0])

print(f"left={len(left)}  right={len(right)}  static={len(static)}")
if left:
    print(f"  left  spans x {min(obj_world_bounds(p)[:,0].min() for p in left):.1f}"
          f" .. {max(obj_world_bounds(p)[:,0].max() for p in left):.1f}")
if right:
    print(f"  right spans x {min(obj_world_bounds(p)[:,0].min() for p in right):.1f}"
          f" .. {max(obj_world_bounds(p)[:,0].max() for p in right):.1f}")


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
GREY = flat_mat("G", (0.55, 0.55, 0.58))

for p in left:
    p.data.materials.clear()
    p.data.materials.append(RED)
for p in right:
    p.data.materials.clear()
    p.data.materials.append(GREEN)
for p in static:
    p.data.materials.clear()
    p.data.materials.append(BLUE)
for ob in scn.objects:
    if ob.type == "MESH" and not ob.name.startswith(DOOR_NAME):
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1400
scn.render.resolution_y = 950
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_X = (min(b[1] for b in boxes) + max(b[4] for b in boxes)) * 0.5
DOOR_Y = min(b[2] for b in boxes)
DOOR_Z = (min(b[3] for b in boxes) + max(b[6] for b in boxes)) * 0.5


def shoot(name, loc, look, lens=35.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From inside the hall, looking back at the entrance (looking toward +Y).
shoot("fix_inside", (DOOR_X, DOOR_Y - 420, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
# From outside, looking in (looking toward -Y).
shoot("fix_outside", (DOOR_X, DOOR_Y + 320, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
# Plan of the doorway, so the leaves' footprints are obvious.
cd.type = "ORTHO"
cd.ortho_scale = 420.0
cam.location = (DOOR_X, DOOR_Y, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "fix_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)
cd.type = "PERSP"

# ── Now the swing ───────────────────────────────────────────────────────────
if left and right:
    left_hinge = min(obj_world_bounds(p)[:, 0].min() for p in left)
    right_hinge = max(obj_world_bounds(p)[:, 0].max() for p in right)

    def build_hinge(name, pieces, hinge_x, angle):
        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = "PLAIN_AXES"
        empty.empty_display_size = 30.0
        scn.collection.objects.link(empty)
        empty.location = (hinge_x, DOOR_Y, sill)
        empty.rotation_mode = "XYZ"
        for piece in pieces:
            piece.parent = empty
            piece.matrix_parent_inverse = empty.matrix_world.inverted()
        empty.rotation_euler = (0.0, 0.0, angle)
        return empty

    build_hinge("HingeL", left, left_hinge, math.radians(100))
    build_hinge("HingeR", right, right_hinge, math.radians(-100))

    shoot("fix_swung_inside", (DOOR_X, DOOR_Y - 420, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
    shoot("fix_swung_outside", (DOOR_X, DOOR_Y + 320, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z))
    cd.type = "ORTHO"
    cd.ortho_scale = 520.0
    cam.location = (DOOR_X, DOOR_Y, 1200.0)
    cam.rotation_euler = (0.0, 0.0, 0.0)
    scn.render.filepath = os.path.join(OUT, "fix_swung_plan.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)

print("=== DONE ===")
