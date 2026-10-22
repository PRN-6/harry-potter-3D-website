"""
Throwaway probe: split the welded door into two leaves, and swing them.

`Material3.010` is a single WELDED slab — `separate(type='LOOSE')` gives
one part — so the leaves have to be cut with a geometric bisect down the
middle of the door instead.

This probe:
  * bisects the door at its centre X, keeping each side
  * colours the two leaves red and green
  * renders the doorway from INSIDE the hall, from OUTSIDE it, and from
    above — for both the closed and the swung-open state

The outside view matters: the camera has to START out there, so there
must be something to look at.
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
assert door is not None

w = obj_world_bounds(door)
x0, x1 = float(w[:, 0].min()), float(w[:, 0].max())
y0, y1 = float(w[:, 1].min()), float(w[:, 1].max())
z0, z1 = float(w[:, 2].min()), float(w[:, 2].max())
mid_x = (x0 + x1) * 0.5
print(f"door x {x0:.1f}..{x1:.1f}  mid_x {mid_x:.1f}")
print(f"door y {y0:.1f}..{y1:.1f}   z {z0:.1f}..{z1:.1f}")

# ── Split the door at mid_x ────────────────────────────────────────────────
# Work on a duplicate so the original stays intact for comparison.
left = door.copy()
left.data = door.data.copy()
left.name = "DoorLeaf_L"
scn.collection.objects.link(left)

right = door.copy()
right.data = door.data.copy()
right.name = "DoorLeaf_R"
scn.collection.objects.link(right)


def bisect_keep(ob, keep_negative_x):
    """Bisect the mesh on the plane x = mid_x, keeping one side."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bisect(
        plane_co=(mid_x, 0.0, 0.0),
        plane_no=(1.0, 0.0, 0.0),
        use_fill=False,
        # clear_inner removes the +X side; clear_outer removes the -X side.
        clear_inner=keep_negative_x,
        clear_outer=not keep_negative_x,
    )
    bpy.ops.object.mode_set(mode="OBJECT")


bisect_keep(left, keep_negative_x=True)
bisect_keep(right, keep_negative_x=False)

for ob, label in ((left, "LEFT (x < mid)"), (right, "RIGHT (x > mid)")):
    ww = obj_world_bounds(ob)
    print(f"{label}: {label:<18} verts {len(ob.data.vertices):5d} "
          f"polys {len(ob.data.polygons):5d} "
          f"x {ww[:,0].min():7.1f}..{ww[:,0].max():7.1f}  "
          f"y {ww[:,1].min():7.1f}..{ww[:,1].max():7.1f}  "
          f"z {ww[:,2].min():6.1f}..{ww[:,2].max():6.1f}")

# ── Colour them ────────────────────────────────────────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


RED = flat_mat("L", (0.85, 0.12, 0.12))
GREEN = flat_mat("R", (0.12, 0.8, 0.2))
GREY = flat_mat("G", (0.55, 0.55, 0.58))

left.data.materials.clear()
left.data.materials.append(RED)
right.data.materials.clear()
right.data.materials.append(GREEN)
for ob in scn.objects:
    if ob.type == "MESH" and ob not in (left, right):
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1300
scn.render.resolution_y = 950
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_Z = (z0 + z1) * 0.5


def shoot(name, loc, look, lens=32.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# Inside the hall, looking at the entrance (+Y direction).
shoot("split_inside", (mid_x, y0 - 900.0, DOOR_Z), (mid_x, y0, DOOR_Z), lens=42.0)
# Outside the door, looking back in (-Y direction). This is where the
# camera STARTS.
shoot("split_outside", (mid_x, y0 + 700.0, DOOR_Z), (mid_x, y0, DOOR_Z), lens=42.0)
# A three-quarter view from outside, so the door's depth is readable.
shoot("split_outside_3q", (mid_x - 320.0, y0 + 620.0, DOOR_Z + 120.0), (mid_x, y0, DOOR_Z), lens=35.0)
# Plan of the doorway.
cd.type = "ORTHO"
cd.ortho_scale = 460.0
cam.location = (mid_x, (y0 + y1) * 0.5, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "split_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)
cd.type = "PERSP"

# ── Swing the leaves open ──────────────────────────────────────────────────
# The hall is at LOWER Y, so the outside is at HIGHER Y. The leaves must
# swing toward +Y, i.e. outward, toward the camera.
def build_hinge(name, leaf, hinge_x, angle):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 30.0
    scn.collection.objects.link(empty)
    empty.location = (hinge_x, y0, z0)
    empty.rotation_mode = "XYZ"
    leaf.parent = empty
    leaf.matrix_parent_inverse = empty.matrix_world.inverted()
    empty.rotation_euler = (0.0, 0.0, angle)
    return empty


build_hinge("HingeL", left, x0, math.radians(100.0))
build_hinge("HingeR", right, x1, math.radians(-100.0))

shoot("split_swung_inside", (mid_x, y0 - 900.0, DOOR_Z), (mid_x, y0, DOOR_Z), lens=42.0)
shoot("split_swung_outside", (mid_x, y0 + 700.0, DOOR_Z), (mid_x, y0, DOOR_Z), lens=42.0)
cd.type = "ORTHO"
cd.ortho_scale = 560.0
cam.location = (mid_x, (y0 + y1) * 0.5, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "split_swung_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
