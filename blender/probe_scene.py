"""Throwaway probe: how does the GLB land in Blender, and where are the tables/door?"""
import bpy
import sys
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

scn = bpy.context.scene
print("=== OBJECTS ===")
for ob in scn.objects:
    if ob.type != 'MESH':
        print(f"  {ob.name!r} type={ob.type}")
        continue
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    print(f"  {ob.name!r} tris={len(ob.data.polygons):7d} "
          f"min=({mn.x:8.1f},{mn.y:8.1f},{mn.z:8.1f}) max=({mx.x:8.1f},{mx.y:8.1f},{mx.z:8.1f})")

# scene-wide bbox
mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for ob in scn.objects:
    if ob.type != 'MESH':
        continue
    for c in ob.bound_box:
        w = ob.matrix_world @ Vector(c)
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
print("=== SCENE BBOX ===")
print("  min", tuple(round(v, 2) for v in mn))
print("  max", tuple(round(v, 2) for v in mx))
print("  size", tuple(round(mx[i]-mn[i], 2) for i in range(3)))
print("=== DONE ===")
sys.stdout.flush()
