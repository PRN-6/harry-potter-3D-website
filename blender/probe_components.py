"""
Throwaway probe: THE WALL'S CONNECTED COMPONENTS.

The wall mesh (`Material2.001`) is an open shell that carries BOTH the
wall surface and the panelled door relief. If the relief is a separate
connected component, it can simply be LIFTED OUT of the wall — which
leaves a real hole behind it, with no Boolean anywhere.

This works out the components with numpy rather than Blender's operator,
so it is quick and it never modifies anything.

"""

import os
import sys
from collections import defaultdict

import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\public\models\undifined.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

WALL = "Material2.001"
DOOR = "Material3.010"


def world_data(ob):
    mw = np.array(ob.matrix_world, dtype=np.float64)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    verts = local @ mw[:3, :3].T + mw[:3, 3]
    return verts


def components(ob):
    """Face-connected components, via shared edges."""
    verts = world_data(ob)
    polys = [list(p.vertices) for p in ob.data.polygons]

    edge_faces = defaultdict(list)
    for fi, idx in enumerate(polys):
        n = len(idx)
        for i in range(n):
            a, b = idx[i], idx[(i + 1) % n]
            edge_faces[(min(a, b), max(a, b))].append(fi)

    parent = list(range(len(polys)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[ry] = rx

    for faces in edge_faces.values():
        for k in range(1, len(faces)):
            union(faces[0], faces[k])

    groups = defaultdict(list)
    for fi in range(len(polys)):
        groups[find(fi)].append(fi)
    return polys, verts, list(groups.values())


wall = bpy.data.objects.get(WALL)
door = bpy.data.objects.get(DOOR)
assert wall is not None and door is not None

dw = world_data(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5
print(f"DOOR SLAB {DOOR}: x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

for ob in (wall, door):
    polys, verts, groups = components(ob)
    print()
    print("=" * 78)
    print(f"{ob.name}: {len(polys)} polys, {len(groups)} connected components")
    print("=" * 78)

    rows = []
    for gi, faces in enumerate(groups):
        vidx = set()
        for fi in faces:
            vidx.update(polys[fi])
        vv = verts[sorted(vidx)]
        rows.append((len(faces), gi, vv, faces))
    rows.sort(key=lambda t: -t[0])

    for nfaces, gi, vv, faces in rows[:25]:
        # How much of this component is in the doorway's footprint?
        in_foot = (
            (vv[:, 0] >= DX0 - 6) & (vv[:, 0] <= DX1 + 6)
            & (vv[:, 2] >= DZ0 - 6) & (vv[:, 2] <= DZ1 + 6)
        )
        frac = 100.0 * in_foot.sum() / max(1, len(vv))
        print(
            f"  comp {gi:<4} polys {nfaces:6d} verts {len(vv):6d}  "
            f"x {vv[:,0].min():8.1f}..{vv[:,0].max():8.1f}  "
            f"y {vv[:,1].min():8.1f}..{vv[:,1].max():8.1f}  "
            f"z {vv[:,2].min():7.1f}..{vv[:,2].max():7.1f}  "
            f"in-door {frac:5.1f}%"
        )

    if len(rows) > 25:
        print(f"  ... and {len(rows) - 25} more components")

# ── For the wall: what is the component that IS the door relief? ─────────
print()
print("=" * 78)
print("THE WALL'S DOOR-RELIEF COMPONENT")
print("=" * 78)
polys, verts, groups = components(wall)
best = None
for gi, faces in enumerate(groups):
    vidx = set()
    for fi in faces:
        vidx.update(polys[fi])
    vv = verts[sorted(vidx)]
    in_foot = (
        (vv[:, 0] >= DX0 - 6) & (vv[:, 0] <= DX1 + 6)
        & (vv[:, 2] >= DZ0 - 6) & (vv[:, 2] <= DZ1 + 6)
    )
    frac = in_foot.sum() / max(1, len(vv))
    if frac > 0.85 and len(faces) > 50:
        score = len(faces)
        if best is None or score > best[0]:
            best = (score, gi, faces, vv)

if best:
    score, gi, faces, vv = best
    print(f"  component {gi}: {score} polys, {len(vv)} verts")
    print(f"    x {vv[:,0].min():.1f}..{vv[:,0].max():.1f}")
    print(f"    y {vv[:,1].min():.1f}..{vv[:,1].max():.1f}")
    print(f"    z {vv[:,2].min():.1f}..{vv[:,2].max():.1f}")
    print()
    print("  --- its Y histogram (how deep the relief goes) ---")
    hist, edges = np.histogram(vv[:, 1], bins=16)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  y {lo:8.1f} .. {hi:8.1f}  {count:6d} {'#' * min(count, 60)}")
    print()
    print("  --- its X histogram (the panels) ---")
    hist, edges = np.histogram(vv[:, 0], bins=24)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  x {lo:8.1f} .. {hi:8.1f}  {count:6d} {'#' * min(count, 60)}")
    print()
    print("  --- its Z histogram ---")
    hist, edges = np.histogram(vv[:, 2], bins=24)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  z {lo:8.1f} .. {hi:8.1f}  {count:6d} {'#' * min(count, 60)}")
else:
    print("  NO COMPONENT IS ENTIRELY INSIDE THE DOORWAY.")
    print("  The relief is welded into the wall, so the door must be cut")
    print("  geometrically (bisect), not lifted out.")

print()
print("=== DONE ===")
