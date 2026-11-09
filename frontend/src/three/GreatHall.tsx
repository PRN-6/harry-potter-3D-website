import { useMemo } from 'react'
import * as THREE from 'three'
import { getHallMaterials } from './hallTheme'
import { EnchantedCeiling, FloatingCandles, Sparkles } from './Atmosphere'
import { hallFeatures, PROCEDURAL_HALL } from './hallBounds'
import { HOUSE_BY_ID, type House } from '../data/houses'

/**
 * THE GREAT HALL — procedural version.
 *
 * A full 3D reconstruction built entirely from procedural geometry — no
 * external model files, so it loads instantly and can be edited as code.
 *
 * This is the FALLBACK. The site's primary hall is the real
 * `hogwarts_dining_hall_rigged.glb` model (see `DiningHallModel.tsx`);
 * this
 * version is used when the model fails to load, and it is what makes the
 * site work at all on a connection too slow for 38 MB.
 *
 * The hall runs along the Z axis:
 *   z = -28  entrance doors (where the visitor starts)
 *   z = +28  the High Table, on a raised dais
 *   x =  0   the central aisle
 *
 * Structure, floor to ceiling:
 *   • stone floor with a runner down the aisle
 *   • four long house tables, two per side, with cloth, platters and goblets
 *   • a raised High Table at the far end
 *   • stone side walls with tall gothic windows
 *   • house banners and wall sconces
 *   • floating candles with a warm light
 *   • an enchanted ceiling showing a night sky and drifting stars
 *
 * PERFORMANCE: every material comes from the shared singleton in
 * `hallTheme.ts`. Inline JSX materials would allocate one per mesh, and the
 * hall has hundreds of goblets and plates.
 */

export const HALL = {
  width: PROCEDURAL_HALL.width,
  length: PROCEDURAL_HALL.length,
  height: PROCEDURAL_HALL.height,
  wallThickness: 1.2,
  tableHeight: 1.9,
  tableWidth: 3.4,
  tableLength: 18,
  daisHeight: 1.1,
}

// ─── House table ───────────────────────────────────────────────────────────

interface HouseTableProps {
  house: House
  x: number
  z: number
  clothColor: THREE.Color
}

function HouseTable({ house, x, z, clothColor }: HouseTableProps) {
  const materials = getHallMaterials()

  // Goblets and platters are placed once and shared by all four tables.
  const goblets = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: -HALL.tableWidth / 2 + 0.4 + (i % 2) * (HALL.tableWidth - 0.9),
        z: -HALL.tableLength / 2 + 1.2 + Math.floor(i / 2) * ((HALL.tableLength - 2.4) / 6),
        s: 0.8 + Math.random() * 0.3,
      })),
    [],
  )

  const platters = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 3) * 0.75 - 0.75,
        z: -HALL.tableLength / 2 + 2.5 + i * 2,
      })),
    [],
  )

  // One cloth material per house, cached by house id.
  const clothMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.95 }),
    [clothColor],
  )

  return (
    <group position={[x, 0, z]}>
      {/* Table top + cloth */}
      <mesh position={[0, HALL.tableHeight, 0]} castShadow receiveShadow material={clothMaterial}>
        <boxGeometry args={[HALL.tableWidth, 0.25, HALL.tableLength]} />
      </mesh>

      {/* Table legs */}
      {[-1, 1].map((side) =>
        [-1, 1].map((end) => (
          <mesh
            key={`leg-${side}-${end}`}
            position={[
              side * (HALL.tableWidth / 2 - 0.25),
              HALL.tableHeight / 2,
              end * (HALL.tableLength / 2 - 1.2),
            ]}
            castShadow
            material={materials.wood}
          >
            <boxGeometry args={[0.32, HALL.tableHeight, 0.32]} />
          </mesh>
        )),
      )}

      {/* Cloth hanging over the edges */}
      <mesh position={[0, HALL.tableHeight - 0.55, 0]} material={clothMaterial}>
        <boxGeometry args={[HALL.tableWidth + 0.12, 1.0, HALL.tableLength + 0.12]} />
      </mesh>

      {/* Goblets */}
      {goblets.map((g, i) => (
        <group key={`goblet-${i}`} position={[g.x, HALL.tableHeight + 0.12, g.z]} scale={g.s}>
          <mesh material={materials.goblet}>
            <cylinderGeometry args={[0.11, 0.08, 0.3, 8]} />
          </mesh>
          <mesh position={[0, 0.19, 0]} material={materials.goblet}>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
          </mesh>
        </group>
      ))}

      {/* Platters of food */}
      {platters.map((p, i) => (
        <mesh
          key={`platter-${i}`}
          position={[p.x, HALL.tableHeight + 0.2, p.z]}
          castShadow
          material={materials.plate}
        >
          <cylinderGeometry args={[0.42, 0.38, 0.12, 12]} />
        </mesh>
      ))}

      {/* House banner behind the table */}
      <group position={[0, HALL.height * 0.55, HALL.tableLength / 2 + 2.2]}>
        <mesh>
          <planeGeometry args={[2.6, 5]} />
          <meshStandardMaterial color={house.color} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        {/* Gold crest plate */}
        <mesh position={[0, 0.4, 0.04]} material={materials.gold}>
          <circleGeometry args={[0.75, 24]} />
        </mesh>
      </group>
    </group>
  )
}

