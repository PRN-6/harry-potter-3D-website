"""
Throwaway probe: the hall's layout, settled in one run.

Earlier probes disagreed about which end of the hall is the entrance and
about what the "door" object is. This one is deliberately hard to
misread:

  * WORKBENCH shading — flat, unlit, no shadows. A diagram, not a
    photograph.
  * A RED MARKER CUBE is dropped at each end of the hall, so the entrance
    is unmistakably the end with the red cube.
  * Four labelled renders: a plan, and an elevation from each end.

It also prints the entrance mesh's loose parts, biggest first, so the
door leaves (if there are any) can be identified by their area.
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


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


# ── Hall extent ────────────────────────────────────────────────────────────
meshes = [ob for ob in scn.objects if ob.type == "MESH" and ob.data.vertices]
allv = np.concatenate([obj_world_bounds(ob) for ob in meshes], axis=0)
x_lo, x_hi = allv[:, 0].min(), allv[:, 0].max()
y_lo, y_hi = allv[:, 1].min(), allv[:, 1].max()
z_lo, z_hi = allv[:, 2].min(), allv[:, 2].max()
mid_x = (x_lo + x_hi) * 0.5
print(f"HALL  x {x_lo:.1f}..{x_hi:.1f}  y {y_lo:.1f}..{y_hi:.1f}  z {z_lo:.1f}..{z_hi:.1f}")

# ── The entrance mesh: which object is the flat panel at the end? ─────────
# Find the mesh that hugs the end wall at each end of the hall.
print()
print("=== MESHES AT EACH END ===")
for label, test in (("LOW Y", lambda hi: hi < y_lo + 120), ("HIGH Y", lambda hi: hi > y_hi - 120)):
    print(f"  -- {label} end --")
    for ob in meshes:
        w = obj_world_bounds(ob)
        lo, hi = w.min(axis=0), w.max(axis=0)
        if not test(hi[1]):
            continue
        if hi[1] - lo[1] > 200:
            continue  # spans the whole hall, not an end feature
        print(f"     {ob.name:<16} polys={len(ob.data.polygons):5d} "
              f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
              f"z {lo[2]:6.1f}..{hi[2]:6.1f}")

# ── Marker cubes at each end ──────────────────────────────────────────────
def marker(name, location, color):
    bpy.ops.mesh.primitive_cube_add(size=120.0, location=location)
    cube = bpy.context.active_object
    cube.name = name
    cube.data.materials.clear()
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Roughness"].default_value = 1.0
    cube.data.materials.append(mat)
    cube.color = (*color, 1.0)
    return cube


# The markers sit just OUTSIDE the hall, one at each end, at floor level.
marker("MARKER_LOWY", (mid_x, y_lo - 90.0, z_lo + 60.0), (1.0, 0.1, 0.1))
marker("MARKER_HIGHY", (mid_x, y_hi + 90.0, z_lo + 60.0), (0.1, 0.4, 1.0))

# ── Workbench setup ───────────────────────────────────────────────────────
scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1300
scn.render.resolution_y = 1500
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

# 1. The plan, looking down. +Y is up in the image.
cd.type = "ORTHO"
cd.ortho_scale = 1950.0
cam.location = (mid_x, (y_lo + y_hi) * 0.5, 1500.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.resolution_x = 1000
scn.render.resolution_y = 1500
scn.render.filepath = os.path.join(OUT, "survey_plan.png")
bpy.ops.render.render(write_still=True)
print("\nWROTE", scn.render.filepath)

# 2/3. An elevation from each end, looking down the hall.
cd.type = "PERSP"
cd.lens = 20.0
scn.render.resolution_x = 1300
scn.render.resolution_y = 900
eye = z_lo + 72.0

for name, y, rot_z in (
    ("survey_from_lowy", y_lo + 150.0, np.pi),      # stands at the LOW-Y end
    ("survey_from_highy", y_hi - 150.0, 0.0),       # stands at the HIGH-Y end
):
    cam.location = (mid_x, y, eye)
    cam.rotation_euler = (np.pi / 2, 0.0, rot_z)
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)

# 4. Each end wall, seen head on from inside the hall.
for name, y in (("survey_wall_lowy", y_lo + 120.0), ("survey_wall_highy", y_hi - 120.0)):
    cd.lens = 30.0
    cam.location = (mid_x, y, eye)
    cam.rotation_euler = (np.pi / 2, 0.0, np.pi if name.endswith("lowy") else 0.0)
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)

print("=== DONE ===")
