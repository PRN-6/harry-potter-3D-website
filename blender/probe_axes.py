"""Throwaway probe #2: confirm axis orientation + locate door/tables in Blender world space."""
import bpy
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

mn = Vector((1e9,) * 3)
mx = Vector((-1e9,) * 3)
for ob in scn.objects:
    if ob.type != 'MESH':
        continue
    for c in ob.bound_box:
        w = ob.matrix_world @ Vector(c)
        for i in range(3):
            mn[i] = min(mn[i], w[i])
            mx[i] = max(mx[i], w[i])
print("SCENE_BBOX min", tuple(round(v, 1) for v in mn))
print("SCENE_BBOX max", tuple(round(v, 1) for v in mx))
print("SCENE_BBOX size", tuple(round(mx[i] - mn[i], 1) for i in range(3)))

# Which axis is "up"? The floor is the largest horizontal slab of geometry.
# Count vertices per unit slice on each axis to find the dense floor plane.
from collections import Counter
for axis, label in ((0, 'X'), (1, 'Y'), (2, 'Z')):
    c = Counter()
    for ob in scn.objects:
        if ob.type != 'MESH':
            continue
        mw = ob.matrix_world
        for v in ob.data.vertices:
            w = mw @ v.co
            c[int(w[axis] // 20) * 20] += 1
    top = c.most_common(6)
    print(f"DENSE_{label}", sorted(top))

# Every object's matrix_world rotation, to see if the importer rotated anything.
for ob in scn.objects:
    if ob.type == 'MESH' and ob.parent:
        print("PARENT_CHAIN", ob.name, "<-", ob.parent.name, "loc",
              tuple(round(v, 2) for v in ob.parent.location),
              "rot_mode", ob.parent.rotation_mode,
              "rot", tuple(round(v, 3) for v in ob.parent.rotation_euler),
              "scale", tuple(round(v, 4) for v in ob.parent.scale))
        break
print("=== DONE ===")
