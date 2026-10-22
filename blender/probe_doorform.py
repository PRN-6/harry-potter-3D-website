"""
Throwaway probe: the door mesh's exact shape.

`Material3.010` is ONE welded mesh — `separate(type='LOOSE')` returns a
single part — so the two leaves have to be split with a geometric cut
rather than by connectivity.

This probe draws the door as an ASCII map of its vertices (X across, Z up),
which shows exactly where the gap between the leaves is and how far up
they reach, plus an isolated front render so the leaves can be seen.
"""

import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\blender\source\undifined.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

DOOR_NAME = "Material3.010"
door = bpy.data.objects.get(DOOR_NAME)
assert door is not None

co = np.empty(len(door.data.vertices) * 3, dtype=np.float32)
door.data.vertices.foreach_get("co", co)
co = co.reshape(-1, 3).astype(np.float64)
m = np.array(door.matrix_world, dtype=np.float64)
world = co @ m[:3, :3].T + m[:3, 3]

x0, x1 = world[:, 0].min(), world[:, 0].max()
y0, y1 = world[:, 1].min(), world[:, 1].max()
z0, z1 = world[:, 2].min(), world[:, 2].max()
print(f"DOOR {DOOR_NAME}")
print(f"  x {x0:.1f} .. {x1:.1f}   (width {x1 - x0:.1f})")
print(f"  y {y0:.1f} .. {y1:.1f}   (depth {y1 - y0:.1f})")
print(f"  z {z0:.1f} .. {z1:.1f}   (height {z1 - z0:.1f})")
print(f"  verts {len(world)}  polys {len(door.data.polygons)}")

# ── The ASCII map ───────────────────────────────────────────────────────────
# 60 columns across the door's width, 30 rows up its height. A cell is
# filled if any vertex falls in it.
COLS, ROWS = 60, 30
grid = [[" "] * COLS for _ in range(ROWS)]
for x, z in zip(world[:, 0], world[:, 2]):
    c = int((x - x0) / (x1 - x0) * (COLS - 1))
    r = int((z - z0) / (z1 - z0) * (ROWS - 1))
    grid[r][c] = "#"

print()
print("DOOR MAP  (x across ->, z up ^)")
for r in range(ROWS - 1, -1, -1):
    z = z0 + (z1 - z0) * r / (ROWS - 1)
    print(f"  z={z:6.1f} |{''.join(grid[r])}|")

# ── Where are the columns of geometry? ──────────────────────────────────────
# Histogram the vertices by X: the two leaves give two tall clusters, and
# the gap between them is the doorway.
print()
print("X HISTOGRAM (40 buckets) — the gap between the leaves shows up as zeros")
BUCKETS = 40
counts = [0] * BUCKETS
for x in world[:, 0]:
    b = int((x - x0) / (x1 - x0) * (BUCKETS - 1))
    counts[b] += 1
for b, c in enumerate(counts):
    x = x0 + (x1 - x0) * b / (BUCKETS - 1)
    bar = "#" * min(c, 60)
    print(f"  x={x:7.1f}  {c:5d} {bar}")

# ── The Y depth profile: how far the leaves stand off the wall ─────────────
print()
print("Y HISTOGRAM (20 buckets) — the door's thickness")
BUCKETS = 20
counts = [0] * BUCKETS
for y in world[:, 1]:
    b = int((y - y0) / (y1 - y0) * (BUCKETS - 1))
    counts[b] += 1
for b, c in enumerate(counts):
    y = y0 + (y1 - y0) * b / (BUCKETS - 1)
    print(f"  y={y:8.2f}  {c:5d} {'#' * min(c, 60)}")

# ── An isolated front render of the door ────────────────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


DOOR = flat_mat("Door", (0.8, 0.15, 0.15))
for ob in scn.objects:
    if ob.type != "MESH":
        continue
    ob.data.materials.clear()
    ob.data.materials.append(DOOR if ob is door else flat_mat(f"G{ob.name}", (0.5, 0.5, 0.55)))

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1200
scn.render.resolution_y = 1200
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

cx = (x0 + x1) * 0.5
cz = (z0 + z1) * 0.5


def shoot(name, loc, look, lens=50.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# Straight on at the door, from inside the hall (lower Y).
shoot("doorform_front", (cx, y0 - 500.0, cz), (cx, y0, cz))
# From the side, so the door's depth and any leaf separation is visible.
shoot("doorform_side", (x1 + 400.0, (y0 + y1) * 0.5, cz), (cx, (y0 + y1) * 0.5, cz))
# From above.
cd.type = "ORTHO"
cd.ortho_scale = 400.0
cam.location = (cx, (y0 + y1) * 0.5, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "doorform_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
