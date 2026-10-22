"""
Throwaway probe: the NEW Blender export's layout.

The model was re-exported from Blender as `undifined.glb`. The old
SketchUp export's object names may not have survived, so this probe
re-derives the layout from the geometry alone:

  * every object, ordered along the hall
  * the objects at each end, so the entrance can be identified
  * the loose parts of the entrance candidate, so the door leaves can be
    found

The orientation settled by the earlier survey: the entrance is at the
HIGH-Y end of the hall, the High Table wall at the LOW-Y end.
"""

import os

import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\blender\source\undifined.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


rows = []
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    w = obj_world_bounds(ob)
    rows.append((ob, w.min(axis=0), w.max(axis=0)))

allv = np.concatenate([obj_world_bounds(ob) for ob, _, _ in rows], axis=0)
print(f"HALL  x {allv[:,0].min():.1f}..{allv[:,0].max():.1f}"
      f"  y {allv[:,1].min():.1f}..{allv[:,1].max():.1f}"
      f"  z {allv[:,2].min():.1f}..{allv[:,2].max():.1f}")
print(f"objects {len(rows)}")

print()
print("=== ALL OBJECTS, BY HIGH-Y (the hall runs along Y in Blender) ===")
for ob, lo, hi in sorted(rows, key=lambda r: -r[2][1]):
    print(f"  {ob.name:<22} polys={len(ob.data.polygons):6d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:6.1f}..{hi[2]:6.1f}  mats={[m.name for m in ob.data.materials][:3]}")

# ── The entrance end: the HIGH-Y end ───────────────────────────────────────
print()
print("=== OBJECTS AT THE HIGH-Y END (y > 1150) — the entrance ===")
entrance = [(ob, lo, hi) for ob, lo, hi in rows if hi[1] > 1150]
for ob, lo, hi in sorted(entrance, key=lambda r: -r[2][1]):
    print(f"  {ob.name:<22} polys={len(ob.data.polygons):6d} "
          f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
          f"z {lo[2]:6.1f}..{hi[2]:6.1f}")

# Split the entrance candidates and print their parts.
print()
print("=== LOOSE PARTS OF THE ENTRANCE CANDIDATES ===")
for ob, lo, hi in entrance:
    if len(ob.data.polygons) == 0:
        print(f"  {ob.name}: no polygons, skipped")
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
    for p in sorted(new, key=lambda o: obj_world_bounds(o)[:, 0].min()):
        w = obj_world_bounds(p)
        plo, phi = w.min(axis=0), w.max(axis=0)
        print(f"     {p.name:<30} polys={len(p.data.polygons):5d} "
              f"x {plo[0]:7.1f}..{phi[0]:7.1f}  y {plo[1]:7.1f}..{phi[1]:7.1f}  "
              f"z {plo[2]:6.1f}..{phi[2]:6.1f}")
    # Put them back together so the next candidate starts clean.
    if new:
        bpy.ops.object.select_all(action="DESELECT")
        for p in new:
            p.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        bpy.ops.object.join()

print("=== DONE ===")
