"""Throwaway probe #5: isolate the door mesh and the entrance wall, and look at them from inside the hall."""
import math
import os

import bpy
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scn.render.engine = engine
        break
    except TypeError:
        continue
scn.render.resolution_x = 1000
scn.render.resolution_y = 800
scn.render.image_settings.file_format = "PNG"
if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.25, 0.25, 0.3, 1)
bg.inputs["Strength"].default_value = 2.0

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 6.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (math.radians(60), 0, math.radians(200))
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.lens = 45
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_X, DOOR_Y, DOOR_Z = 208.0, -332.0, 600.0

# Which meshes touch the entrance wall?
print("=== MESHES NEAR THE ENTRANCE WALL (y < -240) ===")
for ob in scn.objects:
    if ob.type != "MESH":
        continue
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    lo_y = min(v.y for v in bb)
    hi_y = max(v.y for v in bb)
    if hi_y < -200:
        print(f"  {ob.name:<16} tris={len(ob.data.polygons):6d} "
              f"x {min(v.x for v in bb):7.1f}..{max(v.x for v in bb):7.1f} "
              f"y {lo_y:7.1f}..{hi_y:7.1f} "
              f"z {min(v.z for v in bb):7.1f}..{max(v.z for v in bb):7.1f}")


def shoot(name, loc, look, lens=45):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# ── 1. Everything, from inside the hall looking back at the entrance ──
shoot("ent_from_inside", (DOOR_X, 150, DOOR_Z - 40), (DOOR_X, DOOR_Y, DOOR_Z - 30), 32)

# ── 2. Only the door mesh, from inside ──
hidden = []
for ob in scn.objects:
    if ob.type == "MESH" and ob.name != "Material3.009":
        ob.hide_render = True
        hidden.append(ob)
shoot("door_only_inside", (DOOR_X, 150, DOOR_Z - 40), (DOOR_X, DOOR_Y, DOOR_Z - 30), 40)
shoot("door_only_front", (DOOR_X, DOOR_Y - 330, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z), 40)
shoot("door_only_top", (DOOR_X, DOOR_Y - 120, DOOR_Z + 420), (DOOR_X, DOOR_Y, DOOR_Z), 40)

for ob in hidden:
    ob.hide_render = False

print("=== DONE ===")
