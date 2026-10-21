"""
Throwaway probe: find the real entrance doors.

The previous session's script called `Material3.009` "the door", but that
object sits at the HIGH-TABLE end of the hall, not the entrance. The
candidate at the actual entrance end is `Material3.010` — a flat panel
249 wide and 238 tall, right against the end wall.

This probe:
  * splits every candidate into loose parts
  * prints each part's bounds
  * renders the entrance with the parts colour-coded, from inside the hall
    and from outside, so the two leaves can be told apart by eye
  * prints the same for the High Table end, to confirm the two ends
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


# ── Split a mesh into loose parts, returning the new objects ─────────────
def split_loose(ob):
    before = set(bpy.data.objects.keys())
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    return [o for o in scn.objects if o.name not in before and o.type == "MESH"]


# ── The two candidate ends ────────────────────────────────────────────────
CANDIDATES = {
    "entrance": "Material3.010",
    "hightable": "Material3.012",
    "old_door_pick": "Material3.009",
}

for label, name in CANDIDATES.items():
    ob = bpy.data.objects.get(name)
    if ob is None:
        print(f"=== {label}: {name} NOT FOUND ===")
        continue
    w = obj_world_bounds(ob)
    lo, hi = w.min(axis=0), w.max(axis=0)
    print(f"=== {label} ({name}) ===")
    print(f"  x {lo[0]:8.1f} .. {hi[0]:8.1f}   width {hi[0] - lo[0]:6.1f}")
    print(f"  y {lo[1]:8.1f} .. {hi[1]:8.1f}   depth {hi[1] - lo[1]:6.1f}")
    print(f"  z {lo[2]:8.1f} .. {hi[2]:8.1f}   height {hi[2] - lo[2]:6.1f}")
    print(f"  polys {len(ob.data.polygons)}")

    parts = split_loose(ob)
    print(f"  -> {len(parts)} loose parts")
    for p in parts:
        pw = obj_world_bounds(p)
        plo, phi = pw.min(axis=0), pw.max(axis=0)
        print(f"     {p.name:<26} polys={len(p.data.polygons):5d} "
              f"x {plo[0]:7.1f}..{phi[0]:7.1f}  y {plo[1]:7.1f}..{phi[1]:7.1f}  "
              f"z {plo[2]:6.1f}..{phi[2]:6.1f}")

# ── Colour-code the entrance parts and render ─────────────────────────────
entrance = bpy.data.objects.get(CANDIDATES["entrance"])
parts = []
if entrance:
    parts = [o for o in scn.objects if o.type == "MESH" and o.name.startswith("Material3.010")]
    # Re-derive: the split above renamed the original, so gather by bounds
    # instead of by name.
    parts = []
    for o in scn.objects:
        if o.type != "MESH":
            continue
        w = obj_world_bounds(o)
        if w[:, 1].min() > 1300 and w[:, 1].max() < 1400:
            parts.append(o)
    print(f"\nENTRANCE PARTS (near y=1350): {len(parts)}")
    for p in parts:
        w = obj_world_bounds(p)
        lo, hi = w.min(axis=0), w.max(axis=0)
        print(f"  {p.name:<26} polys={len(p.data.polygons):5d} "
              f"x {lo[0]:7.1f}..{hi[0]:7.1f}  y {lo[1]:7.1f}..{hi[1]:7.1f}  "
              f"z {lo[2]:6.1f}..{hi[2]:6.1f}")


def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


COLORS = [
    (0.9, 0.15, 0.15), (0.15, 0.8, 0.25), (0.2, 0.45, 0.95), (0.95, 0.8, 0.2),
    (0.75, 0.3, 0.9), (0.15, 0.85, 0.85), (0.95, 0.5, 0.2), (0.5, 0.8, 0.3),
    (0.95, 0.35, 0.7), (0.6, 0.6, 0.65),
]
for i, p in enumerate(parts):
    p.data.materials.clear()
    p.data.materials.append(flat_mat(f"C{i}", COLORS[i % len(COLORS)]))

GREY = flat_mat("Grey", (0.62, 0.62, 0.66))
for ob in scn.objects:
    if ob.type == "MESH" and ob not in parts:
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

# WORKBENCH: flat, unlit, no shadows — a clean diagram.
scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1400
scn.render.resolution_y = 950
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

DOOR_X = 208.0


def shoot(name, loc, look, lens=35.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From inside the hall, looking at the entrance wall.
shoot("ent2_inside", (DOOR_X, 1000, 500), (DOOR_X, 1350, 500))
# From outside the doors, looking in.
shoot("ent2_outside", (DOOR_X, 1700, 500), (DOOR_X, 1350, 500))
# The High Table end, for comparison.
shoot("hightable_end", (DOOR_X, -900, 500), (DOOR_X, -300, 500))

print("=== DONE ===")
