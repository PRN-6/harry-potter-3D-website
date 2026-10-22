"""
Throwaway probe: IS THERE AN OPENING BEHIND THE DOOR?

Hiding `Material3.010` (the door slab) still left a panelled door on
screen, so the panelled surface is NOT the door slab — it belongs to
something else, and there is a real risk that the end wall is solid.

If the wall is solid, opening the leaves reveals masonry, and the
"start outside, walk in" animation cannot work.

This probe answers it three ways:

  1. QUERY — which objects have geometry BEHIND the door slab, inside the
     doorway's footprint?
  2. PLAN — a top-down orthographic render of the door region with the
     door hidden. If there is a hole, the plan shows daylight through it.
  3. SECTION — the whole model bisected by a vertical plane through the
     door's centre, rendered from the side, which is how an architect
     draws a section drawing. The cut faces are filled so the solid
     material reads as solid.
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

door = bpy.data.objects.get("Material3.010")
dw = obj_world_bounds(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
print(f"DOOR SLAB  x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

# ── 1. QUERY: what is behind the door? ─────────────────────────────────────
# The doorway's footprint, and the slab of space immediately behind it.
print()
print("=== GEOMETRY BEHIND THE DOOR SLAB (y > 1351.9) INSIDE THE FOOTPRINT ===")
FOOT_X0, FOOT_X1 = DX0 - 12.0, DX1 + 12.0
FOOT_Z0, FOOT_Z1 = DZ0 - 10.0, DZ1 + 10.0
found = False
for ob, lo, hi in rows:
    if ob is door:
        continue
    if hi[1] <= DY1:
        continue
    if hi[0] < FOOT_X0 or lo[0] > FOOT_X1:
        continue
    if hi[2] < FOOT_Z0 or lo[2] > FOOT_Z1:
        continue
    # How much of it is actually inside the footprint?
    w = obj_world_bounds(ob)
    inside = (
        (w[:, 0] >= FOOT_X0) & (w[:, 0] <= FOOT_X1)
        & (w[:, 2] >= FOOT_Z0) & (w[:, 2] <= FOOT_Z1)
        & (w[:, 1] > DY1)
    )
    count = int(inside.sum())
    if count:
        found = True
        print(f"  {ob.name:<22} {count:6d} verts behind the door, "
              f"y {lo[1]:.1f}..{hi[1]:.1f}  z {lo[2]:.1f}..{hi[2]:.1f}")
if not found:
    print("  NONE — the doorway is clear behind the door slab.")
    print("  So there IS an opening: the camera can walk through.")

# How far back does the clear space go? Count verts inside the footprint
# by Y, to find the depth of the opening.
print()
print("=== DEPTH OF THE CLEAR SPACE BEHIND THE DOOR ===")
allv = np.concatenate([obj_world_bounds(ob) for ob, _, _ in rows], axis=0)
behind = allv[
    (allv[:, 0] >= FOOT_X0) & (allv[:, 0] <= FOOT_X1)
    & (allv[:, 2] >= FOOT_Z0) & (allv[:, 2] <= FOOT_Z1)
    & (allv[:, 1] > DY1)
]
if len(behind):
    ys = np.sort(behind[:, 1])
    print(f"  {len(behind)} verts behind the door, y {ys.min():.1f} .. {ys.max():.1f}")
    # A histogram down the hall.
    for lo_y in range(int(DY1), int(ys.max()) + 1, 25):
        c = int(((behind[:, 1] >= lo_y) & (behind[:, 1] < lo_y + 25)).sum())
        print(f"    y {lo_y:7d} .. {lo_y + 25:7d}   {c:6d} verts")
else:
    print("  nothing behind the door at all")

# ── 2 & 3. RENDERS ─────────────────────────────────────────────────────────
def flat_mat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    return mat


GREY = flat_mat("G", (0.55, 0.55, 0.58))
for ob, _, _ in rows:
    if ob.type == "MESH":
        ob.data.materials.clear()
        ob.data.materials.append(GREY)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1100
scn.render.resolution_y = 1100
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5

# ── 2. PLAN: top-down through the doorway, door hidden ─────────────────────
door.hide_render = True
cd.type = "ORTHO"
cd.ortho_scale = 420.0
cam.location = (mid_x, (DY0 + DY1) * 0.5, 1200.0)
cam.rotation_euler = (0.0, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "opening_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

# A plan looking UP from below, at the underside of the wall.
cam.location = (mid_x, (DY0 + DY1) * 0.5, -1200.0)
cam.rotation_euler = (np.pi, 0.0, 0.0)
scn.render.filepath = os.path.join(OUT, "opening_plan_below.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)
door.hide_render = False

# ── 3. SECTION: bisect the whole model and look at the cut ────────────────
# Cut the scene with a plane at x = mid_x, keeping the -X half, and cap
# the cut so the solid material shows as solid.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.bisect(
    plane_co=(mid_x, 0.0, 0.0),
    plane_no=(1.0, 0.0, 0.0),
    use_fill=True,
    clear_inner=False,
    clear_outer=True,
)
bpy.ops.object.mode_set(mode="OBJECT")

# Colour the cap faces so the section reads clearly.
CAP = flat_mat("CAP", (0.9, 0.55, 0.15))
for ob in scn.objects:
    if ob.type != "MESH":
        continue
    ob.data.materials.clear()
    ob.data.materials.append(CAP if ob.name.startswith("Material3.010") else GREY)

cd.type = "PERSP"
cd.lens = 30.0
scn.render.resolution_x = 1400
scn.render.resolution_y = 900

# Look along -X at the cut face, from outside the wall.
cam.location = (mid_x + 260.0, 1150.0, 520.0)
cam.rotation_euler = (Vector((mid_x, 1150.0, 520.0)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
scn.render.filepath = os.path.join(OUT, "opening_section.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

# And a plan section, looking down at the cut.
cd.type = "ORTHO"
cd.ortho_scale = 1900.0
cam.location = (mid_x + 260.0, 500.0, 1400.0)
cam.rotation_euler = (Vector((mid_x, 500.0, 0.0)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
scn.render.resolution_x = 1000
scn.render.resolution_y = 1600
scn.render.filepath = os.path.join(OUT, "opening_section_plan.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
