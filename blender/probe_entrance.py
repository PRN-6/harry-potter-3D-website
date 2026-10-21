"""
Throwaway probe: what exactly IS the entrance?

The tour script treats `Material3.009` as "the door mesh" and splits it into
two leaves. But the earlier renders are ambiguous — `Material3.009` may be
the ARCH (the opening) rather than the leaves themselves, and the leaves
may live in another object entirely.

This probe renders the entrance wall from inside the hall with every
candidate object in a DIFFERENT flat colour, so the pieces can be told
apart at a glance, and prints the per-object bounds for anything sitting
near the entrance.

Colours:
    red    = Material3.009 (the object the tour script currently uses)
    green  = every other mesh with vertices in the entrance strip
    yellow = the door leaves' own material, auto_30
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

DOOR_X, DOOR_Y = 208.0, -332.0


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


# ── What sits in the entrance strip? ───────────────────────────────────────
print("=== OBJECTS NEAR THE ENTRANCE (y < -250) ===")
near = []
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    w = obj_world_bounds(ob)
    lo, hi = w.min(axis=0), w.max(axis=0)
    if hi[1] < -250:
        near.append(ob)
        print(f"  {ob.name:<16} polys={len(ob.data.polygons):6d} "
              f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
              f"z {lo[2]:7.1f}..{hi[2]:7.1f}  "
              f"mats={[m.name for m in ob.data.materials]}")

# Which material is used for the leaves? auto_30 is BLEND, and the tour
# script's door object carries it.
print()
print("=== OBJECTS USING EACH MATERIAL ===")
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.materials:
        continue
    names = [m.name for m in ob.data.materials]
    if "auto_30" in names:
        w = obj_world_bounds(ob)
        lo, hi = w.min(axis=0), w.max(axis=0)
        print(f"  auto_30 -> {ob.name:<16} polys={len(ob.data.polygons):6d} "
              f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
              f"z {lo[2]:7.1f}..{hi[2]:7.1f}")

# ── The loose parts of Material3.009 ──────────────────────────────────────
print()
print("=== Material3.009 LOOSE PARTS ===")
door = bpy.data.objects.get("Material3.009")
if door:
    bpy.ops.object.select_all(action="DESELECT")
    door.select_set(True)
    bpy.context.view_layer.objects.active = door
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")

    parts = [o for o in scn.objects if o.type == "MESH" and o.name.startswith("Material3.009")]
    print(f"  {len(parts)} parts")
    for p in sorted(parts, key=lambda o: obj_world_bounds(o)[:, 0].min()):
        w = obj_world_bounds(p)
        lo, hi = w.min(axis=0), w.max(axis=0)
        print(f"    {p.name:<26} polys={len(p.data.polygons):4d} "
              f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
              f"z {lo[2]:7.1f}..{hi[2]:7.1f}")

# ── Coloured renders ───────────────────────────────────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


RED = flat_mat("Red", (0.85, 0.10, 0.10))
GREEN = flat_mat("Green", (0.10, 0.80, 0.20))

for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.materials:
        continue
    ob.data.materials.clear()
    if ob.name.startswith("Material3.009"):
        ob.data.materials.append(RED)
    elif ob in near:
        ob.data.materials.append(GREEN)

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
bg.inputs["Color"].default_value = (0.35, 0.35, 0.40, 1)
bg.inputs["Strength"].default_value = 1.6

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 4.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (np.radians(40), 0, np.radians(20))
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.lens = 35.0
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam


def shoot(name, loc, look):
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From inside the hall, looking back at the entrance.
shoot("entrance_coloured", (DOOR_X, 250, 600), (DOOR_X, DOOR_Y, 600))
# From outside the doors, looking in.
shoot("entrance_outside", (DOOR_X, DOOR_Y - 300, 600), (DOOR_X, DOOR_Y, 600))
# A plan of the entrance strip, so the leaves' footprints are obvious.
cd.type = "ORTHO"
cd.ortho_scale = 420.0
cam.location = (DOOR_X, DOOR_Y, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "entrance_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
