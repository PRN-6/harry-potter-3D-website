"""
Throwaway probe: settle the hall's orientation ONCE.

The site's camera path (`src/three/cameraPath.ts`) assumes the entrance is at
-Z and the High Table at +Z. The Blender tour script's docstring says the
opposite. One of them is wrong, and it matters: get it backwards and the
camera walks into the end wall.

This renders a PLAN of the whole hall, from directly above, with the door
mesh picked out in red, and prints the numbers in three.js world space.
"""

import os

import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

# ── The mapping between Blender space and three.js space ───────────────────
# Blender's glTF importer maps  glTF(x, y, z) -> Blender(x, -z, y), so
#   glTF(x, y, z) = Blender(x, z, -y)
# and three.js applies the file's root matrix, which is the Y-up correction
#   three(x, y, z) = glTF(x, z, -y)
# Putting those together:
#   three.x = blender.x
#   three.y = blender.z        (up)
#   three.z = -blender.y       (along the hall)


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


def to_three(w):
    """Blender-space (N,3) -> three.js-space (N,3)."""
    out = w.copy()
    out[:, 1] = w[:, 2]
    out[:, 2] = -w[:, 1]
    return out


# ── Find the door ──────────────────────────────────────────────────────────
door = bpy.data.objects.get("Material3.009")
assert door is not None, "door object not found"
door_w = to_three(obj_world_bounds(door))
print("=== DOOR, in three.js world space ===")
print(f"  x {door_w[:, 0].min():8.1f} .. {door_w[:, 0].max():8.1f}")
print(f"  y {door_w[:, 1].min():8.1f} .. {door_w[:, 1].max():8.1f}")
print(f"  z {door_w[:, 1].min():8.1f} .. {door_w[:, 1].max():8.1f}"
      .replace(f"{door_w[:, 1].min():8.1f}", f"{door_w[:, 2].min():8.1f}")
      .replace(f"{door_w[:, 1].max():8.1f}", f"{door_w[:, 2].max():8.1f}"))

# ── The whole hall ─────────────────────────────────────────────────────────
allv = []
for ob in scn.objects:
    if ob.type == "MESH" and ob.data.vertices:
        allv.append(to_three(obj_world_bounds(ob)))
allv = np.concatenate(allv, axis=0)
print()
print("=== HALL, in three.js world space ===")
print(f"  x {allv[:, 0].min():8.1f} .. {allv[:, 0].max():8.1f}   across")
print(f"  y {allv[:, 1].min():8.1f} .. {allv[:, 1].max():8.1f}   up")
print(f"  z {allv[:, 2].min():8.1f} .. {allv[:, 2].max():8.1f}   along")
print(f"  door centre z = {door_w[:, 2].mean():.1f}")

# ── A plan render, with the door in red ───────────────────────────────────
# Blender space: X across, Y along, Z up. The camera looks straight down.
for ob in scn.objects:
    if ob.type == "MESH" and ob.name.startswith("Material3.009"):
        ob.data.materials.clear()
        mat = bpy.data.materials.new("DoorRed")
        mat.diffuse_color = (1.0, 0.1, 0.1, 1.0)
        ob.data.materials.append(mat)

for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scn.render.engine = engine
        break
    except TypeError:
        continue
scn.render.resolution_x = 1400
scn.render.resolution_y = 1000
scn.render.image_settings.file_format = "PNG"
scn.render.film_transparent = False

if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.02, 0.02, 0.04, 1)
bg.inputs["Strength"].default_value = 1.0

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 5.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (0.0, 0.0, 0.0)
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.type = "ORTHO"
cd.ortho_scale = 1900.0
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

mid_x = (allv[:, 0].min() + allv[:, 0].max()) * 0.5
mid_y = (allv[:, 2].min() + allv[:, 2].max()) * 0.5
cam.location = (mid_x, mid_y, 1600.0)
cam.rotation_euler = (0.0, 0.0, 0.0)

scn.render.filepath = os.path.join(OUT, "plan_threejs.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

# And the same plan, but with three.js +Z pointing UP the image, so the
# render matches what the website's camera sees.
cam.rotation_euler = (0.0, 0.0, np.pi)
scn.render.filepath = os.path.join(OUT, "plan_threejs_plusz_up.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
