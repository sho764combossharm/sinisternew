"use client"

import { useState } from "react"
import { characters, type Character } from "@/lib/characters"
import { CharacterAvatar, CharacterChatPanel } from "@/components/character-chat"
import { StoryGame } from "@/components/story-game"
import { cn } from "@/lib/utils"

export default function Page() {
  const [mode, setMode] = useState<"chat" | "story">("chat")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, Character>>({})

  const displayCharacters = characters.map((c) => overrides[c.id] ?? c)
  const active = displayCharacters.find((c) => c.id === activeId) ?? null
  const activeBaseId = characters.find((c, i) => displayCharacters[i].id === activeId)?.id ?? null

  return (
    <main
      className={cn(
        "h-screen w-screen overflow-hidden relative bg-gradient-to-b transition-colors duration-700",
        active ? active.theme : "from-neutral-950 via-black to-black",
      )}
    >
      <div className="absolute left-0 top-0 right-0 z-20 flex items-center justify-center gap-2 p-3">
        <div className="flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              mode === "chat" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            Chat Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("story")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              mode === "story" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            Storyline Mode
          </button>
        </div>
      </div>

      {mode === "story" ? (
        <div className="absolute inset-0 pt-16">
          <StoryGame />
        </div>
      ) : (
        <>
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
            {displayCharacters.map((character, i) => {
              const baseId = characters[i].id
              return (
                <CharacterAvatar
                  key={baseId}
                  character={character}
                  isActive={activeId === character.id}
                  sizeClassName="h-20 w-20"
                  onClick={() => setActiveId((id) => (id === character.id ? null : character.id))}
                />
              )
            })}
          </div>

          {active ? (
            <div className="absolute inset-y-8 left-32 right-8">
              <CharacterChatPanel
                key={activeBaseId}
                character={active}
                onTransform={(next) => {
                  if (activeBaseId) {
                    setOverrides((prev) => ({ ...prev, [activeBaseId]: next }))
                  }
                  setActiveId(next.id)
                }}
              />
            </div>
          ) : (
            <p className="absolute left-32 top-1/2 -translate-y-1/2 text-white/40 text-sm">
              click a picture to start chatting
            </p>
          )}
        </>
      )}
    </main>
  )
}
