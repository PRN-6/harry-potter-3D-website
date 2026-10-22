"""
Throwaway probe: WHAT IS INSIDE THE END WALL?

The ray cast says the end wall is SOLID at the doorway. The visible
panelled door is part of that same wall mesh. So the wall mesh must
contain BOTH the wall and the door as disconnected shells, and to open
the door we have to separate them and cut the wall.

This probe:
  1. reports every mesh in the scene with its world bounds
  2. separates the wall into loose parts and lists each shell
  3. identifies the shells that make up the doorway
  4. renders the wall alone, from outside, so we can see it plainly

"""

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

WALL = "Material2.001"
DOOR = "Material3.010"


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


meshes = [ob for ob in scn.objects if ob.type == "MESH" and ob.data.vertices]

allv = np.concatenate([obj_world_bounds(ob) for ob in meshes], axis=0)
print("SCENE BOUNDS")
print(f"  x {allv[:,0].min():.1f} .. {allv[:,0].max():.1f}")
print(f"  y {allv[:,1].min():.1f} .. {allv[:,1].max():.1f}")
print(f"  z {allv[:,2].min():.1f} .. {allv[:,2].max():.1f}")

print()
print("=== ALL MESHES, sorted by y (the hall runs along y) ===")
rows = []
for ob in meshes:
    w = obj_world_bounds(ob)
    rows.append((float(w[:, 1].min()), ob, w))
rows.sort(key=lambda t: t[0])
for ymin, ob, w in rows:
    print(
        f"  {ob.name:<24} y {w[:,1].min():8.1f}..{w[:,1].max():8.1f}"
        f"  x {w[:,0].min():8.1f}..{w[:,0].max():8.1f}"
        f"  z {w[:,2].min():7.1f}..{w[:,2].max():7.1f}"
        f"  verts {len(ob.data.vertices):6d} polys {len(ob.data.polygons):6d}"
    )

# ── The wall, in detail ────────────────────────────────────────────────────
wall = bpy.data.objects.get(WALL)
door = bpy.data.objects.get(DOOR)
assert wall is not None

ww = obj_world_bounds(wall)
dw = obj_world_bounds(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5

print()
print(f"DOOR SLAB {DOOR}: x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")
print(f"WALL {WALL}: x {ww[:,0].min():.1f}..{ww[:,0].max():.1f}  "
      f"y {ww[:,1].min():.1f}..{ww[:,1].max():.1f}  z {ww[:,2].min():.1f}..{ww[:,2].max():.1f}")

# ── Separate the wall into loose parts ─────────────────────────────────────
print()
print("=== SEPARATING THE WALL INTO LOOSE PARTS ===")
bpy.ops.object.select_all(action="DESELECT")
wall.select_set(True)
bpy.context.view_layer.objects.active = wall
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

parts = [ob for ob in scn.objects if ob.type == "MESH" and ob.name.startswith(WALL)]
print(f"  {len(parts)} loose parts")

# Where is the doorway, in wall-local terms?
print()
print("=== THE PARTS, and which of them sit in the DOORWAY FOOTPRINT ===")
FOOT_X0, FOOT_X1 = DX0 - 8.0, DX1 + 8.0
FOOT_Z0, FOOT_Z1 = DZ0 - 8.0, DZ1 + 8.0
FOOT_Y0, FOOT_Y1 = DY0 - 60.0, DY1 + 60.0

part_info = []
for ob in parts:
    w = obj_world_bounds(ob)
    inside = (
        (w[:, 0] >= FOOT_X0) & (w[:, 0] <= FOOT_X1)
        & (w[:, 2] >= FOOT_Z0) & (w[:, 2] <= FOOT_Z1)
    )
    n_inside = int(inside.sum())
    part_info.append((n_inside, ob, w))

part_info.sort(key=lambda t: -t[0])
for n_inside, ob, w in part_info:
    if n_inside == 0 and len(ob.data.vertices) < 40:
        continue
    print(
        f"  {ob.name:<26} verts {len(ob.data.vertices):6d} polys {len(ob.data.polygons):6d}"
        f"  x {w[:,0].min():8.1f}..{w[:,0].max():8.1f}"
        f"  y {w[:,1].min():8.1f}..{w[:,1].max():8.1f}"
        f"  z {w[:,2].min():7.1f}..{w[:,2].max():7.1f}"
        f"  in-footprint {n_inside:6d}"
    )

# ── Render the wall alone from outside ─────────────────────────────────────
print()
print("=== RENDERING THE WALL ALONE ===")


def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    return mat


GREY = flat_mat("grey", (0.6, 0.6, 0.63))
CYAN = flat_mat("cyan", (0.1, 0.9, 0.9))

# Hide everything except the wall and the door.
for ob in scn.objects:
    if ob.type == "MESH":
        ob.hide_render = True
for ob in parts:
    ob.hide_render = False
    ob.data.materials.clear()
    ob.data.materials.append(GREY)
door.hide_render = False
door.data.materials.clear()
door.data.materials.append(CYAN)

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


def shoot(name, loc, look, lens=45.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


shoot("wall_only_outside", (mid_x, DY1 + 600.0, mid_z), (mid_x, DY1, mid_z))
shoot("wall_only_plan", (mid_x, DY1 - 400.0, DZ0 + 400.0), (mid_x, DY1 + 40.0, DZ0))
shoot("wall_only_3q", (mid_x - 500.0, DY1 + 420.0, mid_z + 220.0), (mid_x, DY1, mid_z), lens=40.0)

print("=== DONE ===")
