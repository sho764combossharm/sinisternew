"use client"

import { useState } from "react"
import { alternateForms, type Character, type Media } from "@/lib/characters"
import { cn } from "@/lib/utils"

type Message = {
  from: "them" | "you"
  text: string
  media?: Media
}

export function CharacterAvatar({
  character,
  isActive,
  onClick,
  style,
  sizeClassName = "h-32 w-32",
}: {
  character: Character
  isActive: boolean
  onClick: () => void
  style?: React.CSSProperties
  sizeClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-full overflow-hidden border-2 transition-all shrink-0",
        sizeClassName,
        "hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        isActive ? "border-white shadow-[0_0_0_4px_rgba(255,255,255,0.15)]" : "border-white/20",
      )}
      aria-pressed={isActive}
      aria-label={`Chat with ${character.name}`}
    >
      <img
        src={character.image || "/placeholder.svg"}
        alt={character.name}
        className={cn("h-full w-full object-cover", character.imageFilterClass)}
      />
    </button>
  )
}

export function CharacterChatPanel({
  character,
  onTransform,
}: {
  character: Character
  onTransform?: (next: Character) => void
}) {
  const [current, setCurrent] = useState<Character>(character)
  const [messages, setMessages] = useState<Message[]>([{ from: "them", text: character.greeting }])
  const [askedIndexes, setAskedIndexes] = useState<Set<number>>(new Set())
  const [transformed, setTransformed] = useState(false)

  function ask(index: number) {
    const pair = current.qa[index]
    setMessages((prev) => [
      ...prev,
      { from: "you", text: pair.question },
      { from: "them", text: pair.answer, media: pair.media },
    ])
    setAskedIndexes((prev) => new Set(prev).add(index))

    if (pair.transformTo) {
      const next = alternateForms[pair.transformTo]
      window.setTimeout(() => {
        setCurrent(next)
        setTransformed(true)
        setAskedIndexes(new Set())
        setMessages((prev) => [...prev, { from: "them", text: next.greeting }])
        onTransform?.(next)
      }, 400)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <img
          key={current.image}
          src={current.image || "/placeholder.svg"}
          alt=""
          className={cn(
            "h-9 w-9 rounded-full object-cover border border-white/20 transition-all",
            current.imageFilterClass,
            transformed && "animate-in fade-in zoom-in duration-500",
          )}
        />
        <p className="text-sm font-semibold text-white">{current.name}</p>
        {transformed ? (
          <span className="ml-auto rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
            transformed
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug",
                m.from === "you" ? "bg-white text-black" : "bg-white/10 text-white",
              )}
            >
              <p>{m.text}</p>
              {m.media?.type === "image" ? (
                <img
                  src={m.media.src || "/placeholder.svg"}
                  alt=""
                  className="mt-2 max-h-40 w-full rounded-lg object-cover"
                />
              ) : null}
              {m.media?.type === "video" ? (
                <video src={m.media.src} controls className="mt-2 max-h-48 w-full rounded-lg" />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-3 py-3">
        <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-white/40">Ask something</p>
        <div className="flex flex-wrap gap-2">
          {current.qa.map((pair, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ask(i)}
              disabled={askedIndexes.has(i)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                askedIndexes.has(i)
                  ? "border-white/10 text-white/30 cursor-not-allowed"
                  : pair.transformTo
                    ? "border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white"
                    : "border-white/25 text-white hover:bg-white hover:text-black",
              )}
            >
              {pair.question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
