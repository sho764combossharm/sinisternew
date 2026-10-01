"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Sky } from "three/examples/jsm/objects/Sky.js"
import { Water } from "three/examples/jsm/objects/Water.js"
import type { PlayableId, StoryNpc } from "@/lib/story"

const MAX_SPEED = 8.5
const ACCEL = 0.22
const FRICTION = 0.18

interface Story3DSceneProps {
  playerId: PlayableId
  playerMeta: { name: string; image: string; bodyColor: string }
  npcs: StoryNpc[]
  visited: Set<string>
  onNearbyChange: (npc: StoryNpc | null) => void
  onNpcClick: (npc: StoryNpc) => void
  isDialogueOpen: boolean
}

// Generate realistic high-res grass ground texture
function generateRealisticGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#264e21"
  ctx.fillRect(0, 0, 512, 512)

  const colors = ["#32632b", "#21421c", "#3a7333", "#1b3517", "#44843b", "#274f23"]
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.fillRect(x, y, 2 + Math.random() * 2, 2 + Math.random() * 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(18, 18)
  return texture
}

// Generate stone road texture
function generateCobbleRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#2a2622"
  ctx.fillRect(0, 0, 512, 512)

  const stones = ["#5e574e", "#4d473f", "#6f675d", "#3f3933", "#766d62"]
  const step = 32
  for (let y = 0; y < 512; y += step) {
    const xOff = (y / step) % 2 === 0 ? 0 : step / 2
    for (let x = -step; x < 512 + step; x += step) {
      ctx.fillStyle = stones[Math.floor(Math.random() * stones.length)]
      ctx.beginPath()
      ctx.roundRect(x + xOff + 2, y + 2, step - 4, step - 4, 6)
      ctx.fill()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 8)
  return texture
}

function generateWoodPlankTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#5c3a21"
  ctx.fillRect(0, 0, 512, 512)

  const planks = 8
  const plankH = 512 / planks
  for (let i = 0; i < planks; i++) {
    const y = i * plankH
    ctx.fillStyle = i % 2 === 0 ? "#6d4427" : "#56361e"
    ctx.fillRect(0, y + 2, 512, plankH - 4)

    ctx.fillStyle = "rgba(40, 20, 10, 0.35)"
    for (let g = 0; g < 6; g++) {
      ctx.fillRect(0, y + 6 + g * 8, 512, 1)
    }

    ctx.fillStyle = "#1e120a"
    ctx.fillRect(0, y, 512, 3)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// Full coverage texture for the ball character
function createFullAvatarTexture(imageSrc: string): THREE.Texture {
  const loader = new THREE.TextureLoader()
  const tex = loader.load(imageSrc || "/placeholder.svg")
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

// Create 3D Grass Clump Geometry with curved blades and vertex color gradient
function create3DGrassClumpGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const colors: number[] = []
  const uvs: number[] = []

  const bladeCount = 6
  const baseWidth = 0.07

  // Root color: dark forest green, Mid: vibrant emerald, Tip: light sunlit green
  const cRoot = new THREE.Color("#163e18")
  const cMid = new THREE.Color("#2e7d32")
  const cTip = new THREE.Color("#86efac")

  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const bendAmount = 0.08 + Math.random() * 0.12
    const height = 0.32 + Math.random() * 0.14

    // 3 heights per blade: Base (y=0), Mid (y=height*0.5), Tip (y=height)
    const xBaseL = -baseWidth * cos
    const zBaseL = -baseWidth * sin
    const xBaseR = baseWidth * cos
    const zBaseR = baseWidth * sin

    const xMidL = (-baseWidth * 0.6 + bendAmount * 0.5) * cos
    const zMidL = (-baseWidth * 0.6 + bendAmount * 0.5) * sin
    const yMid = height * 0.55

    const xMidR = (baseWidth * 0.6 + bendAmount * 0.5) * cos
    const zMidR = (baseWidth * 0.6 + bendAmount * 0.5) * sin

    const xTip = (bendAmount + (Math.random() - 0.5) * 0.05) * cos
    const zTip = (bendAmount + (Math.random() - 0.5) * 0.05) * sin
    const yTip = height

    // Quad 1: Base to Mid (2 triangles)
    // Triangle 1: BaseL, BaseR, MidL
    positions.push(xBaseL, 0, zBaseL, xBaseR, 0, zBaseR, xMidL, yMid, zMidL)
    normals.push(0, 0.7, 0.7, 0, 0.7, 0.7, 0, 0.7, 0.7)
    colors.push(cRoot.r, cRoot.g, cRoot.b, cRoot.r, cRoot.g, cRoot.b, cMid.r, cMid.g, cMid.b)
    uvs.push(0, 0, 1, 0, 0, 0.5)

    // Triangle 2: BaseR, MidR, MidL
    positions.push(xBaseR, 0, zBaseR, xMidR, yMid, zMidR, xMidL, yMid, zMidL)
    normals.push(0, 0.7, 0.7, 0, 0.7, 0.7, 0, 0.7, 0.7)
    colors.push(cRoot.r, cRoot.g, cRoot.b, cMid.r, cMid.g, cMid.b, cMid.r, cMid.g, cMid.b)
    uvs.push(1, 0, 1, 0.5, 0, 0.5)

    // Quad 2: Mid to Tip (1 triangle to tip)
    positions.push(xMidL, yMid, zMidL, xMidR, yMid, zMidR, xTip, yTip, zTip)
    normals.push(0, 0.5, 0.8, 0, 0.5, 0.8, 0, 0.5, 0.8)
    colors.push(cMid.r, cMid.g, cMid.b, cMid.r, cMid.g, cMid.b, cTip.r, cTip.g, cTip.b)
    uvs.push(0, 0.5, 1, 0.5, 0.5, 1)
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))

  return geometry
}

