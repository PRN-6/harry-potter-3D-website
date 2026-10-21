"""Throwaway probe #8: find the door leaves, and confirm the table-top bands."""
import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


def clusters(values, gap):
    v = np.sort(np.asarray(values, dtype=np.float64))
    if v.size == 0:
        return []
    b = np.where(np.diff(v) > gap)[0]
    return [(float(g[0]), float(g[-1])) for g in np.split(v, b + 1) if g.size]


# ── 1. The table-top object ────────────────────────────────────────────────
print("=== TABLE-TOP CANDIDATES (thin in Z, long in Y, above the floor) ===")
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    w = obj_world_bounds(ob)
    lo, hi = w.min(axis=0), w.max(axis=0)
    zspan, yspan = hi[2] - lo[2], hi[1] - lo[1]
    if lo[2] < 400 or zspan > 40 or yspan < 300:
        continue
    bands = clusters(w[:, 0], gap=25.0)
    print(f"  {ob.name:<16} z[{lo[2]:6.1f},{hi[2]:6.1f}] y[{lo[1]:7.1f},{hi[1]:7.1f}] "
          f"nbands={len(bands)}")
    for a, b in bands:
        if b - a < 10:
            continue
        s = w[(w[:, 0] >= a) & (w[:, 0] <= b)]
        print(f"       x[{a:7.1f},{b:7.1f}] w={b - a:6.1f} cx={(a + b) / 2:7.1f} "
              f"y[{s[:, 1].min():7.1f},{s[:, 1].max():7.1f}] z[{s[:, 2].min():6.1f},{s[:, 2].max():6.1f}]")

# ── 2. The first row of tables (nearest the entrance) ──────────────────────
print()
print("=== OBJECTS IN THE ENTRANCE STRIP (y -380..-240) ===")
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    w = obj_world_bounds(ob)
    lo, hi = w.min(axis=0), w.max(axis=0)
    if hi[1] < -240 or lo[1] > -380:
        continue
    print(f"  {ob.name:<16} x[{lo[0]:7.1f},{hi[0]:7.1f}] y[{lo[1]:7.1f},{hi[1]:7.1f}] "
          f"z[{lo[2]:6.1f},{hi[2]:6.1f}]")

# ── 3. The door leaves: loose parts in the entrance, tall and thin ─────────
print()
print("=== SEARCHING FOR DOOR LEAVES (tall thin panels at the entrance) ===")
for ob in list(scn.objects):
    if ob.type != "MESH" or not ob.data.vertices:
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
    if not new:
        continue

    for part in new:
        w = obj_world_bounds(part)
        lo, hi = w.min(axis=0), w.max(axis=0)
        # A leaf: tall, thin in Y, standing at the entrance wall.
        if hi[1] < -280 or lo[1] > -320:
            continue
        if hi[2] - lo[2] < 120:
            continue
        if hi[0] - lo[0] > 90:
            continue
        print(f"  {part.name:<26} x[{lo[0]:7.1f},{hi[0]:7.1f}] "
              f"y[{lo[1]:7.1f},{hi[1]:7.1f}] z[{lo[2]:6.1f},{hi[2]:6.1f}] "
              f"verts={len(part.data.vertices)}")
    # Merge them back so the next object is not affected.
    if new:
        bpy.ops.object.select_all(action="DESELECT")
        for part in new:
            part.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        bpy.ops.object.join()

print("=== DONE ===")
