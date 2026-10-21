"""Throwaway probe #4: render the door area from a few angles so the leaves are identifiable."""
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
scn.render.resolution_x = 900
scn.render.resolution_y = 700
scn.render.image_settings.file_format = "PNG"
if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.05, 0.04, 0.08, 1)
bg.inputs["Strength"].default_value = 0.6

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 5.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (math.radians(60), 0, math.radians(40))
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.lens = 50
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_X = 208.0
DOOR_Y = -332.0
DOOR_Z = 600.0

views = [
    ("front", (DOOR_X, DOOR_Y - 420, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z)),
    ("threequarter", (DOOR_X + 300, DOOR_Y - 330, DOOR_Z + 90), (DOOR_X, DOOR_Y, DOOR_Z)),
    ("side", (DOOR_X + 330, DOOR_Y - 60, DOOR_Z), (DOOR_X, DOOR_Y, DOOR_Z)),
    ("top", (DOOR_X, DOOR_Y - 180, DOOR_Z + 330), (DOOR_X, DOOR_Y, DOOR_Z)),
]

for name, loc, look in views:
    cam.location = loc
    direction = Vector(look) - Vector(loc)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"door_{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)

print("=== DONE ===")
