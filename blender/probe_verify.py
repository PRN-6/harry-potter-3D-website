"""
Throwaway probe: confirm three things at once.

1. The Blender 5.2 animation API — `action.fcurves` was removed in 4.4 when
   actions became "slotted", so the tour script has to reach the F-curves a
   different way.
2. Which objects in the scene are the SketchUp edge overlay (meshes with
   edges but no faces). Those are the white wireframe lines all over the
   model on the website.
3. Which end of the hall the entrance is on, in three.js world space. The
   website's camera path assumes the entrance is at -Z; the model may well
   be the other way round.
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


# ── 1. The animation API in this Blender build ────────────────────────────
print("=== ANIMATION API ===")
print("  bpy.app.version:", bpy.app.version)

probe = bpy.data.objects.new("probe", None)
scn.collection.objects.link(probe)
probe.location = (0, 0, 0)
probe.keyframe_insert(data_path="location", frame=1)

act = probe.animation_data.action
print("  action:", act)
print("  has .fcurves:", hasattr(act, "fcurves"))
print("  has .layers:", hasattr(act, "layers"))
if hasattr(act, "layers"):
    print("  layers:", len(act.layers))
    for layer in act.layers:
        print("    layer", layer.name, "strips", len(layer.strips))
        for strip in layer.strips:
            print("      strip", strip.type, "channelbags",
                  len(getattr(strip, "channelbags", [])))
            for cbag in getattr(strip, "channelbags", []):
                print("        cbag slot=", cbag.slot_handle,
                      "fcurves", len(cbag.fcurves))
                for fc in cbag.fcurves:
                    print("          ", fc.data_path, len(fc.keyframe_points), "pts")

# ── 2. The edge overlay ───────────────────────────────────────────────────
print()
print("=== EDGE-ONLY OBJECTS (no faces) ===")
edge_total = 0
for ob in scn.objects:
    if ob.type != "MESH":
        continue
    polys = len(ob.data.polygons)
    edges = len(ob.data.edges)
    if polys == 0 and edges:
        w = obj_world_bounds(ob)
        edge_total += len(ob.data.vertices)
        print(f"  {ob.name:<16} verts={len(ob.data.vertices):6d} edges={edges:6d} "
              f"x[{w[:,0].min():7.1f},{w[:,0].max():7.1f}] "
              f"y[{w[:,1].min():7.1f},{w[:,1].max():7.1f}] "
              f"z[{w[:,2].min():7.1f},{w[:,2].max():7.1f}]")
print(f"  TOTAL edge-only vertices: {edge_total:,}")

print()
print("=== MESH OBJECT SUMMARY ===")
for ob in scn.objects:
    if ob.type != "MESH":
        continue
    print(f"  {ob.name:<16} polys={len(ob.data.polygons):7d} "
          f"edges={len(ob.data.edges):7d} verts={len(ob.data.vertices):7d} "
          f"mats={[m.name for m in ob.data.materials]}")

# ── 3. The hall's orientation ─────────────────────────────────────────────
print()
print("=== HALL ORIENTATION (Blender space: X across, Y along, Z up) ===")
allv = []
for ob in scn.objects:
    if ob.type == "MESH" and ob.data.vertices:
        allv.append(obj_world_bounds(ob))
allv = np.concatenate(allv, axis=0)
print(f"  X {allv[:,0].min():8.1f} .. {allv[:,0].max():8.1f}")
print(f"  Y {allv[:,1].min():8.1f} .. {allv[:,1].max():8.1f}   <- along the hall")
print(f"  Z {allv[:,2].min():8.1f} .. {allv[:,2].max():8.1f}   <- up")

# The door object, found the same way the tour script finds it.
door = bpy.data.objects.get("Material3.009")
if door is None:
    for ob in scn.objects:
        if ob.type == "MESH" and "Material3.009" in ob.name:
            door = ob
            break
if door:
    w = obj_world_bounds(door)
    print(f"  DOOR {door.name}: y {w[:,1].min():.1f}..{w[:,1].max():.1f}  "
          f"x {w[:,0].min():.1f}..{w[:,0].max():.1f}  "
          f"z {w[:,2].min():.1f}..{w[:,2].max():.1f}")
    print("  -> the door is at the", "LOW" if w[:, 1].mean() < 0 else "HIGH", "Y end")

# ── 4. Two renders: from the entrance looking in, and from the far end ───
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scn.render.engine = engine
        break
    except TypeError:
        continue
scn.render.resolution_x = 1200
scn.render.resolution_y = 800
scn.render.image_settings.file_format = "PNG"
if scn.world is None:
    scn.world = bpy.data.worlds.new("W")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.05, 0.04, 0.09, 1)
bg.inputs["Strength"].default_value = 0.6

ld = bpy.data.lights.new("S", type="SUN")
ld.energy = 3.0
lo = bpy.data.objects.new("S", ld)
scn.collection.objects.link(lo)

cd = bpy.data.cameras.new("C")
cd.lens = 28.0
cam = bpy.data.objects.new("C", cd)
scn.collection.objects.link(cam)
scn.camera = cam

floor_z = 382.5
eye = floor_z + 72.0
mid_x = (allv[:, 0].min() + allv[:, 0].max()) * 0.5
y_min, y_max = allv[:, 1].min(), allv[:, 1].max()

# From just inside the doors, looking down the hall.
cam.location = (mid_x, y_min + 200.0, eye)
cam.rotation_euler = (np.pi / 2, 0, 0)
scn.render.filepath = os.path.join(OUT, "check_from_door.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

# From the far end, looking back at the doors.
cam.location = (mid_x, y_max - 200.0, eye)
cam.rotation_euler = (np.pi / 2, 0, np.pi)
scn.render.filepath = os.path.join(OUT, "check_from_far_end.png")
bpy.ops.render.render(write_still=True)
print("WROTE", scn.render.filepath)

print("=== DONE ===")