// Procedural 3D Stylized Village House (Cottage)
function createStylized3DHouse(): THREE.Group {
  const houseGroup = new THREE.Group()

  // Materials
  const stoneBaseMat = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.85 })
  const wallMat = new THREE.MeshStandardMaterial({ color: "#fef3c7", roughness: 0.75 }) // Warm cream plaster
  const timberMat = new THREE.MeshStandardMaterial({ color: "#543822", roughness: 0.65 }) // Dark oak wood
  const roofMat = new THREE.MeshStandardMaterial({ color: "#b91c1c", roughness: 0.55 }) // Terracotta red roof tiles
  const doorMat = new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 0.6 })
  const windowMat = new THREE.MeshStandardMaterial({
    color: "#fef08a",
    emissive: "#fbbf24",
    emissiveIntensity: 2.8,
    roughness: 0.2,
  })

  // 1. Stone Foundation Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.8, 5.4), stoneBaseMat)
  base.position.y = 0.4
  base.castShadow = true
  base.receiveShadow = true
  houseGroup.add(base)

  // 2. Main Wall Body
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.8, 5.0), wallMat)
  walls.position.y = 2.7
  walls.castShadow = true
  walls.receiveShadow = true
  houseGroup.add(walls)

  // 3. Timber Framing Beams (Vertical & Horizontal Corners)
  for (const x of [-3.02, 3.02]) {
    for (const z of [-2.52, 2.52]) {
      const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 0.3), timberMat)
      cornerPost.position.set(x, 2.7, z)
      cornerPost.castShadow = true
      houseGroup.add(cornerPost)
    }
  }

  // Mid Wall Horizontal Timber Beam
  const midBeamF = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.25, 0.2), timberMat)
  midBeamF.position.set(0, 2.8, 2.52)
  houseGroup.add(midBeamF)

  // 4. Roof Gables & Terracotta Roof Slants
  const roofGroup = new THREE.Group()
  roofGroup.position.y = 4.6

  // Left & Right slanted roof slabs
  const leftRoof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 6.2), roofMat)
  leftRoof.rotation.z = Math.PI / 6
  leftRoof.position.set(-1.6, 0.9, 0)
  leftRoof.castShadow = true
  roofGroup.add(leftRoof)

  const rightRoof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 6.2), roofMat)
  rightRoof.rotation.z = -Math.PI / 6
  rightRoof.position.set(1.6, 0.9, 0)
  rightRoof.castShadow = true
  roofGroup.add(rightRoof)

  // Triangular Gable Walls (Front & Back)
  const gableGeo = new THREE.BufferGeometry()
  const gVerts = new Float32Array([
    -3.0, 0, 2.5,   3.0, 0, 2.5,   0, 1.8, 2.5,
    -3.0, 0, -2.5,  0, 1.8, -2.5,  3.0, 0, -2.5,
  ])
  gableGeo.setAttribute("position", new THREE.BufferAttribute(gVerts, 3))
  gableGeo.computeVertexNormals()
  const gables = new THREE.Mesh(gableGeo, wallMat)
  roofGroup.add(gables)

  houseGroup.add(roofGroup)

  // 5. Front Wooden Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.15), doorMat)
  door.position.set(0, 2.0, 2.52)
  door.castShadow = true
  houseGroup.add(door)

  // Door Porch Canopy
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.2), timberMat)
  porchRoof.position.set(0, 3.4, 3.0)
  houseGroup.add(porchRoof)

  // 6. Glowing Windows (Front & Side)
  const winFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.15), windowMat)
  winFrontL.position.set(-1.8, 2.8, 2.52)
  houseGroup.add(winFrontL)

  const winFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.15), windowMat)
  winFrontR.position.set(1.8, 2.8, 2.52)
  houseGroup.add(winFrontR)

  const winSideL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 1.0), windowMat)
  winSideL.position.set(-3.02, 2.8, 0)
  houseGroup.add(winSideL)

  // 7. Brick Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.2, 0.9), stoneBaseMat)
  chimney.position.set(2.0, 5.2, -1.2)
  chimney.castShadow = true
  houseGroup.add(chimney)

  return houseGroup
}

