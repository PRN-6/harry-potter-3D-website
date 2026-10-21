"""
Throwaway probe: the hall's layout, settled.

Earlier probes disagreed about which end of the hall is the entrance, and
about what `Material3.009` actually is. This probe answers everything at
once, in one run:

  1. Every object in the scene, listed by its position along the hall.
  2. The loose parts of the objects at the ENTRANCE end, so the door
     leaves can be identified.
  3. Two WORKBENCH renders (flat colour, no lighting, no roof shadows):
     a plan from directly above, and an elevation from the entrance
     looking down the hall.

WORKBENCH SHADING IS THE KEY: it is unlit and flat, so the plan view is a
clean diagram rather than a dark photograph.
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


# ── 1. Every object, ordered along the hall ───────────────────────────────
print("=== ALL OBJECTS, BY POSITION ALONG THE HALL (Blender Y) ===")
print("    (Blender Y is along the hall; the camera sees this as -Z)")
rows = []
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    w = obj_world_bounds(ob)
    lo, hi = w.min(axis=0), w.max(axis=0)
    rows.append((ob, lo, hi))

for ob, lo, hi in sorted(rows, key=lambda r: -r[2][1]):
    print(f"  {ob.name:<16} polys={len(ob.data.polygons):6d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:6.1f}..{hi[2]:6.1f}")

# ── 2. The entrance end: what is at high Y? ───────────────────────────────
print()
print("=== OBJECTS AT THE FAR END (y > 1100) — the entrance? ===")
entrance = [(ob, lo, hi) for ob, lo, hi in rows if hi[1] > 1100]
for ob, lo, hi in entrance:
    print(f"  {ob.name:<16} polys={len(ob.data.polygons):6d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:6.1f}..{hi[2]:6.1f}")

# Split each of them into loose parts.
print()
print("=== LOOSE PARTS OF THE END OBJECTS ===")
for ob, lo, hi in entrance:
    if len(ob.data.polygons) == 0:
        print(f"  {ob.name}: EDGE-ONLY, skipped")
        continue
    before = set(bpy.data.objects.keys())
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    new = [o for o in scn.objects if o.name not in before and o.type == "MESH"]
    print(f"  {ob.name}: {len(new)} loose parts")
    for p in new:
        w = obj_world_bounds(p)
        plo, phi = w.min(axis=0), w.max(axis=0)
        print(f"     {p.name:<28} polys={len(p.data.polygons):5d} "
              f"x {plo[0]:7.1f}..{phi[0]:7.1f}  y {plo[1]:7.1f}..{phi[1]:7.1f}  "
              f"z {plo[2]:6.1f}..{phi[2]:6.1f}")
    # Merge them back.
    if new:
        bpy.ops.object.select_all(action="DESELECT")
        for p in new:
            p.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        bpy.ops.object.join()

# ── 3. WORKBENCH renders ──────────────────────────────────────────────────
scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.display.render_aa = "8"
scn.render.resolution_x = 1200
scn.render.resolution_y = 1600
scn.render.image_settings.file_format = "PNG"

# Give every object a distinct flat colour.
palette = [
    (0.85, 0.20, 0.20), (0.20, 0.70, 0.30), (0.25, 0.40, 0.90), (0.90, 0.75, 0.20),
    (0.75, 0.35, 0.85), (0.20, 0.80, 0.80), (0.90, 0.50, 0.25), (0.55, 0.75, 0.30),
    (0.90, 0.40, 0.65), (0.45, 0.45, 0.55), (0.95, 0.90, 0.60), (0.30, 0.65, 0.55),
]
for index, (ob, lo, hi) in enumerate(sorted(rows, key=lambda r: -r[2][1])):
    ob.color = (*palette[index % len(palette)], 1.0)

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

allv = np.concatenate([obj_world_bounds(ob) for ob, _, _ in rows], axis=0)
mid_x = (allv[:, 0].min() + allv[:, 0].max()) * 0.5
mid_y = (allv[:, 1].min() + allv[:, 1].max()) * 0.5

# The plan, from directly above.
cd.type = "ORTHO"
cd.ortho_scale = 1900.0
cam.location = (mid_x, mid_y, 1500.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.resolution_x = 1100
scn.render.resolution_y = 1600
scn.render.filepath = os.path.join(OUT, "plan_workbench.png")
bpy.ops.render.render(write_still=True)
print("\nWROTE", scn.render.filepath)

# An elevation from the far end (the suspected entrance) looking down the
# hall, and one from the opposite end.
cd.type = "PERSP"
cd.lens = 24.0
scn.render.resolution_x = 1400
scn.render.resolution_y = 900

for name, y in (("elev_from_far_end", 1300.0), ("elev_from_near_end", -300.0)):
    cam.location = (mid_x, y, 500.0)
    cam.rotation_euler = (np.radians(90), 0, 0 if y > 0 else np.pi)
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)

print("=== DONE ===")
