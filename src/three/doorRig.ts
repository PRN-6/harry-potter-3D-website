import * as THREE from 'three'

/**
 * THE DOORS
 * ==========
 *
 * The Great Hall's entrance is a pair of panelled leaves that stand open
 * in the entrance wall. They are the first thing the visitor sees.
 *
 * THE RIG
 *   The model is exported with two hinge empties, `DoorHinge_L` and
 *   `DoorHinge_R`, each at the outer edge of its leaf, with the leaf
 *   parented to it. Turning the empty turns the leaf. The empties also
 *   carry their own `openAngle` as a custom property, so the angle the
 *   doors stand at is baked into the model rather than hard-coded here.
 *
 * THE AXIS
 *   The model is authored Z-up and exported Y-up, and a rotation about
 *   Blender's +Z becomes a rotation about three.js's +Y with the SAME
 *   angle. So the hinge turns on `rotation.y` and nothing else.
 *
 * WHY THE DOORS DO NOT ANIMATE
 *   They used to swing open on the scroll, which meant the visitor's
 *   first move was a cut from "the doors are shut" to "the doors are
 *   open" — a piece of theatre in the middle of the entrance. The doors
 *   now STAND open: the hinges are turned once, when the model loads,
 *   and they stay there. The camera simply walks in through them.
 *
 * WHY THE DOORS WERE SEE-THROUGH
 *   This is the important one. The model came out of SketchUp, and a
 *   SketchUp export is an OPEN SHELL: neighbouring faces do not share
 *   vertices, and every surface has only ONE side. The doorway is a
 *   relief cut out of the hall's inner shell, so the leaves' faces all
 *   point INWARD, towards the room.
 *
 *   That means the leaves are invisible from outside the building —
 *   you look straight through them — and they are lit from the wrong
 *   side from within it. The fix is to render the leaves on BOTH sides.
 *   The hall's walls are left alone: they are only ever seen from
 *   inside, where their single side is the right way round.
 */

/** How far the doors swing, in radians, if the model does not say. */
export const DEFAULT_OPEN_ANGLE = Math.PI * (100 / 180)

/** The two hinges, once they have been found in the scene. */
export interface DoorHinges {
  left: THREE.Object3D | null
  right: THREE.Object3D | null
}

/**
 * Finds the hinge empties in a loaded model.
 *
 * They are found by their `role` custom property first, and by their
 * names second — so the site still works if the model is re-exported
 * without the extras.
 */
export function findDoorHinges(scene: THREE.Object3D): DoorHinges {
  const hinges: DoorHinges = { left: null, right: null }

  scene.traverse((obj) => {
    const role = obj.userData?.role
    const named = obj.name.startsWith('DoorHinge_')
    if (role !== 'door_hinge' && !named) return

    // The side comes from the model when it says, and from the name
    // otherwise. `DoorHinge_L` is the leaf hinged at the LOW-X edge.
    const declared = obj.userData?.side as string | undefined
    const side: keyof DoorHinges =
      declared === 'left' || declared === 'right'
        ? declared
        : obj.name.endsWith('_L') || obj.name.endsWith('LowX')
          ? 'left'
          : 'right'

    if (!hinges[side]) hinges[side] = obj
  })

  return hinges
}

/** The angle a hinge should stand at, read from the model itself. */
function openAngleOf(hinge: THREE.Object3D | null, fallback: number): number {
  const value = hinge?.userData?.openAngle
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Turns the doors to their open angle, once, and makes them solid.
 *
 * The two leaves swing in opposite directions, because they are hinged
 * at opposite edges: the left leaf's hinge carries a negative angle and
 * the right leaf's a positive one. The sign is baked into the model.
 */
export function openDoors(hinges: DoorHinges): void {
  if (hinges.left) {
    hinges.left.rotation.y = openAngleOf(hinges.left, -DEFAULT_OPEN_ANGLE)
  }
  if (hinges.right) {
    hinges.right.rotation.y = openAngleOf(hinges.right, DEFAULT_OPEN_ANGLE)
  }

  for (const hinge of [hinges.left, hinges.right]) {
    makeLeafSolid(hinge)
  }
}

/**
 * Makes a door leaf render on both of its sides.
 *
 * The leaves are a single-sided shell, so without this they are see-
 * through from the wrong side — and, because the shell's faces point
 * into the room, that is the side the camera sees first.
 */
function makeLeafSolid(hinge: THREE.Object3D | null): void {
  if (!hinge) return

  hinge.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materials) {
      if (!material) continue
      material.side = THREE.DoubleSide
      material.needsUpdate = true
    }
  })
}