// ─── High table ────────────────────────────────────────────────────────────

function HighTable() {
  const materials = getHallMaterials()
  const z = HALL.length / 2 - 4

  const highCloth = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7a1f2c', roughness: 0.9 }),
    [],
  )

  return (
    <group position={[0, 0, z]}>
      {/* Dais */}
      <mesh position={[0, HALL.daisHeight / 2, 0]} receiveShadow castShadow material={materials.wallStone}>
        <boxGeometry args={[HALL.width - 4, HALL.daisHeight, 6]} />
      </mesh>

      {/* The long table */}
      <mesh position={[0, HALL.daisHeight + 1.0, 0]} castShadow receiveShadow material={highCloth}>
        <boxGeometry args={[HALL.width - 8, 0.28, 2.6]} />
      </mesh>

      {/* Cloth */}
      <mesh position={[0, HALL.daisHeight + 0.45, 0]} material={highCloth}>
        <boxGeometry args={[HALL.width - 7.8, 0.95, 2.7]} />
      </mesh>

      {/* Chairs */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -((HALL.width - 9) / 2) + i * ((HALL.width - 9) / 8)
        return (
          <group key={`chair-${i}`} position={[x, HALL.daisHeight, 1.9]}>
            <mesh position={[0, 0.55, 0]} castShadow material={materials.wood}>
              <boxGeometry args={[0.7, 1.1, 0.7]} />
            </mesh>
            <mesh position={[0, 1.35, -0.3]} castShadow material={materials.woodLight}>
              <boxGeometry args={[0.7, 1.4, 0.16]} />
            </mesh>
          </group>
        )
      })}

      {/* A big banner behind the High Table */}
      <mesh position={[0, HALL.height * 0.62, 3.0]}>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#4a1c26" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  )
}

// ─── Walls, windows and doors ──────────────────────────────────────────────

