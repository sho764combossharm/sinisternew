export type Media = { type: "image" | "video"; src: string }

export type QA = {
  question: string
  answer: string
  /** Optional image/video shown under the answer bubble. */
  media?: Media
  /** If present, clicking this answer permanently swaps the character into the referenced alternate form. */
  transformTo?: keyof typeof alternateForms
}

export type Character = {
  id: "tung" | "silly" | "able" | "tung-gangster" | "ronaldo" | "tralalero" | "tralalero-sinister" | "nathan"
  name: string
  image: string
  /** Optional Tailwind filter classes applied to the avatar/header image (used for sinister forms without new art). */
  imageFilterClass?: string
  /** Tailwind gradient classes applied to the page background while this character is active. */
  theme: string
  greeting: string
  qa: QA[]
}

export const alternateForms = {
  "tung-gangster": {
    id: "tung-gangster",
    name: "Gangster Tung",
    image: "/images/gangster-tung.jpg",
    theme: "from-red-900 via-red-950 to-black",
    greeting: "tung tung sahur is gone. this is tungwaffen now.",
    qa: [
      {
        question: "what happened to you?",
        answer: "the division happened. i don't knock anymore. i collect.",
      },
      {
        question: "still got the bat?",
        answer: "upgraded. don't worry about what it upgraded to.",
      },
      {
        question: "is silly boy still your friend?",
        answer: "silly boy doesn't know this side of me. keep it that way.",
      },
      {
        question: "can i join the tungwaffen?",
        answer: "everyone wants in until they see the dues.",
      },
      {
        question: "rate yourself out of 10",
        answer: "i don't get rated. i rate you.",
      },
      {
        question: "do you regret this?",
        answer: "regret is for tung tung. i don't do that anymore.",
      },
      {
        question: "what's in the crate behind you?",
        answer: "questions like that are how people end up in crates.",
      },
      {
        question: "any advice?",
        answer: "knock twice. once for hello, once for goodbye.",
      },
      {
        question: "who do you answer to?",
        answer: "nobody. that's the whole business model.",
      },
      {
        question: "will you ever go back to normal?",
        answer: "there is no back. there's only forward and quiet.",
      },
    ],
  },
  "tralalero-sinister": {
    id: "tralalero-sinister",
    name: "Sinister Tralalero",
    image: "/images/tralalero-tralala.png",
    imageFilterClass: "grayscale contrast-150 sepia hue-rotate-180 saturate-[3]",
    theme: "from-red-950 via-black to-black",
    greeting: "tralalero... tralala... the shoes are red for a reason now.",
    qa: [
      {
        question: "what happened to your shoes?",
        answer: "they were never really nike. they were never really shoes.",
      },
      {
        question: "are you still a shark?",
        answer: "i was never just a shark. porco dio, figure it out.",
      },
      {
        question: "why do you sound different?",
        answer: "because the old tralalero couldn't say what needed saying.",
      },
      {
        question: "should i run?",
        answer: "you had time to run before you asked that.",
      },
      {
        question: "do you know nathan?",
        answer: "nathan again. even like this, i won't go near that name.",
      },
      {
        question: "what do you want?",
        answer: "i want the water to stop being the only red thing around here.",
      },
      {
        question: "can you turn back?",
        answer: "tralalero tralala can't hear you anymore. only i can.",
      },
    ],
  },
} satisfies Record<string, Character>

