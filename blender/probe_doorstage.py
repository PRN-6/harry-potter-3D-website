"""
Throwaway probe: can the camera actually walk through the doorway?

Two things have to be true for the "start outside, doors open, walk in"
animation to work:

  1. There must be an OPENING behind the door. The door slab is set into
     the end wall; if the wall behind it is solid, opening the door
     reveals a blank wall and the camera would walk through masonry.
  2. The split leaves must actually move. (The last probe failed to show
     that because the original, un-split door was still in the scene
     hiding them.)

So this probe:
  * renders the doorway from OUTSIDE with the door REMOVED  -> is there a hole?
  * splits the door, colours the two leaves, and renders them
    CLOSED and SWUNG INWARD, from outside and from inside.

WORKBENCH is set to color_type='MATERIAL' this time. With 'OBJECT' the
engine ignores the material colours entirely, which is why the leaves
came out grey before.
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
mid_z = (z0 + z1) * 0.5
print(f"door x {x0:.1f}..{x1:.1f}  y {y0:.1f}..{y1:.1f}  z {z0:.1f}..{z1:.1f}")
print(f"mid_x {mid_x:.1f}  mid_z {mid_z:.1f}")


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
DOORGREY = flat_mat("D", (0.85, 0.75, 0.45))

# ── 1. Is there an opening behind the door? ─────────────────────────────────
# Hide the door and look at the end wall from outside.
door.hide_render = True
door.hide_viewport = True

for ob in scn.objects:
    if ob.type == "MESH" and ob is not door:
        ob.data.materials.clear()
        ob.data.materials.append(GREY)
door.data.materials.clear()
door.data.materials.append(DOORGREY)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1100
scn.render.resolution_y = 900
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam


def shoot(name, loc, look, lens=40.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From outside the building, looking back at the end wall.
shoot("nodoor_outside", (mid_x, y0 + 650.0, mid_z), (mid_x, y0, mid_z), lens=45.0)
# From inside the hall, looking at the end wall.
shoot("nodoor_inside", (mid_x, y0 - 900.0, mid_z), (mid_x, y0, mid_z), lens=45.0)

# ── 2. Split the door and swing the leaves ─────────────────────────────────
door.hide_render = False
door.hide_viewport = False

left = door.copy()
left.data = door.data.copy()
left.name = "DoorLeaf_L"
scn.collection.objects.link(left)

right = door.copy()
right.data = door.data.copy()
right.name = "DoorLeaf_R"
scn.collection.objects.link(right)


def bisect_keep(ob, keep_negative_x):
    """Bisect on the plane x = mid_x.

    `clear_inner` removes the geometry BEHIND the plane (the -X side) and
    `clear_outer` removes the geometry IN FRONT (the +X side) — the
    opposite of what the names suggest.
    """
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bisect(
        plane_co=(mid_x, 0.0, 0.0),
        plane_no=(1.0, 0.0, 0.0),
        use_fill=False,
        clear_inner=keep_negative_x,
        clear_outer=not keep_negative_x,
    )
    bpy.ops.object.mode_set(mode="OBJECT")


bisect_keep(left, keep_negative_x=False)   # keeps +X half
bisect_keep(right, keep_negative_x=True)   # keeps -X half

for ob, label in ((left, "+X half"), (right, "-X half")):
    ww = obj_world_bounds(ob)
    print(f"{label}: verts {len(ob.data.vertices):5d} polys {len(ob.data.polygons):5d} "
          f"x {ww[:,0].min():7.1f}..{ww[:,0].max():7.1f}  "
          f"y {ww[:,1].min():7.1f}..{ww[:,1].max():7.1f}  "
          f"z {ww[:,2].min():6.1f}..{ww[:,2].max():6.1f}")

# The original door is now redundant — remove it so it cannot hide the
# leaves.
bpy.data.objects.remove(door, do_unlink=True)

right.data.materials.clear()
right.data.materials.append(RED)
left.data.materials.clear()
left.data.materials.append(GREEN)
for ob in scn.objects:
    if ob.type == "MESH" and ob not in (left, right):
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

shoot("door2_closed_outside", (mid_x, y0 + 650.0, mid_z), (mid_x, y0, mid_z), lens=45.0)
shoot("door2_closed_inside", (mid_x, y0 - 900.0, mid_z), (mid_x, y0, mid_z), lens=45.0)

# ── The swing ──────────────────────────────────────────────────────────────
# The hall is at LOWER Y. So "inward" (into the hall) is -Y.
# A rotation about +Z takes +X toward +Y, so:
#   the leaf hinged at the LOW x swings INWARD with a NEGATIVE angle,
#   the leaf hinged at the HIGH x swings INWARD with a POSITIVE angle.
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


build_hinge("HingeLowX", right, x0, math.radians(-100.0))
build_hinge("HingeHighX", left, x1, math.radians(100.0))

shoot("door2_swung_outside", (mid_x, y0 + 650.0, mid_z), (mid_x, y0, mid_z), lens=45.0)
shoot("door2_swung_inside", (mid_x, y0 - 900.0, mid_z), (mid_x, y0, mid_z), lens=45.0)
shoot("door2_swung_walk", (mid_x, y0 + 250.0, mid_z), (mid_x, y0 - 300.0, mid_z), lens=45.0)

cd.type = "ORTHO"
cd.ortho_scale = 520.0
cam.location = (mid_x, (y0 + y1) * 0.5, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "door2_swung_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
