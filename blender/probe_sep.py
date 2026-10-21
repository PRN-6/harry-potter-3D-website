"""Throwaway probe #7: why did separate(LOOSE) not produce all the door parts?"""
import bpy

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

door = bpy.data.objects.get("Material3.009")
print("DOOR:", door.name, "verts", len(door.data.vertices),
      "polys", len(door.data.polygons), "mode", door.mode)

bpy.ops.object.select_all(action="DESELECT")
door.select_set(True)
bpy.context.view_layer.objects.active = door
print("active before:", bpy.context.view_layer.objects.active.name)

bpy.ops.object.mode_set(mode="EDIT")
print("mode now:", door.mode, "active:", bpy.context.view_layer.objects.active.name)
bpy.ops.mesh.select_all(action="SELECT")
print("selected verts:", sum(len(o.data.vertices) for o in bpy.context.selected_objects
                             if o.mode == "EDIT"))
result = bpy.ops.mesh.separate(type="LOOSE")
print("separate result:", result)
bpy.ops.object.mode_set(mode="OBJECT")
print("mode after:", door.mode)

print("--- all mesh objects now ---")
for ob in bpy.context.scene.objects:
    if ob.type == "MESH":
        print(f"  {ob.name:<24} verts={len(ob.data.vertices):4d} "
              f"polys={len(ob.data.polygons):4d} parent={ob.parent.name if ob.parent else None}")
print("=== DONE ===")
