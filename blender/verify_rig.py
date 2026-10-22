"""
Throwaway probe: DOES THE RIGGED GLB ACTUALLY WORK?

Checks the exported file the way the website will use it:
  • the hinge empties are there, named, and where they should be
  • the door leaves hang off them
  • a ray fired at the doorway from OUTSIDE passes through into the hall
  • the three.js transform in the manifest matches `fitModel()`

It also renders the door closed and open, from outside, so the result can
be looked at rather than taken on trust.

"""

import json
import math
import os

import bpy
import numpy as np
from mathutils import Vector

GLB = r"E:\project\harry-potter-fest-website\public\models\hogwarts_dining_hall_rigged.glb"
MANIFEST = r"E:\project\harry-potter-fest-website\public\data\hall-door.json"
OUT = r"E:\project\harry-potter-fest-website\blender\out"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
scn = bpy.context.scene

with open(MANIFEST, encoding="utf-8") as handle:
    manifest = json.load(handle)

print("=== THE HINGES IN THE EXPORTED FILE ===")
hinges = {}
for ob in scn.objects:
    if ob.type == "EMPTY":
        hinges[ob.name] = ob
        print(f"  {ob.name}: location {tuple(round(v, 2) for v in ob.location)}  "
              f"rotation {tuple(round(v, 4) for v in ob.rotation_euler)}")
        for key in ob.keys():
            if key != "_RNA_UI":
                print(f"      {key} = {ob[key]}")

for name, info in manifest["hinges"].items():
    print(f"  manifest says {name}: openAngle {info['openAngle']}, "
          f"position {info['position']}")

# ── The leaves ─────────────────────────────────────────────────────────────
print()
print("=== THE DOOR LEAVES ===")
for ob in scn.objects:
    if ob.type == "MESH" and "DoorLeaf" in ob.name:
        parent = ob.parent.name if ob.parent else "(none)"
        print(f"  {ob.name}: {len(ob.data.polygons)} faces, parent = {parent}")

# ── The ray ────────────────────────────────────────────────────────────────
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()

dw = manifest["doorway"]
mid_x = (dw["x"][0] + dw["x"][1]) * 0.5
mid_z = (dw["z"][0] + dw["z"][1]) * 0.5
mid_y = (dw["y"][0] + dw["y"][1]) * 0.5


def ray_from_outside(skip_doors=True):
    origin = Vector((mid_x, mid_z + 300.0, mid_y))
    direction = Vector((0.0, -1.0, 0.0))
    hits = []
    for _ in range(30):
        hit, loc, nrm, idx, obj, _m = scn.ray_cast(dg, origin, direction)
        if not hit:
            break
        if obj is not None and obj.type == "MESH":
            if not (skip_doors and "DoorLeaf" in obj.name):
                hits.append(f"{obj.name}@y{loc.y:.1f}")
        origin = loc + direction * 0.05
    return hits


print()
print("=== THE RAY FROM OUTSIDE (Blender Y = the hall's length) ===")
print(f"  doorway centre: x={mid_x:.2f}  y={mid_z:.2f}  z={mid_y:.2f}")
hits = ray_from_outside()
print(f"  hits: {', '.join(hits) if hits else '(nothing — open to the sky)'}")

# ── The three.js transform ─────────────────────────────────────────────────
print()
print("=== THE THREE.JS TRANSFORM ===")
meshes = [ob for ob in scn.objects if ob.type == "MESH" and ob.data.vertices]
chunks = []
for ob in meshes:
    mw = np.array(ob.matrix_world, dtype=np.float64)
    local = np.array([v.co[:] for v in ob.data.vertices], dtype=np.float64)
    chunks.append(local @ mw[:3, :3].T + mw[:3, 3])
allv = np.concatenate(chunks, axis=0)

scale = manifest["scale"]
offset = manifest["offset"]
target_length = 56.0
print(f"  manifest scale {scale}  (target length {target_length})")
print(f"  model length  {float(allv[:,1].max() - allv[:,1].min()):.2f}  "
      f"=> scaled {float(allv[:,1].max() - allv[:,1].min()) * scale:.2f}")

# Blender (x, y, z) -> glTF (x, z, -y) -> three.js
lo, hi = allv.min(axis=0), allv.max(axis=0)
size_x = float(hi[0] - lo[0])
size_z = float(hi[1] - lo[1])
expect_scale = target_length / max(size_x, size_z)
print(f"  expected scale {expect_scale}   (differs by {abs(expect_scale - scale):.6f})")

center_x = (float(lo[0]) + float(hi[0])) * 0.5
center_z = -(float(lo[1]) + float(hi[1])) * 0.5
min_y = float(lo[2])
print(f"  expected offset [{(-center_x * expect_scale):.6f}, "
      f"{(-min_y * expect_scale):.6f}, {(-center_z * expect_scale):.6f}]")
print(f"  manifest offset {offset}")

# Where does the doorway land in three.js space?
bx = (dw["x"][0] - offset[0]) / scale
print()
print("=== THE DOORWAY IN THREE.JS SPACE (from the manifest) ===")
print(f"  x {dw['x']}   y {dw['y']}   z {dw['z']}")
print(f"  the aisle should be at x ≈ 0; the doorway is centred at "
      f"x = {(dw['x'][0] + dw['x'][1]) * 0.5:.2f}")

# ── Renders ────────────────────────────────────────────────────────────────
print()
print("=== RENDERS ===")
scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
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


# The door's outer face, in Blender space.
door_y = max(allv[:, 1][allv[:, 1] > 1300]) if (allv[:, 1] > 1300).any() else 1350.0
door_mid_x = (float(allv[:, 0][allv[:, 1] > 1340]) + float(allv[:, 0][allv[:, 1] < 1360])) * 0.5
door_mid_z = (float(allv[:, 2][allv[:, 1] > 1340]) + float(allv[:, 2][allv[:, 1] < 1360])) * 0.5

shoot("rig_closed", (door_mid_x, door_y + 520.0, door_mid_z),
      (door_mid_x, door_y, door_mid_z), lens=50.0)

# Swing the doors open, exactly as the website will.
for name, info in manifest["hinges"].items():
    ob = bpy.data.objects.get(name)
    if ob:
        ob.rotation_euler = (0.0, 0.0, info["openAngle"])
bpy.context.view_layer.update()

shoot("rig_open", (door_mid_x, door_y + 520.0, door_mid_z),
      (door_mid_x, door_y, door_mid_z), lens=50.0)
shoot("rig_open_walk", (door_mid_x, door_y - 300.0, door_mid_z),
      (door_mid_x, door_y - 900.0, door_mid_z), lens=50.0)
shoot("rig_open_inside", (door_mid_x, door_y - 900.0, door_mid_z),
      (door_mid_x, door_y, door_mid_z), lens=50.0)

print()
print("=== DONE ===")