export function Story3DScene({
  playerId,
  playerMeta,
  npcs,
  visited,
  onNearbyChange,
  onNpcClick,
  isDialogueOpen,
}: Story3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  const isDialogueOpenRef = useRef(isDialogueOpen)
  isDialogueOpenRef.current = isDialogueOpen
  const onNearbyChangeRef = useRef(onNearbyChange)
  onNearbyChangeRef.current = onNearbyChange

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. SCENE SETUP
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2("#86a8c4", 0.007)

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 2. CAMERA SETUP (Third-person 3D camera)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    // 4. ACTUAL REALISTIC SKY (Physical Rayleigh/Mie Atmospheric Scattering)
    const sky = new Sky()
    sky.scale.setScalar(450000)
    scene.add(sky)

    const sun = new THREE.Vector3()
    const skyUniforms = sky.material.uniforms
    skyUniforms["turbidity"].value = 8
    skyUniforms["rayleigh"].value = 2.2
    skyUniforms["mieCoefficient"].value = 0.005
    skyUniforms["mieDirectionalG"].value = 0.82

    const elevation = 18 // Golden twilight sun angle
    const azimuth = 145
    const phi = THREE.MathUtils.degToRad(90 - elevation)
    const theta = THREE.MathUtils.degToRad(azimuth)
    sun.setFromSphericalCoords(1, phi, theta)
    skyUniforms["sunPosition"].value.copy(sun)

    // 5. LIGHTING (Sunlight with soft shadows)
    const ambientLight = new THREE.AmbientLight("#dbeafe", 1.4)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight("#bae6fd", "#1e3a1f", 1.1)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight("#fff4cc", 2.6)
    sunLight.position.copy(sun).multiplyScalar(150)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 300
    const sRange = 70
    sunLight.shadow.camera.left = -sRange
    sunLight.shadow.camera.right = sRange
    sunLight.shadow.camera.top = sRange
    sunLight.shadow.camera.bottom = -sRange
    sunLight.shadow.bias = -0.0003
    scene.add(sunLight)

    // 6. ACTUAL REALISTIC WATER (Three.js Water shader with reflections and caustics)
    const textureLoader = new THREE.TextureLoader()
    const waterNormals = textureLoader.load("/textures/waternormals.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    })

    const waterGeometry = new THREE.PlaneGeometry(12, 80)
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: sun.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x006688,
      distortionScale: 4.5,
      fog: scene.fog !== undefined,
    })
    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.65, 0)
    scene.add(water)

    // 7. REALISTIC TERRAIN & ROADS
    const groundMat = new THREE.MeshStandardMaterial({
      map: generateRealisticGroundTexture(),
      roughness: 0.92,
    })
    const cobbleMat = new THREE.MeshStandardMaterial({
      map: generateCobbleRoadTexture(),
      roughness: 0.85,
    })
    const stoneWallMat = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.8 })
    const woodBeamMat = new THREE.MeshStandardMaterial({ color: "#543822", roughness: 0.7 })

    const worldGroup = new THREE.Group()
    scene.add(worldGroup)

    // West Island (Main Town)
    const westLand = new THREE.Mesh(new THREE.BoxGeometry(45, 4, 75), groundMat)
    westLand.position.set(-27, -2, 0)
    westLand.receiveShadow = true
    worldGroup.add(westLand)

    // East Island (Nathan's Shrine)
    const eastLand = new THREE.Mesh(new THREE.BoxGeometry(45, 4, 75), groundMat)
    eastLand.position.set(27, -2, 0)
    eastLand.receiveShadow = true
    worldGroup.add(eastLand)

    // Riverbed
    const riverBed = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 75),
      new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.95 }),
    )
    riverBed.position.set(0, -3.5, 0)
    worldGroup.add(riverBed)

    // Cobblestone Highway (West to East across bridge)
    const westRoad = new THREE.Mesh(new THREE.PlaneGeometry(42, 5.5), cobbleMat)
    westRoad.rotation.x = -Math.PI / 2
    westRoad.position.set(-25, 0.02, 0)
    westRoad.receiveShadow = true
    worldGroup.add(westRoad)

    const eastRoad = new THREE.Mesh(new THREE.PlaneGeometry(32, 5.5), cobbleMat)
    eastRoad.rotation.x = -Math.PI / 2
    eastRoad.position.set(20, 0.02, 0)
    eastRoad.receiveShadow = true
    worldGroup.add(eastRoad)

    // Town Square Plaza
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(16, 20), cobbleMat)
    plaza.rotation.x = -Math.PI / 2
    plaza.position.set(-20, 0.03, 0)
    plaza.receiveShadow = true
    worldGroup.add(plaza)

    // North & South village paths
    const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 24), cobbleMat)
    northRoad.rotation.x = -Math.PI / 2
    northRoad.position.set(-14, 0.025, -14)
    northRoad.receiveShadow = true
    worldGroup.add(northRoad)

    const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 24), cobbleMat)
    southRoad.rotation.x = -Math.PI / 2
    southRoad.position.set(-14, 0.025, 14)
    southRoad.receiveShadow = true
    worldGroup.add(southRoad)

    // 8. DENSE REALISTIC 3D GRASS (20,000+ Color-graded Curved Grass Blades)
    const grassClumpGeo = create3DGrassClumpGeometry()
    const grassClumpMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      side: THREE.DoubleSide,
    })

    const grassCount = 20000
    const instancedGrass = new THREE.InstancedMesh(grassClumpGeo, grassClumpMat, grassCount)
    instancedGrass.receiveShadow = true

    const dummy = new THREE.Object3D()
    let gIdx = 0
    while (gIdx < grassCount) {
      const onWest = Math.random() > 0.45
      const gx = onWest ? -44 + Math.random() * 38 : 5.5 + Math.random() * 38
      const gz = -32 + Math.random() * 64

      const onRoadX = Math.abs(gz) < 3.2
      const onPlaza = gx > -28 && gx < -12 && Math.abs(gz) < 11
      const onNorthSouthRoad = Math.abs(gx - -14) < 2.8 && Math.abs(gz) < 25

      if (onRoadX || onPlaza || onNorthSouthRoad) continue

      dummy.position.set(gx, 0.01, gz)
      dummy.rotation.y = Math.random() * Math.PI * 2
      dummy.scale.set(0.8 + Math.random() * 0.4, 0.7 + Math.random() * 0.5, 0.8 + Math.random() * 0.4)
      dummy.updateMatrix()
      instancedGrass.setMatrixAt(gIdx, dummy.matrix)
      gIdx++
    }
    instancedGrass.instanceMatrix.needsUpdate = true
    worldGroup.add(instancedGrass)

    // 9. PREMADE & PROCEDURAL 3D VILLAGE HOUSES & MODELS
    const gltfLoader = new GLTFLoader()

    function loadModel(url: string, onLoad: (gltfScene: THREE.Group) => void) {
      gltfLoader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.castShadow = true
              mesh.receiveShadow = true
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                materials.forEach((mat: any) => {
                  mat.needsUpdate = true
                  mat.side = THREE.DoubleSide
                  // Fix pitch black materials in GLTF models
                  if (mat.color && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05 && !mat.map) {
                    mat.color.setHex(0xd97706) // Fallback warm wood tone
                  }
                  if (mat.roughness !== undefined) mat.roughness = 0.7
                  if (mat.metalness !== undefined) mat.metalness = 0.1
                })
              }
            }
          })

          const box = new THREE.Box3().setFromObject(gltf.scene)
          const minY = box.min.y
          gltf.scene.position.y = -minY

          onLoad(gltf.scene)
        },
        undefined,
        (err) => console.warn("Model load info for:", url, err),
      )
    }

    // Load Premade Trees
    loadModel("/models/tree.glb", (treeScene) => {
      const positions: [number, number, number][] = [
        [-8, 14, 1.8], [-10, 22, 2.0], [-12, -18, 1.8], [-28, 22, 1.9],
        [-36, -18, 2.0], [12, 14, 1.8], [14, -18, 1.9], [22, 20, 1.8],
        [32, -16, 2.1], [30, 18, 2.0],
      ]
      positions.forEach(([tx, tz, s]) => {
        const instance = treeScene.clone()
        instance.scale.setScalar(s)
        const box = new THREE.Box3().setFromObject(instance)
        instance.position.set(tx, -box.min.y, tz)
        worldGroup.add(instance)
      })
    })

    // Load Premade Pine Trees
    loadModel("/models/treePine.glb", (pineScene) => {
      const positions: [number, number, number][] = [
        [-38, -26, 2.2], [-30, -26, 2.4], [-22, -26, 2.2], [-14, -28, 2.5],
        [10, -26, 2.2], [18, -26, 2.4], [26, -26, 2.3], [34, -26, 2.5],
        [-38, 28, 2.2], [-28, 28, 2.4], [14, 28, 2.3], [28, 28, 2.5],
      ]
      positions.forEach(([px, pz, s]) => {
        const instance = pineScene.clone()
        instance.scale.setScalar(s)
        const box = new THREE.Box3().setFromObject(instance)
        instance.position.set(px, -box.min.y, pz)
        worldGroup.add(instance)
      })
    })

    // Add Detailed 3D Village Houses
    const housePositions: { x: number; z: number; rotY: number; scale: number }[] = [
      { x: -28, z: -10, rotY: 0, scale: 1.0 },
      { x: -14, z: -22, rotY: Math.PI / 4, scale: 0.95 },
      { x: -28, z: 12, rotY: -Math.PI / 6, scale: 1.05 },
      { x: -36, z: 14, rotY: Math.PI / 3, scale: 0.9 },
    ]

    housePositions.forEach(({ x, z, rotY, scale }) => {
      const house = createStylized3DHouse()
      house.position.set(x, 0, z)
      house.rotation.y = rotY
      house.scale.setScalar(scale)
      worldGroup.add(house)
    })

    // Load Premade Props
    loadModel("/models/rocks.glb", (rockScene) => {
      const rSpots: [number, number, number][] = [
        [-5.5, 8, 1.4], [-5.2, -8, 1.6], [5.5, 10, 1.5], [5.2, -10, 1.6],
        [18, 8, 1.8], [24, -12, 2.0],
      ]
      rSpots.forEach(([rx, rz, s]) => {
        const r = rockScene.clone()
        r.scale.setScalar(s)
        const box = new THREE.Box3().setFromObject(r)
        r.position.set(rx, -box.min.y, rz)
        worldGroup.add(r)
      })
    })

    // 10. AUTHENTIC 3D GRAND BRIDGE (Spans cleanly from West bank x: -4.8 to East bank x: 4.8)
    const bridgeGroup = new THREE.Group()

    // Stone Abutments on Riverbanks
    for (const bx of [-4.8, 4.8]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 7.6), stoneWallMat)
      pier.position.set(bx, -0.7, 0)
      pier.castShadow = true
      pier.receiveShadow = true
      bridgeGroup.add(pier)
    }

    // River Center Pillars
    for (const cx of [-1.8, 1.8]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.6, 7.2), stoneWallMat)
      pier.position.set(cx, -1.1, 0)
      pier.castShadow = true
      bridgeGroup.add(pier)
    }

    // Heavy Timber Deck (Flush with roads at y = 0.06)
    const deckMat = new THREE.MeshStandardMaterial({
      map: generateWoodPlankTexture(),
      roughness: 0.7,
    })
    const deck = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.32, 6.2), deckMat)
    deck.position.set(0, 0.06, 0)
    deck.castShadow = true
    deck.receiveShadow = true
    bridgeGroup.add(deck)

    // Handrails with Corner Posts
    for (const rz of [-3.0, 3.0]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.22, 0.25), woodBeamMat)
      rail.position.set(0, 1.1, rz)
      rail.castShadow = true
      bridgeGroup.add(rail)

      for (const px of [-4.8, -2.4, 0, 2.4, 4.8]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.3, 0.26), woodBeamMat)
        post.position.set(px, 0.6, rz)
        post.castShadow = true
        bridgeGroup.add(post)
      }
    }

    // Corner Lanterns
    const lanternLights: { light: THREE.PointLight; baseIntensity: number }[] = []
    function addLantern(lx: number, lz: number) {
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.4),
        new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 3.5 }),
      )
      lamp.position.set(lx, 1.5, lz)
      bridgeGroup.add(lamp)

      const pLight = new THREE.PointLight("#f59e0b", 3.2, 10, 1.5)
      pLight.position.set(lx, 1.5, lz)
      pLight.castShadow = true
      bridgeGroup.add(pLight)
      lanternLights.push({ light: pLight, baseIntensity: 3.2 })
    }
    addLantern(-4.8, -3.0)
    addLantern(-4.8, 3.0)
    addLantern(4.8, -3.0)
    addLantern(4.8, 3.0)
    worldGroup.add(bridgeGroup)

    // 11. NATHAN'S ANCIENT CURSED DOOR SHRINE (East, x = 24, z = 0)
    const shrine = new THREE.Group()
    shrine.position.set(24, 0, 0)

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.5, 24), stoneWallMat)
    dais.position.y = 0.25
    dais.receiveShadow = true
    shrine.add(dais)

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.85, 4.0, 0.65), stoneWallMat)
      monolith.position.set(Math.cos(a) * 4.4, 2.0, Math.sin(a) * 4.4)
      monolith.rotation.y = -a
      monolith.castShadow = true
      shrine.add(monolith)
    }

    const cursedDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 4.2, 0.35),
      new THREE.MeshStandardMaterial({ color: "#2d1645", roughness: 0.4 }),
    )
    cursedDoor.position.y = 2.1
    cursedDoor.castShadow = true
    shrine.add(cursedDoor)

    const brokenKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.9, roughness: 0.2 }),
    )
    brokenKnob.position.set(0.8, 0.55, 0.6)
    shrine.add(brokenKnob)

    const portalLight = new THREE.PointLight("#a855f7", 4.5, 12, 1.8)
    portalLight.position.set(0, 2.4, 0.8)
    shrine.add(portalLight)
    worldGroup.add(shrine)

    // 12. BALL CHARACTERS (FULL AVATAR WRAPPED AROUND BALL)
    type BallRig = {
      root: THREE.Group
      sphere: THREE.Mesh
      shadow: THREE.Mesh
      targetRotation: number
    }

    function createFullBallAvatar(id: string, imageSrc: string, bodyColorHex: string): BallRig {
      const root = new THREE.Group()

      // Drop Shadow
      const shadowGeo = new THREE.CircleGeometry(0.9, 24)
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
      const shadow = new THREE.Mesh(shadowGeo, shadowMat)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = 0.04
      root.add(shadow)

      // Halo Ring
      const haloGeo = new THREE.RingGeometry(0.92, 1.05, 32)
      const haloMat = new THREE.MeshBasicMaterial({ color: bodyColorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.rotation.x = -Math.PI / 2
      halo.position.y = 0.05
      root.add(halo)

      // 3D Sphere with full avatar texture
      const fullTex = createFullAvatarTexture(imageSrc)
      const sphereGeo = new THREE.SphereGeometry(0.9, 32, 32)
      const sphereMat = new THREE.MeshStandardMaterial({
        map: fullTex,
        roughness: 0.3,
        metalness: 0.05,
      })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.position.y = 1.0
      sphere.castShadow = true
      root.add(sphere)

      return { root, sphere, shadow, targetRotation: 0 }
    }

    // Player Ball
    const playerBall = createFullBallAvatar(playerId, playerMeta.image, playerMeta.bodyColor)
    scene.add(playerBall.root)

    // NPC Balls with accurate world coordinates
    const npcCoords: Record<string, [number, number]> = {
      tung: [-14, -20],
      silly: [-14, 18],
      able: [-26, -5],
      tralalero: [-6.5, 4.0],
      nathan: [24, 0],
    }

    const npcBalls = new Map<string, BallRig>()
    npcs.forEach((npc) => {
      const rig = createFullBallAvatar(npc.id, npc.image, npc.bodyColor)
      const [nx, nz] = npcCoords[npc.id] || [-20, 0]
      rig.root.position.set(nx, 0, nz)
      scene.add(rig.root)
      npcBalls.set(npc.id, rig)
    })

    // 13. SMOOTH 3D CONTROLS (WASD + 360 MOUSE LOOK)
    let posX = -20
    let posZ = 0
    let velX = 0
    let velZ = 0

    let cameraYaw = -Math.PI / 2
    let cameraPitch = 0.38
    let cameraDistance = 14

    let isMouseDown = false
    let prevMouseX = 0
    let prevMouseY = 0

    const keys = new Set<string>()

    function onKeyDown(e: KeyboardEvent) {
      keys.add(e.key.toLowerCase())
    }
    function onKeyUp(e: KeyboardEvent) {
      keys.delete(e.key.toLowerCase())
    }
    function onMouseDown(e: MouseEvent) {
      isMouseDown = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }
    function onMouseUp() {
      isMouseDown = false
    }
    function onMouseMove(e: MouseEvent) {
      if (!isMouseDown) return
      const dx = e.clientX - prevMouseX
      const dy = e.clientY - prevMouseY
      prevMouseX = e.clientX
      prevMouseY = e.clientY

      cameraYaw -= dx * 0.0055
      cameraPitch = Math.max(0.12, Math.min(1.2, cameraPitch + dy * 0.005))
    }
    function onWheel(e: WheelEvent) {
      cameraDistance = Math.max(6, Math.min(26, cameraDistance + e.deltaY * 0.012))
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    renderer.domElement.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("mousemove", onMouseMove)
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true })

    // Click on NPC to talk
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      for (const npc of npcs) {
        const rig = npcBalls.get(npc.id)
        if (rig) {
          const intersects = raycaster.intersectObject(rig.sphere)
          if (intersects.length > 0) {
            onNpcClick(npc)
            break
          }
        }
      }
    }
    renderer.domElement.addEventListener("click", onClick)

    // FLAWLESS COLLISION & BOUNDS CHECK (NEVER TELEPORTS)
    function canMoveTo(tryX: number, tryZ: number): { clampedX: number; clampedZ: number } {
      let cx = Math.max(-44, Math.min(44, tryX))
      let cz = Math.max(-30, Math.min(30, tryZ))

      // River is between x: -4.8 and x: 4.8
      const inRiver = cx > -4.8 && cx < 4.8
      const onBridge = Math.abs(cz) <= 2.8

      if (inRiver && !onBridge) {
        cx = posX < 0 ? -4.8 : 4.8
      }

      for (const npc of npcs) {
        const [nx, nz] = npcCoords[npc.id] || [-20, 0]
        if (Math.hypot(nx - cx, nz - cz) < 1.6) {
          return { clampedX: posX, clampedZ: posZ }
        }
      }

      return { clampedX: cx, clampedZ: cz }
    }

    // 14. GAME RENDER LOOP
    let animId: number
    let lastTime = performance.now()
    let currentNearbyId: string | null = null

    function loop(now: number) {
      animId = requestAnimationFrame(loop)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const elapsed = now * 0.001

      if (!isDialogueOpenRef.current) {
        let forward = 0
        let strafe = 0
        if (keys.has("arrowup") || keys.has("w")) forward += 1
        if (keys.has("arrowdown") || keys.has("s")) forward -= 1
        if (keys.has("arrowleft") || keys.has("a")) strafe -= 1
        if (keys.has("arrowright") || keys.has("d")) strafe += 1

        const len = Math.hypot(forward, strafe)
        let targetVx = 0
        let targetVz = 0

        if (len > 0) {
          const normF = forward / len
          const normS = strafe / len

          const dirX = Math.sin(cameraYaw) * normF + Math.cos(cameraYaw) * normS
          const dirZ = Math.cos(cameraYaw) * normF - Math.sin(cameraYaw) * normS

          targetVx = dirX * MAX_SPEED
          targetVz = dirZ * MAX_SPEED
          playerBall.targetRotation = Math.atan2(dirX, dirZ)
        }

        velX = THREE.MathUtils.lerp(velX, targetVx, ACCEL)
        velZ = THREE.MathUtils.lerp(velZ, targetVz, ACCEL)

        if (len === 0) {
          velX = THREE.MathUtils.lerp(velX, 0, FRICTION)
          velZ = THREE.MathUtils.lerp(velZ, 0, FRICTION)
        }

        const move = canMoveTo(posX + velX * dt, posZ + velZ * dt)
        posX = move.clampedX
        posZ = move.clampedZ
      } else {
        velX = 0
        velZ = 0
      }

      // Update Player Ball
      playerBall.root.position.set(posX, 0, posZ)
      playerBall.root.rotation.y = THREE.MathUtils.lerp(playerBall.root.rotation.y, playerBall.targetRotation, 0.22)

      const isMoving = Math.hypot(velX, velZ) > 0.3
      if (isMoving) {
        const bounce = Math.abs(Math.sin(elapsed * 12))
        playerBall.sphere.position.y = 1.0 + bounce * 0.45
        playerBall.sphere.scale.set(
          1.0 - bounce * 0.1,
          1.0 + bounce * 0.18,
          1.0 - bounce * 0.1,
        )
        playerBall.shadow.scale.setScalar(1.0 - bounce * 0.3)
      } else {
        playerBall.sphere.position.y = 1.0 + Math.sin(elapsed * 2.8) * 0.05
        playerBall.sphere.scale.set(1, 1, 1)
        playerBall.shadow.scale.setScalar(1)
      }

      // Animate Realistic Water Wave Flow
      water.material.uniforms["time"].value += 1.0 / 60.0

      // NPCs face player
      let closestNpc: StoryNpc | null = null
      let closestDist = Number.POSITIVE_INFINITY

      npcs.forEach((npc) => {
        const rig = npcBalls.get(npc.id)
        if (rig) {
          const [nx, nz] = npcCoords[npc.id] || [-20, 0]
          const dist = Math.hypot(nx - posX, nz - posZ)

          if (dist < 4.5) {
            const angle = Math.atan2(posX - nx, posZ - nz)
            rig.root.rotation.y = THREE.MathUtils.lerp(rig.root.rotation.y, angle, 0.12)
          }

          if (dist < 3.5 && dist < closestDist) {
            closestNpc = npc
            closestDist = dist
          }
          rig.sphere.position.y = 1.0 + Math.sin(elapsed * 2.6 + nx) * 0.06
        }
      })

      if (closestNpc?.id !== currentNearbyId) {
        currentNearbyId = closestNpc ? closestNpc.id : null
        onNearbyChangeRef.current(closestNpc)
      }

      portalLight.intensity = 4.5 + Math.sin(elapsed * 3.5) * 1.6
      lanternLights.forEach(({ light, baseIntensity }) => {
        light.intensity = baseIntensity + (Math.sin(elapsed * 9 + light.position.x) + (Math.random() - 0.5) * 0.3) * 0.35
      })

      // Third-person camera follow
      const camX = posX - Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
      const camY = Math.max(1.5, Math.sin(cameraPitch) * cameraDistance)
      const camZ = posZ - Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, camX, 0.12)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, 0.12)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camZ, 0.12)
      camera.lookAt(posX, 1.2, posZ)

      renderer.render(scene, camera)
    }

    animId = requestAnimationFrame(loop)

    function onResize() {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("mousemove", onMouseMove)
      renderer.domElement.removeEventListener("wheel", onWheel)
      renderer.domElement.removeEventListener("click", onClick)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [playerId, playerMeta, npcs, onNpcClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
    </div>
  )
}
