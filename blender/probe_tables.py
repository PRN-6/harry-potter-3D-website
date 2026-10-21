"""Throwaway probe #3: score every candidate slab so the table detector can pick the right one."""
import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

chunks = []
for ob in bpy.context.scene.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    chunks.append(co @ m[:3, :3].T + m[:3, 3])
V = np.concatenate(chunks)
floor = float(np.percentile(V[:, 2], 0.5))
print("FLOOR", floor)


def clusters(values, gap):
    v = np.sort(values)
    if v.size == 0:
        return []
    b = np.where(np.diff(v) > gap)[0]
    return [(float(g[0]), float(g[-1])) for g in np.split(v, b + 1) if g.size]


z = V[:, 2]
step = 2.0
counts = np.bincount(np.round(z / step).astype(int))
hall_cx = (V[:, 0].min() + V[:, 0].max()) * 0.5
print("HALL_CX", hall_cx)

rows = []
for i in range(int((floor + 10) / step), len(counts)):
    if counts[i] < 200:
        continue
    slab = i * step
    mask = np.abs(z - slab) <= 3.0
    if mask.sum() < 200:
        continue
    sub = V[mask]
    bands = clusters(sub[:, 0], gap=25.0)
    bands = [b for b in bands if b[1] - b[0] >= 25.0]
    if len(bands) < 4:
        continue
    info = []
    yspans = []
    for lo, hi in bands:
        s = sub[(sub[:, 0] >= lo) & (sub[:, 0] <= hi)]
        yspans.append(float(s[:, 1].max() - s[:, 1].min()))
        info.append((lo, hi))
    if len(bands) > 4:
        continue
    # evenness of spacing
    centers = [(a + b) / 2 for a, b in info]
    gaps = np.diff(centers)
    even = float(np.std(gaps)) if len(gaps) > 1 else 99.0
    sym = float(abs((centers[0] + centers[-1]) / 2 - hall_cx))
    ylen = float(np.median(yspans))
    rows.append((slab, len(bands), even, sym, ylen, info))

print(f"\n{'slab':>7} {'nb':>3} {'evenStd':>8} {'symOff':>7} {'yLen':>7}  bands")
for slab, nb, even, sym, ylen, info in sorted(rows, key=lambda r: (r[2], -r[4]))[:18]:
    b = "  ".join(f"[{a:7.1f},{b_:7.1f}]" for a, b_ in info)
    print(f"{slab:7.0f} {nb:3d} {even:8.1f} {sym:7.1f} {ylen:7.1f}  {b}")
print("=== DONE ===")
