"""
Throwaway probe: WHICH OBJECT IS THE PANELLED DOOR, AND IS THERE A HOLE?

The ray cast from outside the building hits `Material2.001` — the end
WALL — exactly where the door slab stands. But hiding `Material3.010`
(the door slab) still left a panelled door on screen. Those two facts
only reconcile one way: the wall carries its own panelled door surface
and the slab is something else.

Earlier probes were unreliable because WORKBENCH's `color_type='OBJECT'`
reads `object.color`, and every "flat colour" render was actually
rendering in `color_type='MATERIAL'` with a grey `diffuse_color`.

So this probe:
  1. colours every object DISTINCTLY via `object.color` (which WORKBENCH
     definitely honours) and prints a legend
  2. renders from outside the building
  3. DELETES the door slab and ray casts again — if the wall is solid
     there, the ray still hits it

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

DOOR_NAME = "Material3.010"


def obj_world_bounds(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
    ob.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    m = np.array(ob.matrix_world, dtype=np.float64)
    return co @ m[:3, :3].T + m[:3, 3]


door = bpy.data.objects.get(DOOR_NAME)
dw = obj_world_bounds(door)
DX0, DX1 = float(dw[:, 0].min()), float(dw[:, 0].max())
DY0, DY1 = float(dw[:, 1].min()), float(dw[:, 1].max())
DZ0, DZ1 = float(dw[:, 2].min()), float(dw[:, 2].max())
mid_x = (DX0 + DX1) * 0.5
mid_z = (DZ0 + DZ1) * 0.5
print(f"DOOR SLAB {DOOR_NAME}  x {DX0:.1f}..{DX1:.1f}  y {DY0:.1f}..{DY1:.1f}  z {DZ0:.1f}..{DZ1:.1f}")

# ── Colour every object distinctly ─────────────────────────────────────────
PALETTE = [
    (0.9, 0.15, 0.15), (0.15, 0.8, 0.25), (0.2, 0.45, 0.95), (0.95, 0.8, 0.2),
    (0.75, 0.3, 0.9), (0.15, 0.85, 0.85), (0.95, 0.5, 0.2), (0.5, 0.8, 0.3),
    (0.95, 0.35, 0.7), (0.6, 0.6, 0.65), (0.35, 0.35, 0.9), (0.9, 0.6, 0.35),
]
legend = []
meshes = [ob for ob in scn.objects if ob.type == "MESH" and ob.data.vertices]
for i, ob in enumerate(meshes):
    ob.color = (*PALETTE[i % len(PALETTE)], 1.0)
    legend.append(f"  {ob.name:<22} = {PALETTE[i % len(PALETTE)]}")
print()
print("=== COLOUR LEGEND ===")
for line in legend:
    print(line)

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "OBJECT"       # reads object.color — set above
sh.show_cavity = True
sh.show_shadows = False
sh.show_specular_highlight = False
scn.render.resolution_x = 1200
scn.render.resolution_y = 900
scn.render.image_settings.file_format = "PNG"

cd = bpy.data.cameras.new("C")
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam


def shoot(name, loc, look, lens=45.0):
    cd.lens = lens
    cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scn.render.filepath)


# From outside, straight on at the doorway.
shoot("who_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z))
# From inside, straight at the doorway.
shoot("who_inside", (mid_x, DY1 - 900.0, mid_z), (mid_x, DY1, mid_z))

# ── Now delete the door slab and ray cast ──────────────────────────────────
print()
print("=== DELETING THE DOOR SLAB AND RE-RAY-CASTING ===")
bpy.data.objects.remove(door, do_unlink=True)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()

for label, ox, oz in (
    ("centre", mid_x, mid_z),
    ("low", mid_x, DZ0 + 30.0),
    ("high", mid_x, DZ1 - 30.0),
    ("left", mid_x - 70.0, mid_z),
    ("right", mid_x + 70.0, mid_z),
):
    o = Vector((ox, DY1 + 400.0, oz))
    d = Vector((0.0, -1.0, 0.0))
    hits = []
    for _ in range(30):
        hit, loc, nrm, idx, obj, _m = scn.ray_cast(dg, o, d)
        if not hit:
            break
        if obj is not None and obj.type == "MESH":
            hits.append(f"{obj.name}@y{loc.y:.1f}")
        o = loc + d * 0.05
    print(f"  {label:<7} {', '.join(hits) if hits else '(NOTHING — open!)'}")

shoot("who_nodoor_outside", (mid_x, DY1 + 500.0, mid_z), (mid_x, DY1, mid_z))

print("=== DONE ===")
