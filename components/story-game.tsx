"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  allStoryNpcs,
  isBlockedTile,
  playableCharacters,
  spawnPoint,
  storyFinale,
  storyIntro,
  TILE,
  villageGrid,
  WORLD_H,
  WORLD_W,
  type PlayableId,
  type StoryNpc,
} from "@/lib/story"
import { cn } from "@/lib/utils"

const PLAYER_HALF = 13
const NPC_RADIUS = 22
const TALK_RADIUS = 62
const SPEED = 3.4

type Facing = "left" | "right"

function tileAt(px: number, py: number) {
  const col = Math.floor(px / TILE)
  const row = Math.floor(py / TILE)
  if (row < 0 || row >= villageGrid.length || col < 0 || col >= villageGrid[0].length) return undefined
  return villageGrid[row][col]
}

function isBlockedAt(x: number, y: number) {
  const corners = [
    [x - PLAYER_HALF, y - PLAYER_HALF],
    [x + PLAYER_HALF, y - PLAYER_HALF],
    [x - PLAYER_HALF, y + PLAYER_HALF],
    [x + PLAYER_HALF, y + PLAYER_HALF],
  ]
  return corners.some(([cx, cy]) => isBlockedTile(tileAt(cx, cy)))
}

export function StoryGame() {
  const [playerId, setPlayerId] = useState<PlayableId | null>(null)
  const [pos, setPos] = useState(spawnPoint)
  const [facing, setFacing] = useState<Facing>("right")
  const [moving, setMoving] = useState(false)
  const [nearbyNpc, setNearbyNpc] = useState<StoryNpc | null>(null)
  const [activeNpc, setActiveNpc] = useState<StoryNpc | null>(null)
  const [lineIndex, setLineIndex] = useState(0)
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [showFinale, setShowFinale] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const keysRef = useRef<Set<string>>(new Set())
  const posRef = useRef(pos)
  posRef.current = pos
  const activeNpcRef = useRef(activeNpc)
  activeNpcRef.current = activeNpc
  const nearbyNpcRef = useRef(nearbyNpc)
  nearbyNpcRef.current = nearbyNpc

  const npcs = useMemo(() => allStoryNpcs.filter((n) => n.id !== playerId), [playerId])

  function openNpc(npc: StoryNpc) {
    setActiveNpc(npc)
    setLineIndex(0)
    setVisited((prev) => {
      const next = new Set(prev).add(npc.id)
      if (next.size === npcs.length) {
        window.setTimeout(() => setShowFinale(true), 300)
      }
      return next
    })
  }

  function advance() {
    const npc = activeNpcRef.current
    if (!npc) return
    if (lineIndex + 1 >= npc.lines.length) {
      setActiveNpc(null)
      return
    }
    setLineIndex((i) => i + 1)
  }

  function selectPlayer(id: PlayableId) {
    setPlayerId(id)
    setPos(spawnPoint)
    setFacing("right")
    setVisited(new Set())
    setActiveNpc(null)
    setShowFinale(false)
    setShowIntro(true)
    keysRef.current.clear()
  }

  useEffect(() => {
    if (!playerId) return
    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key.toLowerCase() === "e") {
        if (activeNpcRef.current) {
          advance()
        } else if (nearbyNpcRef.current) {
          openNpc(nearbyNpcRef.current)
        }
      }
      if (e.key === "Escape") {
        setActiveNpc(null)
        setShowIntro(false)
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key.toLowerCase())
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads latest npc/line state via refs
  }, [playerId, lineIndex])

  useEffect(() => {
    if (!playerId) return
    let raf: number
    function loop() {
      const keys = keysRef.current
      if (!activeNpcRef.current && !showIntro) {
        const { x, y } = posRef.current
        let dx = 0
        let dy = 0
        if (keys.has("arrowup") || keys.has("w")) dy -= 1
        if (keys.has("arrowdown") || keys.has("s")) dy += 1
        if (keys.has("arrowleft") || keys.has("a")) dx -= 1
        if (keys.has("arrowright") || keys.has("d")) dx += 1

        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy)
          const vx = (dx / len) * SPEED
          const vy = (dy / len) * SPEED

          let nextX = x
          let nextY = y

          const tryX = x + vx
          if (!isBlockedAt(tryX, y) && !npcs.some((n) => Math.hypot(n.x - tryX, n.y - y) < NPC_RADIUS)) {
            nextX = Math.min(WORLD_W - PLAYER_HALF, Math.max(PLAYER_HALF, tryX))
          }
          const tryY = y + vy
          if (!isBlockedAt(nextX, tryY) && !npcs.some((n) => Math.hypot(n.x - nextX, n.y - tryY) < NPC_RADIUS)) {
            nextY = Math.min(WORLD_H - PLAYER_HALF, Math.max(PLAYER_HALF, tryY))
          }

          if (dx < 0) setFacing("left")
          if (dx > 0) setFacing("right")
          setMoving(nextX !== x || nextY !== y)
          setPos({ x: nextX, y: nextY })

          let closest: StoryNpc | null = null
          let closestDist = Number.POSITIVE_INFINITY
          for (const npc of npcs) {
            const d = Math.hypot(npc.x - nextX, npc.y - nextY)
            if (d < TALK_RADIUS && d < closestDist) {
              closest = npc
              closestDist = d
            }
          }
          setNearbyNpc(closest)
        } else {
          setMoving(false)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playerId, showIntro, npcs])

  if (!playerId) {
    return <CharacterSelect onSelect={selectPlayer} />
  }

  const playerMeta = playableCharacters.find((c) => c.id === playerId)!

  const viewportW = 900
  const viewportH = 560
  const cameraX = Math.min(Math.max(pos.x - viewportW / 2, 0), Math.max(WORLD_W - viewportW, 0))
  const cameraY = Math.min(Math.max(pos.y - viewportH / 2, 0), Math.max(WORLD_H - viewportH, 0))

  return (
    <div className="relative h-full w-full flex items-center justify-center p-4">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl outline-none bg-emerald-950"
        style={{ width: viewportW, height: viewportH, maxWidth: "100%", maxHeight: "100%" }}
        tabIndex={0}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate(${-cameraX}px, ${-cameraY}px)`,
          }}
        >
          <VillageMap />

          {npcs.map((npc) => (
            <NpcSprite key={npc.id} npc={npc} visited={visited.has(npc.id)} onClick={() => openNpc(npc)} />
          ))}

          <PlayerSprite x={pos.x} y={pos.y} facing={facing} moving={moving} bodyColor={playerMeta.bodyColor} image={playerMeta.image} />

          {nearbyNpc && !activeNpc && (
            <div
              className="absolute -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white border border-white/20 whitespace-nowrap"
              style={{ left: nearbyNpc.x, top: nearbyNpc.y - 58 }}
            >
              press E to talk
            </div>
          )}
        </div>

        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white/70 border border-white/10">
          {visited.size}/{npcs.length} lore fragments found
        </div>

        {showIntro && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
            <div className="max-w-md rounded-xl border border-white/15 bg-neutral-950/90 p-5 text-center">
              <p className="text-sm text-white/90 leading-relaxed">{storyIntro}</p>
              <p className="mt-3 text-[11px] text-white/40">WASD / arrows to move · E to talk</p>
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
              >
                begin
              </button>
            </div>
          </div>
        )}

        {activeNpc && (
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="mx-auto max-w-xl rounded-xl border border-white/15 bg-neutral-950/95 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeNpc.image || "/placeholder.svg"}
                  alt={activeNpc.name}
                  className="h-10 w-10 rounded-full object-cover border border-white/20"
                />
                <p className="text-xs font-semibold text-white/70">{activeNpc.name}</p>
              </div>
              <p className="mt-2 text-sm text-white leading-relaxed min-h-10">{activeNpc.lines[lineIndex]}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-white/40">
                  {lineIndex + 1} / {activeNpc.lines.length}
                </span>
                <button
                  type="button"
                  onClick={advance}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
                >
                  {lineIndex + 1 >= activeNpc.lines.length ? "close" : "continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showFinale && !activeNpc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
            <div className="max-w-md rounded-xl border border-emerald-400/30 bg-neutral-950/95 p-5 text-center">
              <p className="text-xs font-semibold text-emerald-400 mb-2">the full story</p>
              <p className="text-sm text-white/90 leading-relaxed">{storyFinale}</p>
              <button
                type="button"
                onClick={() => setShowFinale(false)}
                className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
              >
                close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CharacterSelect({ onSelect }: { onSelect: (id: PlayableId) => void }) {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-neutral-950/80 p-6 text-center">
        <p className="text-sm font-semibold text-white/90">choose who you play as</p>
        <p className="mt-1 text-xs text-white/40">everyone else becomes someone to find in the village</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {playableCharacters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-white/25 transition-colors"
            >
              <span
                className="h-16 w-16 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-105"
                style={{ borderColor: c.bodyColor }}
              >
                <img src={c.image || "/placeholder.svg"} alt={c.name} className="h-full w-full object-cover" />
              </span>
              <span className="text-xs font-medium text-white/80">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function VillageMap() {
  return (
    <div className="absolute left-0 top-0" style={{ width: WORLD_W, height: WORLD_H }}>
      {villageGrid.map((row, r) =>
        row.map((tile, c) => {
          const left = c * TILE
          const top = r * TILE
          if (tile === "water") {
            return (
              <div
                key={`${r}-${c}`}
                className="absolute bg-[linear-gradient(120deg,#0e7490,#155e75,#0e7490)] [background-size:200%_200%]"
                style={{ left, top, width: TILE, height: TILE, animation: "water-shimmer 3.5s ease-in-out infinite" }}
              />
            )
          }
          if (tile === "bridge") {
            return (
              <div key={`${r}-${c}`} className="absolute bg-amber-800" style={{ left, top, width: TILE, height: TILE }}>
                <div className="absolute inset-1 flex flex-col justify-between">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[3px] bg-amber-950/60 rounded-full" />
                  ))}
                </div>
              </div>
            )
          }
          if (tile === "tree") {
            return (
              <div key={`${r}-${c}`} className="absolute bg-emerald-900" style={{ left, top, width: TILE, height: TILE }}>
                <div className="absolute inset-2 rounded-full bg-emerald-700" />
                <div className="absolute left-1/2 top-1/2 h-3 w-2 -translate-x-1/2 rounded-sm bg-amber-950" />
              </div>
            )
          }
          if (tile === "path") {
            return <div key={`${r}-${c}`} className="absolute bg-amber-200/20" style={{ left, top, width: TILE, height: TILE }} />
          }
          if (tile === "flower") {
            return (
              <div key={`${r}-${c}`} className="absolute bg-emerald-800" style={{ left, top, width: TILE, height: TILE }}>
                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300" />
              </div>
            )
          }
          return <div key={`${r}-${c}`} className="absolute bg-emerald-800" style={{ left, top, width: TILE, height: TILE }} />
        }),
      )}
    </div>
  )
}

function NpcSprite({ npc, visited, onClick }: { npc: StoryNpc; visited: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center focus:outline-none"
      style={{ left: npc.x, top: npc.y + 20 }}
      aria-label={`Talk to ${npc.name}`}
    >
      <div style={{ animation: "npc-idle 2.4s ease-in-out infinite" }} className="flex flex-col items-center">
        <span
          className={cn(
            "h-11 w-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-110",
            visited ? "border-emerald-400/80" : "border-white/60",
          )}
          style={{ boxShadow: `0 0 0 3px ${npc.bodyColor}55` }}
        >
          <img src={npc.image || "/placeholder.svg"} alt={npc.name} className="h-full w-full object-cover" />
        </span>
        <span className="h-3 w-7 rounded-b-md" style={{ backgroundColor: npc.bodyColor }} />
      </div>
      <span className="mt-0.5 h-1.5 w-6 rounded-full bg-black/40 blur-[1px]" />
    </button>
  )
}

function PlayerSprite({
  x,
  y,
  facing,
  moving,
  bodyColor,
  image,
}: {
  x: number
  y: number
  facing: Facing
  moving: boolean
  bodyColor: string
  image: string
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y, width: 32, height: 52, transform: `translate(-50%, -50%) scaleX(${facing === "left" ? -1 : 1})` }}
    >
      <div className="relative h-full w-full" style={{ animation: moving ? "sprite-bob 0.35s ease-in-out infinite" : "idle-breathe 2s ease-in-out infinite" }}>
        <div className="absolute left-1/2 bottom-0 h-2 w-5 -translate-x-1/2 rounded-full bg-black/40 blur-[1px]" />

        <div
          className="absolute left-[9px] bottom-1 h-4 w-2 rounded-b-sm origin-top"
          style={{ backgroundColor: shade(bodyColor, -25), animation: moving ? "leg-swing-a 0.35s ease-in-out infinite" : undefined }}
        />
        <div
          className="absolute right-[9px] bottom-1 h-4 w-2 rounded-b-sm origin-top"
          style={{ backgroundColor: shade(bodyColor, -25), animation: moving ? "leg-swing-b 0.35s ease-in-out infinite" : undefined }}
        />

        <div
          className="absolute left-1 bottom-[18px] h-3 w-1.5 rounded-full origin-top"
          style={{ backgroundColor: shade(bodyColor, -10), animation: moving ? "arm-swing-a 0.35s ease-in-out infinite" : undefined }}
        />
        <div
          className="absolute right-1 bottom-[18px] h-3 w-1.5 rounded-full origin-top"
          style={{ backgroundColor: shade(bodyColor, -10), animation: moving ? "arm-swing-b 0.35s ease-in-out infinite" : undefined }}
        />

        <div
          className="absolute left-1/2 bottom-[14px] h-6 w-5 -translate-x-1/2 rounded-t-md"
          style={{ backgroundColor: bodyColor }}
        />

        <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 rounded-full overflow-hidden border-2 border-white/80 shadow-md">
          <img src={image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" style={{ transform: `scaleX(${facing === "left" ? -1 : 1})` }} />
        </div>
      </div>
    </div>
  )
}

function shade(hex: string, percent: number) {
  const num = Number.parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round((percent / 100) * 255)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255)))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round((percent / 100) * 255)))
  return `rgb(${r}, ${g}, ${b})`
}
