"""
Finds every FIRE SOURCE in the Great Hall.

The GLB merges the whole hall into 28 large meshes, so nothing can be picked
out of the file directly — the individual candles, the gold braziers and the
fireplace are all buried inside those meshes. Blender can split a mesh into
its loose parts, which is what this script does.

For every loose part it records:
  • which material it uses, and that material's AVERAGE COLOUR (sampled from
    the texture), so the gold bowls and the orange firebox can be told apart
    from the grey stone by colour rather than by guesswork
  • its world-space centre and size

The output is JSON, which `src/three/firePoints.ts` reads to place the flames.
Coordinates are in the GLB's own space; the React app applies the same
re-centre and re-scale the model is fitted with.
"""

import json
import os

import bpy
import numpy as np

GLB = r"E:\project\harry-potter-fest-website\public\models\undifined.glb"
OUT = r"E:\project\harry-potter-fest-website\blender\out\fire-points.json"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

# ── 1. The average colour of every material's texture ─────────────────────
# Blender converts glTF's Y-up to its own Z-up on import, so Blender's Y runs
# along the hall and Blender's Z is up. That is recorded here so the caller
# can map the coordinates back.
print("=== SCENE BOUNDS (Blender space: X across, Y along, Z up) ===")


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


def mat_colour(mat):
    """Average RGB of a material's base-colour texture, or its factor."""
    if mat is None:
        return None
    pbr = mat.node_tree.nodes.get("Principled BSDF") if mat.use_nodes else None
    if pbr is not None:
        tex = pbr.inputs["Base Color"].links
        if tex and tex[0].from_node.type == "TEX_IMAGE":
            img = tex[0].from_node.image
            try:
                # Scale a COPY down so reading the pixels is quick.
                small = img.copy()
                small.scale(32, 32)
                px = np.empty(32 * 32 * 4, dtype=np.float32)
                small.pixels.foreach_get(px)
                px = px.reshape(-1, 4)
                bpy.data.images.remove(small)
                rgb = px[:, :3].mean(axis=0)
                return [round(float(v), 4) for v in rgb]
            except Exception as exc:  # pragma: no cover - diagnostic only
                print("   (colour read failed:", exc, ")")
    if pbr is not None:
        c = pbr.inputs["Base Color"].default_value
        return [round(float(c[i]), 4) for i in range(3)]
    return None


colours = {}
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    pbr = mat.node_tree.nodes.get("Principled BSDF")
    if pbr is None:
        continue
    tex = pbr.inputs["Base Color"].links
    if not (tex and tex[0].from_node.type == "TEX_IMAGE"):
        continue
    c = mat_colour(mat)
    if c:
        colours[mat.name] = c

print("  textured materials:", len(colours))

# ── 2. Split every mesh into loose parts ─────────────────────────────────
print("\n=== SPLITTING INTO LOOSE PARTS ===")
parts = []

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
    for p in new:
        w = obj_world_bounds(p)
        lo, hi = w.min(axis=0), w.max(axis=0)
        mats = [m.name for m in p.data.materials if m]
        parts.append(
            {
                "name": p.name,
                "materials": mats,
                "colour": colours.get(mats[0]) if mats else None,
                "centre": [round(float(v), 2) for v in (lo + hi) / 2],
                "size": [round(float(v), 2) for v in (hi - lo)],
                "min": [round(float(v), 2) for v in lo],
                "max": [round(float(v), 2) for v in hi],
                "polys": len(p.data.polygons),
            }
        )

    # Merge them back so the next mesh is not nested in a pile of fragments.
    if new:
        bpy.ops.object.select_all(action="DESELECT")
        for p in new:
            p.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        bpy.ops.object.join()

print("  loose parts:", len(parts))

# ── 3. Classify ───────────────────────────────────────────────────────────
# Blender: X across the hall, Y along the hall, Z up.
# The room is 630 wide (X), 1744 long (Y) and 540 tall (Z) in this space.

allb = np.concatenate([obj_world_bounds(o) for o in scn.objects if o.type == "MESH" and o.data.vertices])
print("\n  scene bounds:", allb.min(axis=0).round(1), "->", allb.max(axis=0).round(1))

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(
        {
            "blenderSpace": {
                "note": "X across the hall, Y along the hall, Z up",
                "min": [round(float(v), 2) for v in allb.min(axis=0)],
                "max": [round(float(v), 2) for v in allb.max(axis=0)],
            },
            "parts": parts,
        },
        fh,
        indent=1,
    )
print("\nWROTE", OUT)

# ── 4. A quick human-readable summary of the interesting shapes ──────────
print("\n=== CANDIDATE FIRE SOURCES ===")
for p in parts:
    c, s = p["centre"], p["size"]
    col = p["colour"] or []
    # A candle: narrow, and tall relative to its footprint.
    if s[0] < 30 and s[2] > 8 and s[2] < 90 and s[1] < 30:
        kind = "CANDLE"
    # A bowl: wide, shallow, sitting on a column.
    elif 30 < s[0] < 140 and 10 < s[2] < 90 and s[1] < 60:
        kind = "BOWL"
    # The firebox: a big flat sheet.
    elif s[2] < 25 and s[0] > 100:
        kind = "SHEET"
    else:
        kind = ""
    if kind:
        print(
            f"  {kind:<7} {p['name'][:22]:<22} col={col} "
            f"c=({c[0]:7.1f},{c[1]:7.1f},{c[2]:6.1f}) s=({s[0]:6.1f},{s[1]:6.1f},{s[2]:6.1f})"
        )

print("=== DONE ===")
