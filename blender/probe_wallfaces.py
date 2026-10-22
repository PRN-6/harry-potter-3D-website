"""
Throwaway probe: WHAT IS THE WALL ACTUALLY MADE OF, FACE BY FACE?

The Boolean cut did not open the doorway, which usually means one of two
things:

  a) the wall is not a closed solid, so the EXACT solver has nothing to
     cut with, or
  b) the "wall" is several separate shells stacked together, and cutting
     one of them leaves the others in place.

This probe looks at the actual polygons in the doorway's footprint and
reports, for each one, where it sits and which way it faces. It answers
the question a Boolean cannot: is there a single flat layer of wall
behind the door, or several?

"""

import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\undifined.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

WALL = "Material2.001"
DOOR = "Material3.010"


def world_matrix(ob):
    return np.array(ob.matrix_world, dtype=np.float64)


def to_world(mw, points):
    """Transforms an (N, 3) array of local points into world space."""
    pts = np.asarray(points, dtype=np.float64)
    return pts @ mw[:3, :3].T + mw[:3, 3]


def poly_report(ob, label):
    """Every polygon's centroid and normal, in world space."""
    mw = world_matrix(ob)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    verts = to_world(mw, local)
    nmat = mw[:3, :3]
    rows = []
    for poly in ob.data.polygons:
        idx = list(poly.vertices)
        c = verts[idx].mean(axis=0)
        n = nmat @ np.array(poly.normal[:], dtype=np.float64)
        norm = np.linalg.norm(n)
        if norm > 1e-9:
            n = n / norm
        rows.append((c, n, len(idx)))
    return rows


wall = bpy.data.objects.get(WALL)
door = bpy.data.objects.get(DOOR)
assert wall is not None and door is not None


def bounds_of(ob):
    mw = world_matrix(ob)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    return to_world(mw, local)


dw = bounds_of(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5

ww = bounds_of(wall)
print(f"WALL {WALL}: x {ww[:,0].min():.1f}..{ww[:,0].max():.1f}  "
      f"y {ww[:,1].min():.1f}..{ww[:,1].max():.1f}  z {ww[:,2].min():.1f}..{ww[:,2].max():.1f}")
print(f"DOOR {DOOR}: x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

# ── Every object that has any geometry in the doorway footprint ────────────
print()
print("=== EVERY OBJECT WITH GEOMETRY IN THE DOORWAY FOOTPRINT ===")
FOOT_X0, FOOT_X1 = DX0 - 20.0, DX1 + 20.0
FOOT_Z0, FOOT_Z1 = DZ0 - 20.0, DZ1 + 20.0

candidates = []
for ob in scn.objects:
    if ob.type != "MESH" or not ob.data.vertices:
        continue
    v = bounds_of(ob)
    m = (
        (v[:, 0] >= FOOT_X0) & (v[:, 0] <= FOOT_X1)
        & (v[:, 2] >= FOOT_Z0) & (v[:, 2] <= FOOT_Z1)
    )
    n = int(m.sum())
    if n == 0:
        continue
    ys = v[m][:, 1]
    candidates.append((n, ob, ys.min(), ys.max()))

candidates.sort(key=lambda t: -t[0])
for n, ob, ylo, yhi in candidates:
    print(f"  {ob.name:<24} {n:7d} verts in footprint   y {ylo:8.1f}..{yhi:8.1f}")

# ── The wall's polygons, in the footprint ──────────────────────────────────
print()
print("=== THE WALL'S POLYGONS INSIDE THE DOORWAY FOOTPRINT ===")
rows = poly_report(wall, WALL)
in_foot = []
for c, n, nv in rows:
    if FOOT_X0 <= c[0] <= FOOT_X1 and FOOT_Z0 <= c[2] <= FOOT_Z1:
        in_foot.append((c, n, nv))

print(f"  {len(in_foot)} of {len(rows)} polygons are in the footprint")

# Histogram them by their Y — how many layers of wall are there?
if in_foot:
    ys = np.array([c[1] for c, _, _ in in_foot])
    print()
    print("  --- histogram of polygon Y (how many layers) ---")
    hist, edges = np.histogram(ys, bins=20)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        bar = "#" * min(count, 70)
        print(f"  y {lo:8.1f} .. {hi:8.1f}  {count:6d} {bar}")

    print()
    print("  --- histogram of polygon normal Y ---")
    nys = np.array([n[1] for _, n, _ in in_foot])
    hist, edges = np.histogram(nys, bins=10)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  n.y {lo:+.2f} .. {hi:+.2f}  {count:6d} {'#' * min(count, 70)}")

    print()
    print("  --- the 12 polygons nearest the door's centre ---")
    key = sorted(in_foot, key=lambda t: (t[0][0] - mid_x) ** 2 + (t[0][2] - mid_z) ** 2)
    for c, n, nv in key[:12]:
        print(f"    c=({c[0]:8.1f},{c[1]:8.1f},{c[2]:7.1f})  "
              f"n=({n[0]:+.2f},{n[1]:+.2f},{n[2]:+.2f})  verts={nv}")

# ── The same for the door slab ─────────────────────────────────────────────
print()
print("=== THE DOOR SLAB'S POLYGONS ===")
drows = poly_report(door, DOOR)
dys = np.array([c[1] for c, _, _ in drows])
hist, edges = np.histogram(dys, bins=12)
print("  --- histogram of polygon Y (the slab's depth) ---")
for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
    print(f"  y {lo:8.1f} .. {hi:8.1f}  {count:6d} {'#' * min(count, 70)}")
print(f"  total polygons: {len(drows)}")

# ── Is the wall a closed solid? ────────────────────────────────────────────
print()
print("=== IS THE WALL A CLOSED SOLID? ===")
wm = world_matrix(wall)
edges_count = {}
for poly in wall.data.polygons:
    idx = list(poly.vertices)
    for i in range(len(idx)):
        a, b = idx[i], idx[(i + 1) % len(idx)]
        key = (min(a, b), max(a, b))
        edges_count[key] = edges_count.get(key, 0) + 1
boundary = sum(1 for v in edges_count.values() if v == 1)
nonmanifold = sum(1 for v in edges_count.values() if v > 2)
print(f"  edges: {len(edges_count)}   boundary (used once): {boundary}   non-manifold (>2): {nonmanifold}")
print(f"  => {'OPEN SHELL' if boundary else 'closed solid'}")

print("=== DONE ===")
