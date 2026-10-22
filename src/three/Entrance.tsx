import { useMemo } from 'react'
import { getHallMaterials } from './hallTheme'
import Fire from './Fire'
import type { FirePoint } from './firePoints'
import type { HallFeatures } from './hallBounds'

/**
 * THE ENTRANCE
 *
 * The Great Hall's doors stand open, and the wall they sit in was cut a
 * real hole for them. That hole opens onto nothing at all — the model is
 * the inside of the hall, and there is no outside of it.
 *
 * So the visitor, arriving at the threshold, looks out through the open
 * doors into a black void. That reads as a hole in the world, and it is
 * the one place where the model gives itself away.
 *
 * WHAT THIS IS
 *   A short stone ANTECHAMBER outside the doors: a floor, two side walls
 *   and a back wall, with a pair of standing braziers lighting it. It
 *   is deliberately plain — it is a corridor, not a room. It exists so
 *   that the open doorway frames something with depth in it rather than
 *   framing nothing, and so the candlelight in the hall has somewhere to
 *   spill out to.
 *
 * WHY THE WALLS ARE PLANES AND NOT A BOX
 *   A box turned inside out would be one draw call, but it would also
 *   have a face across the front — right where the doorway is — and that
 *   face would close the opening off. So the antechamber is built from
 *   four separate planes with no front wall at all, each turned to face
 *   INWARD, so from the hall you see their front faces through the
 *   opening and the space between them reads as depth.
 *
 * THE SKY
 *   Above the antechamber there is no ceiling, so the enchanted sky's
 *   dome shows through. The Great Hall's own sky is the same dome, so
 *   the two read as one continuous night.
 */

interface EntranceProps {
  features: HallFeatures
}

export default function Entrance({ features }: EntranceProps) {
  const materials = getHallMaterials()
  const doorZ = features.entranceZ

  /**
   * The antechamber's dimensions.
   *
   * It is a little wider than the doorway, so the jambs of the opening
   * frame it, and deep enough to have a visible back wall from where
   * the camera stands at the threshold.
   */
  const room = useMemo(
    () => ({
      width: 13,
      depth: 15,
      height: 12,
      /** How far the back wall sits beyond the doorway. */
      back: doorZ - 15,
    }),
    [doorZ],
  )

  const centreZ = (doorZ + room.back) / 2

  /**
   * The two braziers' fires.
   *
   * They are fed through the same `Fire` layer as the hall's own fires,
   * so they flicker and glow exactly like the fires inside — one set of
   * billboards and one instanced draw call for the whole scene.
   */
  const fires = useMemo<FirePoint[]>(
    () =>
      [-3.9, 3.9].map((x) => ({
        position: [x, 1.62, doorZ - 5.5] as [number, number, number],
        scale: 0.55,
        kind: 'brazier' as const,
      })),
    [doorZ],
  )

  return (
    <group>
      {/* The floor of the antechamber. */}
      <mesh
        position={[0, -0.02, centreZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.floor}
      >
        <planeGeometry args={[room.width, room.depth]} />
      </mesh>

      {/* The back wall, at the far end of the corridor. */}
      <mesh position={[0, room.height * 0.45, room.back]} material={materials.wallStone}>
        <planeGeometry args={[room.width, room.height * 0.9]} />
      </mesh>

      {/* A ceiling over the corridor, so the night sky does not show
          through where a roof should be. */}
      <mesh
        position={[0, room.height * 0.9, centreZ]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.wallStone}
      >
        <planeGeometry args={[room.width, room.depth]} />
      </mesh>

      {/* The side walls, each turned to face inward across the corridor. */}
      <mesh
        position={[-room.width / 2, room.height * 0.45, centreZ]}
        rotation={[0, Math.PI / 2, 0]}
        material={materials.wallStone}
      >
        <planeGeometry args={[room.depth, room.height * 0.9]} />
      </mesh>
      <mesh
        position={[room.width / 2, room.height * 0.45, centreZ]}
        rotation={[0, -Math.PI / 2, 0]}
        material={materials.wallStone}
      >
        <planeGeometry args={[room.depth, room.height * 0.9]} />
      </mesh>

      {/*
        Two braziers, one either side of the doorway, throwing warm
        light out into the night.

        They are the same point-light trick the hall's own fires use: the
        light is what sells it, not the mesh.
      */}
      {[-3.9, 3.9].map((x) => (
        <group key={`ante-brazier-${x}`} position={[x, 0, doorZ - 5.5]}>
          <mesh position={[0, 0.55, 0]} material={materials.gold}>
            <cylinderGeometry args={[0.22, 0.3, 1.1, 8]} />
          </mesh>
          <mesh position={[0, 1.35, 0]} material={materials.gold}>
            <cylinderGeometry args={[0.42, 0.2, 0.5, 8]} />
          </mesh>
          <pointLight
            position={[0, 1.6, 0]}
            intensity={22}
            distance={15}
            decay={2}
            color="#ff9a3c"
          />
        </group>
      ))}

      {/* The fires in the braziers, animated by the hall's own fire layer. */}
      <Fire points={fires} />

      {/*
        A dim, cool light up in the vault of the corridor.

        Without it the ceiling is a flat black band across the top of the
        opening, and the shot loses its frame. This is the one piece of
        moonlight in the whole scene, and it is what makes the doorway
        read as a doorway rather than as a hole cut in the picture.
      */}
      <pointLight
        position={[0, room.height * 0.72, doorZ - 3.5]}
        intensity={14}
        distance={22}
        decay={1.6}
        color="#5f6aa8"
      />
    </group>
  )
}
