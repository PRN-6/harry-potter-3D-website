"""
Throwaway probe: THE DOOR'S EXACT FOOTPRINT IN THE WALL.

Established so far:
  • The visible panelled door lives in the WALL mesh (`Material2.001`).
    The door slab (`Material3.010`) is a duplicate — the wall's own
    components at x 162.1..167.9 and x 248.2..254.0 are byte-for-byte the
    slab's stiles, and the ring handles render in the wall's colour.
  • The wall is an OPEN SHELL (67,164 of 70,344 edges are used once), which
    is why the Boolean cut did nothing: the EXACT solver cannot tell inside
    from outside on a non-manifold surface.

So the plan is to do FACE-LEVEL surgery instead:
  1. find the wall's faces that belong to the door,
  2. lift them out into two leaves,
  3. delete them from the wall — which leaves a genuine hole.

This probe measures the door's footprint precisely: how many wall faces
sit inside the slab's rectangle, what their depth range is, and whether
the door is cleanly separable from the wall at all.

"""

import os

import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\blender\source\undifined.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

WALL = "Material2.001"
DOOR = "Material3.010"


def world_data(ob):
    mw = np.array(ob.matrix_world, dtype=np.float64)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    return local @ mw[:3, :3].T + mw[:3, 3]


wall = bpy.data.objects.get(WALL)
door = bpy.data.objects.get(DOOR)
assert wall is not None and door is not None

dw = world_data(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
mid_x = (DX0 + DX1) * 0.5
print(f"DOOR SLAB: x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")
print(f"  width {DX1 - DX0:.1f}   height {DZ1 - DZ0:.1f}   depth {DY1 - DY0:.1f}")


def face_rows(ob):
    """(centroid, normal, area, nverts) for every face, in world space."""
    mw = np.array(ob.matrix_world, dtype=np.float64)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    verts = local @ mw[:3, :3].T + mw[:3, 3]
    nmat = mw[:3, :3]
    out = []
    for poly in ob.data.polygons:
        idx = list(poly.vertices)
        c = verts[idx].mean(axis=0)
        n = nmat @ np.array(poly.normal[:], dtype=np.float64)
        length = np.linalg.norm(n)
        if length > 1e-9:
            n = n / length
        out.append((c, n, float(poly.area), len(idx)))
    return out


wrows = face_rows(wall)
drows = face_rows(door)
print(f"wall faces {len(wrows)}   door slab faces {len(drows)}")

# ── The wall's faces inside the slab's exact rectangle ─────────────────────
inside = [
    (c, n, a, k) for c, n, a, k in wrows
    if DX0 <= c[0] <= DX1 and DZ0 <= c[2] <= DZ1
]
print()
print(f"=== WALL FACES INSIDE THE SLAB'S RECTANGLE: {len(inside)} ===")

if inside:
    ys = np.array([c[1] for c, _, _, _ in inside])
    print(f"  y range {ys.min():.2f} .. {ys.max():.2f}   (span {ys.max() - ys.min():.2f})")
    print()
    print("  --- y histogram ---")
    hist, edges = np.histogram(ys, bins=20)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  y {lo:8.2f} .. {hi:8.2f}  {count:6d} {'#' * min(count, 60)}")

    nys = np.array([n[1] for _, n, _, _ in inside])
    print()
    print("  --- normal-y histogram ---")
    hist, edges = np.histogram(nys, bins=10)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  n.y {lo:+.2f} .. {hi:+.2f}  {count:6d} {'#' * min(count, 60)}")

    areas = np.array([a for _, _, a, _ in inside])
    print()
    print(f"  total area {areas.sum():.1f}   mean face area {areas.mean():.2f}   "
          f"max {areas.max():.2f}")

# ── The wall's faces just OUTSIDE the rectangle (the arch) ─────────────────
band = [
    (c, n, a, k) for c, n, a, k in wrows
    if (DX0 - 40 <= c[0] <= DX1 + 40 and DZ0 - 40 <= c[2] <= DZ1 + 60)
    and not (DX0 <= c[0] <= DX1 and DZ0 <= c[2] <= DZ1)
]
print()
print(f"=== WALL FACES IN THE SURROUNDING BAND: {len(band)} ===")
if band:
    bys = np.array([c[1] for c, _, _, _ in band])
    print(f"  y range {bys.min():.2f} .. {bys.max():.2f}")
    hist, edges = np.histogram(bys, bins=16)
    for count, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"  y {lo:8.2f} .. {hi:8.2f}  {count:6d} {'#' * min(count, 60)}")

# ── An ASCII MAP of the door region's faces, in the XZ plane ───────────────
print()
print("=== ASCII MAP OF THE DOOR REGION (x across, z up) ===")
print("    each cell = the count of wall faces whose centroid falls in it")
NX, NZ = 46, 34
grid = np.zeros((NZ, NX), dtype=int)
x0, x1 = DX0 - 10, DX1 + 10
z0, z1 = DZ0 - 10, DZ1 + 30
for c, n, a, k in inside:
    ix = int((c[0] - x0) / (x1 - x0) * NX)
    iz = int((c[2] - z0) / (z1 - z0) * NZ)
    if 0 <= ix < NX and 0 <= iz < NZ:
        grid[NZ - 1 - iz, ix] += 1
for row in grid:
    print("    " + "".join(" .:-=+*#%@"[min(v, 9)] for v in row))
print(f"    x {x0:.0f} .. {x1:.0f}   z {z0:.0f} .. {z1:.0f}")

# ── Is the door region's surface CLOSED in the doorway? ────────────────────
# Count the wall's boundary edges that lie inside the door rectangle: if
# the door were a clean island, its own outline would show up as a closed
# loop of boundary edges.
print()
print("=== BOUNDARY EDGES INSIDE THE DOOR RECTANGLE ===")
wverts = world_data(wall)
wpolys = [list(p.vertices) for p in wall.data.polygons]
edge_use = {}
for pi, idx in enumerate(wpolys):
    n = len(idx)
    for i in range(n):
        a, b = idx[i], idx[(i + 1) % n]
        key = (min(a, b), max(a, b))
        edge_use.setdefault(key, []).append(pi)

in_rect_faces = set()
for pi, (c, n, a, k) in enumerate(wrows):
    if DX0 <= c[0] <= DX1 and DZ0 <= c[2] <= DZ1:
        in_rect_faces.add(pi)

open_to_wall = 0
open_to_door = 0
for key, faces in edge_use.items():
    if len(faces) != 1:
        continue
    pi = faces[0]
    if pi not in in_rect_faces:
        continue
    # The edge's other endpoint: is its face a door face or a wall face?
    a, b = key
    other = None
    for cand in (a, b):
        for f in edge_use.get(
            (min(cand, 0), max(cand, 0)), []
        ):
            pass
    # Count how many of the edge's vertices are shared with a wall face
    # that is OUTSIDE the rectangle.
    for cand in (a, b):
        touched = set()
        for key2, faces2 in edge_use.items():
            if cand in key2:
                touched.update(faces2)
        outside = [f for f in touched if f not in in_rect_faces]
        if outside:
            open_to_wall += 1
            break
    else:
        open_to_door += 1

print(f"  boundary edges of door-region faces that touch the wall: {open_to_wall}")
print(f"  boundary edges of door-region faces that do NOT:        {open_to_door}")
print()
print("=== DONE ===")
