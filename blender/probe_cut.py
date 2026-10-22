"""
Throwaway probe: cut a REAL opening in the end wall.

THE PROBLEM
   The ray cast from outside the building hits `Material2.001` — the end
   WALL — at y=1349.7, right where the door slab stands. So the doorway
   is only a recess: the wall is solid behind the door, and the panelled
   surface we see is the wall's own arch-and-panels carving.

   The door can swing, but opening it would reveal masonry, and a camera
   walking forward would pass through a wall.

THE FIX
   Boolean-difference a cutter box out of the wall, so the doorway
   becomes a real hole. The door leaves then cover the hole when closed,
   and when they swing open the hall is revealed.

This probe:
  * measures the wall's inner and outer surfaces at the doorway
  * cuts the hole with a Boolean modifier
  * splits the door into two leaves and hangs them on hinges
  * renders: outside, closed | outside, open | inside, open | walking in
"""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\undifined.glb"
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
DX0, DX1 = float(w[:, 0].min()), float(w[:, 0].max())
DY0, DY1 = float(w[:, 1].min()), float(w[:, 1].max())
DZ0, DZ1 = float(w[:, 2].min()), float(w[:, 2].max())
mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5
print(f"DOOR  x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()

# ── The wall's inner surface, from inside the hall ─────────────────────────
print()
print("=== RAY CAST from inside the hall, toward the door ===")
for label, oz in (("centre", mid_z), ("low", DZ0 + 30.0), ("high", DZ1 - 30.0)):
    o = Vector((mid_x, DY0 - 800.0, oz))
    d = Vector((0.0, 1.0, 0.0))
    hits = []
    for _ in range(25):
        hit, loc, nrm, idx, obj, _m = scn.ray_cast(dg, o, d)
        if not hit:
            break
        if obj is not None and obj.type == "MESH":
            hits.append(f"{obj.name}@y{loc.y:.1f}")
        o = loc + d * 0.05
    print(f"  {label:<8} {', '.join(hits) if hits else '(nothing)'}")

# ── Cut the hole ───────────────────────────────────────────────────────────
# The cutter is a box that spans the doorway's opening and cuts clean
# through the wall's thickness.
INSET = 3.0
CUT_X0, CUT_X1 = DX0 + INSET, DX1 - INSET
CUT_Z0, CUT_Z1 = DZ0 + INSET, DZ1 - INSET
CUT_Y0, CUT_Y1 = DY0 - 60.0, DY1 + 60.0

print()
print(f"=== CUTTING A HOLE  x {CUT_X0:.1f}..{CUT_X1:.1f}  z {CUT_Z0:.1f}..{CUT_Z1:.1f} ===")

cutter = bpy.data.meshes.new("Cutter")
cutter_obj = bpy.data.objects.new("Cutter", cutter)
scn.collection.objects.link(cutter_obj)
# Build a box in world space.
verts = [
    (CUT_X0, CUT_Y0, CUT_Z0), (CUT_X1, CUT_Y0, CUT_Z0),
    (CUT_X1, CUT_Y1, CUT_Z0), (CUT_X0, CUT_Y1, CUT_Z0),
    (CUT_X0, CUT_Y0, CUT_Z1), (CUT_X1, CUT_Y0, CUT_Z1),
    (CUT_X1, CUT_Y1, CUT_Z1), (CUT_X0, CUT_Y1, CUT_Z1),
]
faces = [
    (0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1),
    (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0),
]
cutter.from_pydata(verts, [], faces)
cutter.update()

# Which objects does the cutter overlap? Only those get the boolean.
targets = []
for ob in scn.objects:
    if ob.type != "MESH" or ob is door or ob is cutter_obj:
        continue
    ww = obj_world_bounds(ob)
    if ww[:, 0].max() < CUT_X0 or ww[:, 0].min() > CUT_X1:
        continue
    if ww[:, 2].max() < CUT_Z0 or ww[:, 2].min() > CUT_Z1:
        continue
    if ww[:, 1].max() < CUT_Y0 or ww[:, 1].min() > CUT_Y1:
        continue
    targets.append(ob)
    print(f"  boolean target: {ob.name}")

for ob in targets:
    mod = ob.modifiers.new("Doorway", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter_obj
    mod.solver = "EXACT"

bpy.context.view_layer.objects.active = targets[0] if targets else None
for ob in targets:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=ob.modifiers["Doorway"].name)
    print(f"  applied to {ob.name}: {len(ob.data.polygons)} polys")

bpy.data.objects.remove(cutter_obj, do_unlink=True)

# ── Ray cast again: is the doorway open now? ───────────────────────────────
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
print()
print("=== RAY CAST from outside, through the doorway, AFTER the cut ===")
o = Vector((mid_x, DY1 + 400.0, mid_z))
d = Vector((0.0, -1.0, 0.0))
for _ in range(25):
    hit, loc, nrm, idx, obj, _m = scn.ray_cast(dg, o, d)
    if not hit:
        print("  nothing — the doorway is OPEN to the sky")
        break
    if obj is not None and obj.type == "MESH":
        print(f"  hit y={loc.y:9.1f}  {obj.name}")
    o = loc + d * 0.05

# ── Split the door and hang the leaves ─────────────────────────────────────
left = door.copy()
left.data = door.data.copy()
left.name = "DoorLeaf_L"
scn.collection.objects.link(left)
right = door.copy()
right.data = door.data.copy()
right.name = "DoorLeaf_R"
scn.collection.objects.link(right)


def bisect_keep(ob, keep_negative_x):
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


bisect_keep(left, keep_negative_x=False)
bisect_keep(right, keep_negative_x=True)
bpy.data.objects.remove(door, do_unlink=True)
for ob in (left, right):
    ww = obj_world_bounds(ob)
    print(f"  {ob.name}: x {ww[:,0].min():.1f}..{ww[:,0].max():.1f}  polys {len(ob.data.polygons)}")


def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    return mat


RED = flat_mat("L", (0.9, 0.1, 0.1))
GREEN = flat_mat("R", (0.1, 0.85, 0.15))
GREY = flat_mat("G", (0.55, 0.55, 0.58))

right.data.materials.clear()
right.data.materials.append(RED)
left.data.materials.clear()
left.data.materials.append(GREEN)
for ob in scn.objects:
    if ob.type == "MESH" and ob not in (left, right):
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1200
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


shoot("cut_closed_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)

# Hinges: the leaf at LOW x hinges at DX0 and swings INWARD (-Y) with a
# negative Z rotation; the leaf at HIGH x hinges at DX1 and swings inward
# with a positive rotation.
def build_hinge(name, leaf, hinge_x, angle):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 30.0
    scn.collection.objects.link(empty)
    empty.location = (hinge_x, DY0, DZ0)
    empty.rotation_mode = "XYZ"
    leaf.parent = empty
    leaf.matrix_parent_inverse = empty.matrix_world.inverted()
    empty.rotation_euler = (0.0, 0.0, angle)
    return empty


build_hinge("HingeLowX", right, DX0, math.radians(-100.0))
build_hinge("HingeHighX", left, DX1, math.radians(100.0))

shoot("cut_open_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)
shoot("cut_open_inside", (mid_x, DY1 - 900.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)
shoot("cut_open_walk", (mid_x, DY1 - 200.0, mid_z), (mid_x, DY1 - 900.0, mid_z), lens=45.0)
shoot("cut_open_walk2", (mid_x, DY1 - 500.0, mid_z), (mid_x, DY1 - 1400.0, mid_z), lens=45.0)

print("=== DONE ===")