export const characters: Character[] = [
  {
    id: "tung",
    name: "Tung Tung Sahur",
    image: "/images/tung-tung-sahur.png",
    theme: "from-red-950 via-neutral-950 to-black",
    greeting: "tung tung tung sahur... what do you want",
    qa: [
      {
        question: "who are you?",
        answer: "i am tung tung tung sahur. i knock on your door at 4am.",
      },
      {
        question: "why do you have a bat?",
        answer: "tung tung tung sahur tung tung tung sahur. (this is the answer to everything)",
      },
      {
        question: "are you friends with silly boy?",
        answer: "he cries in the corner. i respect that. we are business partners.",
      },
      {
        question: "say something scary",
        answer: "maling! maling! tung tung tung sahur is coming for you.",
      },
      {
        question: "have you heard of nathan?",
        answer: "everyone's heard of nathan. nobody's seen him do it. i don't ask twice.",
      },
      {
        question: "join the tungwaffen?",
        answer: "you knock once. you don't get to un-knock.",
        transformTo: "tung-gangster",
      },
    ],
  },
  {
    id: "silly",
    name: "Silly Boy Sho",
    image: "/images/silly-boy.jpg",
    theme: "from-neutral-800 via-neutral-900 to-black",
    greeting: "...",
    qa: [
      {
        question: "why are you sitting like that?",
        answer: "no reason. just tying my shoe. for the 4th hour.",
      },
      {
        question: "are you okay?",
        answer: "yeah im sho sho.",
      },
      {
        question: "what are you thinking about?",
        answer: "nothing. absolutely nothing. (its everything)",
      },
      {
        question: "smile for me?",
        answer: "*does not smile*",
      },
      {
        question: "who is tung tung sahur to you?",
        answer: "he knocks. i sit. we don't talk about it.",
      },
      {
        question: "do you know nathan?",
        answer: "... he's the reason i sit like this.",
      },
    ],
  },
  {
    id: "able",
    name: "Able",
    image: "/images/able.jpg",
    theme: "from-blue-950 via-slate-950 to-black",
    greeting: "figured you'd show up eventually.",
    qa: [
      {
        question: "how much money do you have?",
        answer: "enough that i stopped checking.",
      },
      {
        question: "what do you do here?",
        answer: "i run things. quietly, mostly.",
      },
      {
        question: "do you know everything?",
        answer: "not everything. just more than i say.",
      },
      {
        question: "should i be worried?",
        answer: "depends what you're here for.",
      },
      {
        question: "do you know tung tung and silly boy?",
        answer: "they've crossed paths with my business before.",
      },
      {
        question: "what do you know about nathan?",
        answer: "i keep files on everyone. nathan's file is empty. that's not normal.",
      },
    ],
  },
  {
    id: "ronaldo",
    name: "Ronaldo",
    image: "/images/ronaldo.png",
    theme: "from-orange-900 via-orange-950 to-black",
    greeting: "siuuu. what do you want.",
    qa: [
      {
        question: "is it more than 100?",
        answer: "ahh, cheeky boy!",
        media: { type: "image", src: "/images/ronaldo.png" },
      },
      {
        question: "can ronaldo do this?",
        answer: "watch closely.",
        media: { type: "video", src: "/videos/ronaldo-do-this.mp4" },
      },
      {
        question: "who's the goat?",
        answer: "you already know the answer.",
      },
      {
        question: "any advice for me?",
        answer: "work hard in silence. siuu loud.",
      },
    ],
  },
  {
    id: "tralalero",
    name: "Tralalero Tralala",
    image: "/images/tralalero-tralala.png",
    theme: "from-cyan-950 via-slate-950 to-black",
    greeting: "tralalero tralala. porco dio, who woke up the shark?",
    qa: [
      {
        question: "why do you wear shoes?",
        answer: "a shark needs grip too. don't question the nikes.",
      },
      {
        question: "are you dangerous?",
        answer: "i haven't decided yet. ask again later.",
      },
      {
        question: "say something in italian",
        answer: "porco dio. that's most of the vocabulary.",
      },
      {
        question: "do you know nathan?",
        answer: "tralalero tralala. don't say that name near the shoes.",
      },
      {
        question: "what's beneath the surface?",
        answer: "something that isn't tralalero tralala anymore.",
        transformTo: "tralalero-sinister",
      },
    ],
  },
  {
    id: "nathan",
    name: "Nathan",
    image: "/images/nathan.png",
    theme: "from-emerald-950 via-neutral-950 to-black",
    greeting: "hey. before you ask — no, i can't do it.",
    qa: [
      {
        question: "can you do a nathan?",
        answer: "i can't do a nathan. nobody can. that's the whole point.",
        media: { type: "video", src: "/videos/nathan.mp4" },
      },
      {
        question: "why can't you do it?",
        answer: "if i could, it wouldn't be called doing a nathan.",
      },
      {
        question: "do you know tung tung?",
        answer: "everyone knows tung tung. i just don't answer the door anymore.",
      },
      {
        question: "what about able?",
        answer: "able offered me a job once. i still don't know what he does.",
      },
      {
        question: "and silly boy?",
        answer: "i left him a shoe once. he's still tying it.",
      },
      {
        question: "and tralalero tralala?",
        answer: "a shark in nikes asked me for life advice. i left the group chat.",
      },
    ],
  },
]
