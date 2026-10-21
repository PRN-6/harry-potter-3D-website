"""Throwaway probe #6: split the door mesh into loose parts and characterise each one."""
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

# The door mesh: 'Material3.009' from the earlier report.
door = bpy.data.objects.get("Material3.009")
if door is None:
    for ob in scn.objects:
        if ob.type == "MESH" and "Material3.009" in ob.name:
            door = ob
            break
print("DOOR OBJECT:", door.name)

bpy.ops.object.select_all(action="DESELECT")
door.select_set(True)
bpy.context.view_layer.objects.active = door
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

parts = [o for o in scn.objects if o.type == "MESH" and o.name.startswith("Material3.009")]
print(f"LOOSE PARTS: {len(parts)}")

rows = []
for p in parts:
    me = p.data
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(p.matrix_world, dtype=np.float64)
    world = co @ m[:3, :3].T + m[:3, 3]

    # Face normals, weighted by area.
    me.calc_loop_triangles()
    areas = []
    normals = []
    for tri in me.loop_triangles:
        a, b, c = [me.vertices[i].co for i in tri.vertices]
        n = (b - a).cross(c - a)
        area = 0.5 * n.length
        if area > 1e-9:
            areas.append(area)
            normals.append(n.normalized())
    total = sum(areas) if areas else 0.0
    if normals:
        nrm = np.array(normals)
        # fraction of area whose normal points along +/-Y (a flat panel)
        flat_y = float(
            sum(a for a, n in zip(areas, normals) if abs(n.y) > 0.8) / max(total, 1e-9)
        )
        # fraction pointing along +/-X (a side wall / jamb face)
        flat_x = float(
            sum(a for a, n in zip(areas, normals) if abs(n.x) > 0.8) / max(total, 1e-9)
        )
        flat_z = float(
            sum(a for a, n in zip(areas, normals) if abs(n.z) > 0.8) / max(total, 1e-9)
        )
    else:
        flat_y = flat_x = flat_z = 0.0

    rows.append(
        {
            "name": p.name,
            "nverts": len(me.vertices),
            "area": total,
            "x_lo": float(world[:, 0].min()),
            "x_hi": float(world[:, 0].max()),
            "y_lo": float(world[:, 1].min()),
            "y_hi": float(world[:, 1].max()),
            "z_lo": float(world[:, 2].min()),
            "z_hi": float(world[:, 2].max()),
            "flat_y": flat_y,
            "flat_x": flat_x,
            "flat_z": flat_z,
        }
    )

rows.sort(key=lambda r: r["x_lo"])
print(
    f"\n{'name':<18}{'v':>5}{'area':>10}  {'x_lo':>7}{'x_hi':>7}  {'y_lo':>7}{'y_hi':>7}  "
    f"{'z_lo':>7}{'z_hi':>7}  {'fY':>5}{'fX':>5}{'fZ':>5}"
)
for r in rows:
    print(
        f"{r['name']:<18}{r['nverts']:>5}{r['area']:>10.0f}  "
        f"{r['x_lo']:>7.1f}{r['x_hi']:>7.1f}  {r['y_lo']:>7.1f}{r['y_hi']:>7.1f}  "
        f"{r['z_lo']:>7.1f}{r['z_hi']:>7.1f}  "
        f"{r['flat_y']:>5.2f}{r['flat_x']:>5.2f}{r['flat_z']:>5.2f}"
    )

# A plan (top-down orthographic) render of just the door parts.
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scn.render.engine = engine
        break
    except TypeError:
        continue
scn.render.resolution_x = 1000
scn.render.resolution_y = 1000
scn.render.image_settings.file_format = "PNG"
if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.1, 0.1, 0.12, 1)
bg.inputs["Strength"].default_value = 1.0

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 4.0
lo = bpy.data.objects.new("S", ld)
lo.rotation_euler = (0, 0, 0)
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.type = "ORTHO"
cd.ortho_scale = 320.0
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam
cam.location = (208.0, -332.0, 1400.0)
cam.rotation_euler = (0, 0, 0)

# Hide everything that is not a door part.
for ob in scn.objects:
    if ob.type == "MESH" and not ob.name.startswith("Material3.009"):
        ob.hide_render = True

scn.render.filepath = os.path.join(OUT, "door_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

# And an elevation, from the front.
cd.ortho_scale = 340.0
cam.location = (208.0, -800.0, 600.0)
cam.rotation_euler = (np.pi / 2, 0, 0)
scn.render.filepath = os.path.join(OUT, "door_elevation.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
