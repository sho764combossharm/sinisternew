"use client"

import { useEffect, useMemo, useState } from "react"
import {
  allStoryNpcs,
  playableCharacters,
  storyFinale,
  storyIntro,
  type DialogueChoice,
  type PlayableId,
  type StoryNpc,
} from "@/lib/story"
import { cn } from "@/lib/utils"
import { Story3DScene } from "@/components/story-3d-scene"

export function StoryGame() {
  const [playerId, setPlayerId] = useState<PlayableId | null>(null)
  const [nearbyNpc, setNearbyNpc] = useState<StoryNpc | null>(null)
  const [activeNpc, setActiveNpc] = useState<StoryNpc | null>(null)
  const [activeChoice, setActiveChoice] = useState<DialogueChoice | null>(null)
  const [dialogueText, setDialogueText] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [emotion, setEmotion] = useState<string | null>(null)
  const [lineIndex, setLineIndex] = useState(0)
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [clues, setClues] = useState<string[]>([])
  const [latestClueToast, setLatestClueToast] = useState<string | null>(null)
  const [showFinale, setShowFinale] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showJournal, setShowJournal] = useState(false)

  const npcs = useMemo(() => allStoryNpcs.filter((n) => n.id !== playerId), [playerId])

  // Open NPC Conversation
  function startConversation(npc: StoryNpc) {
    setActiveNpc(npc)
    setActiveChoice(null)
    setLineIndex(0)
    setEmotion(null)
    setDialogueText(npc.greeting)

    setVisited((prev) => {
      const next = new Set(prev).add(npc.id)
      if (next.size === npcs.length) {
        window.setTimeout(() => setShowFinale(true), 400)
      }
      return next
    })
  }

  // Branching Choice Pick
  function chooseOption(choice: DialogueChoice) {
    setActiveChoice(choice)
    setDialogueText(choice.response)
    setEmotion(choice.emotion)
    if (choice.clue && !clues.includes(choice.clue)) {
      setClues((prev) => [...prev, choice.clue!])
      setLatestClueToast(choice.clue)
      window.setTimeout(() => setLatestClueToast(null), 4000)
    }
  }

  // Next standard monologue line
  function advanceStandard() {
    if (!activeNpc) return
    if (lineIndex + 1 < activeNpc.lines.length) {
      setLineIndex((i) => i + 1)
      setDialogueText(activeNpc.lines[lineIndex + 1])
      setActiveChoice(null)
      setEmotion(null)
    } else {
      setActiveNpc(null)
    }
  }

  function selectHero(id: PlayableId) {
    setPlayerId(id)
    setVisited(new Set())
    setClues([])
    setActiveNpc(null)
    setShowFinale(false)
    setShowIntro(true)
  }

  // Typewriter text effect
  useEffect(() => {
    if (!dialogueText) {
      setDisplayedText("")
      return
    }
    let currentIndex = 0
    setDisplayedText("")
    const interval = setInterval(() => {
      currentIndex += 2
      if (currentIndex >= dialogueText.length) {
        setDisplayedText(dialogueText)
        clearInterval(interval)
      } else {
        setDisplayedText(dialogueText.slice(0, currentIndex))
      }
    }, 15)
    return () => clearInterval(interval)
  }, [dialogueText])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveNpc(null)
        setShowIntro(false)
        setShowJournal(false)
        return
      }

      if (e.key.toLowerCase() === "e" && nearbyNpc && !activeNpc && !showIntro) {
        startConversation(nearbyNpc)
        return
      }

      if (activeNpc) {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const idx = Number.parseInt(e.key) - 1
          if (activeNpc.choices && activeNpc.choices[idx]) {
            chooseOption(activeNpc.choices[idx])
          }
        } else if (e.key === " " || e.key === "Enter") {
          advanceStandard()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeNpc, nearbyNpc, showIntro])

  if (!playerId) {
    return <CharacterSelect onSelect={selectHero} />
  }

  const playerMeta = playableCharacters.find((c) => c.id === playerId)!

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950 select-none font-sans">
      {/* 3D WebGL World */}
      <div className="absolute inset-0">
        <Story3DScene
          playerId={playerId}
          playerMeta={playerMeta}
          npcs={npcs}
          visited={visited}
          onNearbyChange={setNearbyNpc}
          onNpcClick={startConversation}
          isDialogueOpen={Boolean(activeNpc || showIntro || showFinale)}
        />
      </div>

      {/* TOP AAA RPG HUD */}
      <div className="absolute left-6 right-6 top-6 z-20 flex items-start justify-between pointer-events-none">
        {/* Left: Player Profile & Active Quest */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          {/* Player Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-white/20 bg-black/60 px-4 py-2.5 backdrop-blur-xl shadow-2xl">
            <div
              className="relative h-11 w-11 overflow-hidden rounded-full border-2 shadow-lg"
              style={{ borderColor: playerMeta.bodyColor, boxShadow: `0 0 16px ${playerMeta.bodyColor}88` }}
            >
              <img src={playerMeta.image || "/placeholder.svg"} alt={playerMeta.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">{playerMeta.name}</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  {playerMeta.role}
                </span>
              </div>
              <p className="text-[11px] text-white/50">Village of Sahur · Twilight</p>
            </div>
          </div>

          {/* Quest Banner */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/45 px-3.5 py-2 text-xs text-white/80 backdrop-blur-md shadow-lg max-w-md">
            <span className="text-emerald-400">⚔️</span>
            <span>
              <strong>Quest:</strong> Investigate the residents and cross the Grand Bridge to find Nathan.
            </span>
          </div>
        </div>

        {/* Right: Controls Hint & Action Buttons */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-[11px] text-white/60 backdrop-blur-md">
            <span>🖱️ Drag to Orbit 360°</span>
            <span>•</span>
            <span>📜 Scroll to Zoom</span>
            <span>•</span>
            <span>⌨️ WASD to Move</span>
          </div>

          <button
            type="button"
            onClick={() => setShowJournal(true)}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl shadow-xl hover:bg-white/10 transition-colors"
          >
            <span>📜 Journal</span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
              {visited.size}/{npcs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlayerId(null)}
            className="rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 text-xs font-medium text-white/70 hover:text-white backdrop-blur-xl shadow-xl hover:bg-white/10 transition-colors"
          >
            Switch Hero
          </button>
        </div>
      </div>

      {/* Clue Discovered Notification Toast */}
      {latestClueToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-neutral-950/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Clue Uncovered</p>
              <p className="text-xs font-medium text-white">{latestClueToast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Proximity Interaction Prompt */}
      {nearbyNpc && !activeNpc && !showIntro && !showFinale && (
        <div className="absolute left-1/2 bottom-10 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-black/85 px-6 py-3 backdrop-blur-xl shadow-2xl animate-bounce">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-medium text-white">
              Press <kbd className="rounded-lg bg-white/25 px-2 py-0.5 font-mono font-bold text-white shadow">E</kbd> or Click to interrogate{" "}
              <strong className="text-emerald-300 font-bold">{nearbyNpc.name}</strong>
            </span>
          </div>
        </div>
      )}

      {/* CINEMATIC AAA LOWER-THIRD DIALOGUE OVERLAY */}
      {activeNpc && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-6 px-4 md:px-8 pointer-events-none">
          <div className="w-full max-w-5xl rounded-3xl border border-white/20 bg-neutral-950/95 p-6 md:p-8 shadow-2xl backdrop-blur-2xl pointer-events-auto flex flex-col md:flex-row gap-6 md:gap-8 animate-in slide-in-from-bottom-6 duration-300">
            {/* NPC Glowing Portrait & Credentials */}
            <div className="flex md:flex-col items-center md:items-start gap-4 md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
              <div
                className="relative h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-full border-3 shadow-2xl"
                style={{ borderColor: activeNpc.bodyColor, boxShadow: `0 0 24px ${activeNpc.bodyColor}99` }}
              >
                <img src={activeNpc.image || "/placeholder.svg"} alt={activeNpc.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-wide">{activeNpc.name}</h4>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">{activeNpc.title}</p>
                {emotion && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-[11px] text-emerald-300 font-mono">
                    [{emotion}]
                  </span>
                )}
              </div>
            </div>

            {/* Main Dialogue Content & Inquiries */}
            <div className="flex-1 flex flex-col justify-between min-h-[160px]">
              <div>
                <p className="text-base md:text-lg text-white/95 leading-relaxed font-sans min-h-[64px]">
                  {displayedText}
                  <span className="inline-block w-2 h-5 ml-1.5 bg-emerald-400 animate-pulse align-middle" />
                </p>
              </div>

              {/* Branching Dialogue Inquiries */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2.5">Interrogation Topics</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeNpc.choices.map((choice, i) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => chooseOption(choice)}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl border p-3 text-left text-xs transition-all",
                        activeChoice?.id === choice.id
                          ? "border-emerald-400 bg-emerald-500/20 text-white shadow-lg"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/25 hover:text-white",
                      )}
                    >
                      <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center font-mono text-[11px] font-bold text-white/80 group-hover:bg-emerald-400 group-hover:text-black transition-colors shrink-0">
                        {i + 1}
                      </span>
                      <span className="line-clamp-2 font-medium">{choice.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-white/40">Press 1-3 to ask · Space to continue</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={advanceStandard}
                      className="rounded-full bg-white px-6 py-2 text-xs font-bold text-black hover:bg-white/90 transition-all shadow-xl hover:scale-105"
                    >
                      {lineIndex + 1 >= activeNpc.lines.length ? "Finish Speaking" : "Continue Story →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNpc(null)}
                      className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-xs font-semibold text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Journal Modal */}
      {showJournal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full rounded-3xl border border-white/20 bg-neutral-950/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📜</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Investigator's Journal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJournal(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Discovered Evidence ({clues.length})</p>
              {clues.length === 0 ? (
                <p className="text-xs text-white/40 italic">No clues gathered yet. Talk to the villagers to uncover their secrets.</p>
              ) : (
                clues.map((clue, idx) => (
                  <div key={idx} className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-white/95 flex gap-2.5 shadow-md">
                    <span className="text-emerald-400 shrink-0 text-sm">💡</span>
                    <span>{clue}</span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowJournal(false)}
              className="mt-6 w-full rounded-2xl bg-white py-2.5 text-xs font-bold text-black hover:bg-white/90 transition-colors"
            >
              Close Journal
            </button>
          </div>
        </div>
      )}

      {/* Story Intro Screen */}
      {showIntro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-lg w-full rounded-3xl border border-white/20 bg-neutral-950/95 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-xl">
              🌲
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">The Mystery of Sahur</h3>
            <p className="mt-3 text-xs text-white/80 leading-relaxed">{storyIntro}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">3D Movement</p>
                <p className="text-xs text-white/70 mt-1">WASD to move · Drag mouse to rotate view 360°</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Investigation</p>
                <p className="text-xs text-white/70 mt-1">Press E or Click NPCs to cross-examine</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mt-7 w-full rounded-2xl bg-white py-3.5 text-xs font-bold text-black hover:bg-white/90 transition-all shadow-xl hover:scale-[1.01]"
            >
              Begin Investigation
            </button>
          </div>
        </div>
      )}

      {/* Story Finale Modal */}
      {showFinale && !activeNpc && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="max-w-lg w-full rounded-3xl border border-emerald-400/40 bg-neutral-950/95 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-3 text-4xl animate-bounce">✨</div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">The Case Closed</h3>
            <p className="text-xs text-white/95 leading-relaxed font-sans">{storyFinale}</p>
            <button
              type="button"
              onClick={() => setShowFinale(false)}
              className="mt-6 w-full rounded-2xl bg-white py-3 text-xs font-bold text-black hover:bg-white/90 transition-colors shadow-lg"
            >
              Continue Exploring the Village
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CharacterSelect({ onSelect }: { onSelect: (id: PlayableId) => void }) {
  return (
    <div className="relative h-screen w-screen flex items-center justify-center p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black select-none">
      <div className="max-w-xl w-full rounded-3xl border border-white/15 bg-neutral-950/90 p-8 text-center backdrop-blur-2xl shadow-2xl">
        <h2 className="text-xl font-bold text-white tracking-wide">Choose Your Ball Champion</h2>
        <p className="mt-1.5 text-xs text-white/50">Your chosen hero rolls across the village; all others become residents to interrogate</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {playableCharacters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-white/30 transition-all hover:scale-[1.03] shadow-lg"
            >
              <div
                className="relative h-20 w-20 rounded-full overflow-hidden border-3 transition-transform group-hover:scale-105 shadow-2xl"
                style={{ borderColor: c.bodyColor, boxShadow: `0 0 18px ${c.bodyColor}88` }}
              >
                <img src={c.image || "/placeholder.svg"} alt={c.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/90">{c.name}</p>
                <p className="text-[10px] font-semibold text-emerald-400 mt-0.5">{c.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
