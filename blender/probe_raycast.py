"""
Throwaway probe: DECISIVE test for the doorway.

Two things were wrong with the earlier probes:

  1. WORKBENCH's `color_type='MATERIAL'` reads `material.diffuse_color`,
     NOT the Principled BSDF's base colour. Every "flat colour" render
     so far has been grey, so the red/green leaves were never actually
     distinguishable. This probe sets `diffuse_color` as well.

  2. Hiding `Material3.010` still left a panelled door on screen, so
     there is a SECOND panelled surface. The earlier "no geometry behind
     the door" query only looked at y > 1351.9 (behind the slab); this
     second surface must be at y < 1344.7 — INSIDE the hall.

So the question is: is the doorway a real hole, or is the panelled
surface a second door?

The decisive test is a RAY CAST. Fire a ray from outside the building,
through the middle of the doorway, and list every surface it hits. If the
only hit is the door slab, then opening the slab reveals the hall. If
there is a second hit, the doorway is solid.

It also renders the leaves properly coloured, closed and swung.
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
print(f"DOOR SLAB {DOOR_NAME}  x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()

# ── THE RAY CAST ────────────────────────────────────────────────────────────
# Fire a ray from outside the building (large +Y) heading in -Y, through
# the middle of the doorway.
print()
print("=== RAY CAST: from outside, through the doorway ===")
origin = Vector((mid_x, DY1 + 400.0, mid_z))
direction = Vector((0.0, -1.0, 0.0))
hit, location, normal, index, obj, matrix = scn.ray_cast(depsgraph, origin, direction)
distance = 0.0
step = 0
while hit and step < 40:
    if obj is not None and obj.type == "MESH":
        print(f"  hit at y={location.y:9.1f}  object={obj.name:<22} "
              f"poly={index}  normal=({normal.x:+.2f},{normal.y:+.2f},{normal.z:+.2f})")
    distance = (location - origin).length
    origin = location + direction * 0.05
    hit, location, normal, index, obj, matrix = scn.ray_cast(
        depsgraph, origin, direction
    )
    step += 1

# ── The same ray, but at a few heights and offsets ─────────────────────────
print()
print("=== RAY CAST at several points across the doorway ===")
for label, (ox, oz) in (
    ("centre", (mid_x, mid_z)),
    ("left of centre", (mid_x - 60.0, mid_z)),
    ("right of centre", (mid_x + 60.0, mid_z)),
    ("low centre", (mid_x, DZ0 + 40.0)),
    ("high centre", (mid_x, DZ1 - 40.0)),
):
    hits = []
    o = Vector((ox, DY1 + 400.0, oz))
    d = Vector((0.0, -1.0, 0.0))
    for _ in range(30):
        hit, loc, nrm, idx, obj, _m = scn.ray_cast(depsgraph, o, d)
        if not hit:
            break
        if obj is not None and obj.type == "MESH":
            hits.append((obj.name, round(loc.y, 1)))
        o = loc + d * 0.05
    summary = ", ".join(f"{n}@y{y}" for n, y in hits)
    print(f"  {label:<16} {summary if summary else '(nothing — open to the sky)'}")

# ── What is at each hit's Y? Group the objects by their Y extent ───────────
print()
print("=== OBJECTS WITH GEOMETRY IN THE DOORWAY FOOTPRINT (any Y) ===")
FOOT_X0, FOOT_X1 = DX0 - 5.0, DX1 + 5.0
FOOT_Z0, FOOT_Z1 = DZ0 - 5.0, DZ1 + 5.0
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    ww = obj_world_bounds(ob)
    inside = (
        (ww[:, 0] >= FOOT_X0) & (ww[:, 0] <= FOOT_X1)
        & (ww[:, 2] >= FOOT_Z0) & (ww[:, 2] <= FOOT_Z1)
    )
    count = int(inside.sum())
    if count < 20:
        continue
    ys = ww[inside][:, 1]
    print(f"  {ob.name:<22} {count:6d} verts  y {ys.min():8.1f}..{ys.max():8.1f}  "
          f"(object spans y {ww[:,1].min():.1f}..{ww[:,1].max():.1f})")

# ── The renders, with the colours actually applied ─────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    # WORKBENCH reads the VIEWPORT display colour, not the node colour.
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    return mat


RED = flat_mat("L", (0.9, 0.1, 0.1))
GREEN = flat_mat("R", (0.1, 0.85, 0.15))
GREY = flat_mat("G", (0.55, 0.55, 0.58))

# Split the door into two leaves.
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
    print(f"  leaf {ob.name}: x {ww[:,0].min():.1f}..{ww[:,0].max():.1f}  "
          f"polys {len(ob.data.polygons)}")

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


shoot("ray_closed_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)
shoot("ray_closed_inside", (mid_x, DY1 - 900.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)

# Swing: the hall is at LOWER Y, so a leaf at LOW X hinges at x0 and opens
# with a negative Z rotation; the leaf at HIGH X hinges at x1 and opens
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

shoot("ray_swung_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)
shoot("ray_swung_inside", (mid_x, DY1 - 900.0, mid_z), (mid_x, DY1, mid_z), lens=45.0)
shoot("ray_swung_walk", (mid_x, DY1 - 200.0, mid_z), (mid_x, DY1 - 900.0, mid_z), lens=45.0)

print("=== DONE ===")