function Walls() {
  const materials = getHallMaterials()

  const windows = useMemo(
    () => Array.from({ length: 7 }, (_, i) => -HALL.length / 2 + 5 + i * ((HALL.length - 10) / 6)),
    [],
  )

  const windowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#5b6ea8',
        emissive: '#2b3a72',
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const sconceMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.3, metalness: 0.8 }),
    [],
  )

  const flameMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffe6a8', toneMapped: false }),
    [],
  )

  return (
    <group>
      {/* Side walls */}
      {[-1, 1].map((side) => (
        <group key={`wall-${side}`}>
          <mesh position={[side * (HALL.width / 2), HALL.height / 2, 0]} receiveShadow material={materials.wall}>
            <boxGeometry args={[HALL.wallThickness, HALL.height, HALL.length]} />
          </mesh>

          {/* Tall gothic windows, glowing with moonlight */}
          {windows.map((z, i) => (
            <group key={`win-${side}-${i}`} position={[side * (HALL.width / 2 - 0.1), 11, z]}>
              <mesh rotation={[0, side * -Math.PI / 2, 0]} material={windowMaterial}>
                <planeGeometry args={[3.2, 8]} />
              </mesh>
              {/* Window mullions */}
              <mesh rotation={[0, side * -Math.PI / 2, 0]} position={[0, 0, 0.03]} material={materials.beam}>
                <planeGeometry args={[0.16, 8]} />
              </mesh>
            </group>
          ))}

          {/* Wall sconces between the windows */}
          {windows.map((z, i) => (
            <group key={`sconce-${side}-${i}`} position={[side * (HALL.width / 2 - 0.6), 6.2, z + 3]}>
              <mesh material={sconceMaterial}>
                <boxGeometry args={[0.3, 0.9, 0.3]} />
              </mesh>
              <mesh position={[0, 0.7, 0]} material={flameMaterial}>
                <sphereGeometry args={[0.28, 8, 8]} />
              </mesh>
              <pointLight position={[0, 0.9, 0]} intensity={6} distance={14} decay={2} color="#ffb347" />
            </group>
          ))}
        </group>
      ))}

      {/* Ceiling beam structure */}
      {Array.from({ length: 9 }, (_, i) => {
        const z = -HALL.length / 2 + 3 + i * ((HALL.length - 6) / 8)
        return (
          <mesh key={`beam-${i}`} position={[0, HALL.height - 0.6, z]} castShadow material={materials.beam}>
            <boxGeometry args={[HALL.width, 0.7, 0.9]} />
          </mesh>
        )
      })}

      {/* Entrance doors at the near end */}
      <group position={[0, 0, -HALL.length / 2]}>
        <mesh position={[0, 6, -0.3]} receiveShadow material={materials.wall}>
          <boxGeometry args={[HALL.width, HALL.height, 0.8]} />
        </mesh>
        {[-3, 3].map((x) => (
          <mesh key={`door-${x}`} position={[x, 4.5, 0.15]} material={materials.woodLight}>
            <planeGeometry args={[3.4, 9]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ─── Floor ─────────────────────────────────────────────────────────────────

function Floor() {
  const materials = getHallMaterials()

  const tileMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a342c', roughness: 1 }),
    [],
  )

  const runnerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6b1f2a', roughness: 0.95 }),
    [],
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={materials.floor}>
        <planeGeometry args={[HALL.width, HALL.length]} />
      </mesh>

      {/* Stone tile pattern, drawn as thin strips */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={`tile-x-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-HALL.width / 2 + i * (HALL.width / 8) + 1, 0.01, 0]}
          material={tileMaterial}
        >
          <planeGeometry args={[0.06, HALL.length]} />
        </mesh>
      ))}

      {/* The aisle runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow material={runnerMaterial}>
        <planeGeometry args={[4.2, HALL.length - 2]} />
      </mesh>
    </group>
  )
}

// ─── The assembled hall ────────────────────────────────────────────────────

export default function GreatHall() {
  // The fallback hall always uses the procedural dimensions and layout.
  const features = useMemo(
    () => hallFeatures(PROCEDURAL_HALL, false),
    [],
  )

  // Candle count scales down on low-power devices.
  const candleCount = useMemo(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    return cores >= 8 ? 150 : cores >= 4 ? 90 : 54
  }, [])

  return (
    <group>
      <Floor />
      <Walls />
      <HighTable />
      {features.spots.map((spot) => (
        <HouseTable
          key={spot.house}
          house={HOUSE_BY_ID[spot.house]}
          x={spot.x}
          z={spot.z}
          clothColor={new THREE.Color(HOUSE_BY_ID[spot.house].color).multiplyScalar(0.55)}
        />
      ))}
      <FloatingCandles count={candleCount} features={features} />
      <EnchantedCeiling features={features} />
      <Sparkles features={features} />
    </group>
  )
}
