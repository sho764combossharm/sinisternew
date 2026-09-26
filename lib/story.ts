export type PlayableId = "tung" | "silly" | "able" | "tralalero"
export type StoryCharacterId = PlayableId | "nathan"

export type Tile = "grass" | "path" | "water" | "bridge" | "tree" | "flower"

/** Pixel size of one tile. */
export const TILE = 48
export const COLS = 24
export const ROWS = 14
export const WORLD_W = COLS * TILE
export const WORLD_H = ROWS * TILE

const RIVER_COL = 16
const MAIN_ROW = 7

function tileCenter(col: number, row: number) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 }
}

function buildVillageGrid(): Tile[][] {
  const grid: Tile[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "grass" as Tile))

  for (let c = 0; c < COLS; c++) {
    grid[0][c] = "tree"
    grid[ROWS - 1][c] = "tree"
  }
  for (let r = 0; r < ROWS; r++) {
    grid[r][0] = "tree"
    grid[r][COLS - 1] = "tree"
  }

  // river running top to bottom, with a single bridge crossing on the main path
  for (let r = 1; r < ROWS - 1; r++) {
    grid[r][RIVER_COL] = "water"
  }

  // main east-west path connecting spawn to the bridge and beyond
  for (let c = 1; c < COLS - 1; c++) {
    if (grid[MAIN_ROW][c] !== "water") grid[MAIN_ROW][c] = "path"
  }
  grid[MAIN_ROW][RIVER_COL] = "bridge"

  // side paths leading to each friend's hut
  const spurs: Array<[col: number, rowA: number, rowB: number]> = [
    [4, 3, MAIN_ROW], // tung
    [8, MAIN_ROW, 11], // silly
    [13, 4, MAIN_ROW], // able
    [12, MAIN_ROW, 10], // tralalero, by the riverbank
    [20, MAIN_ROW, 10], // nathan, hidden across the bridge
  ]
  for (const [c, rowA, rowB] of spurs) {
    for (let r = Math.min(rowA, rowB); r <= Math.max(rowA, rowB); r++) {
      if (grid[r][c] !== "water") grid[r][c] = "path"
    }
  }

  const decorativeTrees: Array<[number, number]> = [
    [3, 2],
    [3, 11],
    [11, 2],
    [11, 11],
    [21, 2],
    [21, 11],
    [6, 9],
    [17, 3],
    [17, 11],
    [9, 9],
    [15, 5],
  ]
  for (const [c, r] of decorativeTrees) grid[r][c] = "tree"

  const flowers: Array<[number, number]> = [
    [5, 5],
    [9, 4],
    [14, 9],
    [19, 4],
    [6, 5],
    [10, 10],
    [18, 9],
  ]
  for (const [c, r] of flowers) if (grid[r][c] === "grass") grid[r][c] = "flower"

  return grid
}

export const villageGrid = buildVillageGrid()

export function isBlockedTile(tile: Tile | undefined) {
  return tile === undefined || tile === "tree" || tile === "water"
}

export const spawnPoint = tileCenter(2, MAIN_ROW)

export type StoryNpc = {
  id: StoryCharacterId
  name: string
  image: string
  bodyColor: string
  x: number
  y: number
  lines: string[]
}

export const playableCharacters: { id: PlayableId; name: string; image: string; bodyColor: string }[] = [
  { id: "tung", name: "Tung Tung Sahur", image: "/images/tung-tung-sahur.png", bodyColor: "#b91c1c" },
  { id: "silly", name: "Silly Boy Sho", image: "/images/silly-boy.jpg", bodyColor: "#52525b" },
  { id: "able", name: "Able", image: "/images/able.jpg", bodyColor: "#1d4ed8" },
  { id: "tralalero", name: "Tralalero Tralala", image: "/images/tralalero-tralala.png", bodyColor: "#0e7490" },
]

export const storyIntro =
  "the village of sahur went quiet the night nathan tried the impossible knock and never came home. pick someone who knew him. cross the village, hear every side of the story, then cross the bridge and find out what's really on the other bank."

export const allStoryNpcs: StoryNpc[] = [
  {
    id: "tung",
    name: "Tung Tung Sahur",
    image: "/images/tung-tung-sahur.png",
    bodyColor: "#b91c1c",
    ...tileCenter(4, 3),
    lines: [
      "tung tung tung sahur. you're wandering pretty far from the gate.",
      "i patrol at 4am. that's the hour nathan crossed the bridge toward the old door.",
      "he said he could do a nathan. knocked once. the door didn't knock back.",
      "i've stood at that bridge every night since. nobody else has crossed it.",
      "if you're going after him, don't knock on that door. just bring him home.",
    ],
  },
  {
    id: "silly",
    name: "Silly Boy Sho",
    image: "/images/silly-boy.jpg",
    bodyColor: "#52525b",
    ...tileCenter(8, 11),
    lines: [
      "...",
      "you're not from here. nobody stops to look at me anymore.",
      "i was with nathan that night. i was tying my shoe by the river when he crossed.",
      "i saw the door open for him. i saw it close on nothing.",
      "i don't stand up because standing up means it's over. it's not over. go check the bridge.",
    ],
  },
  {
    id: "able",
    name: "Able",
    image: "/images/able.jpg",
    bodyColor: "#1d4ed8",
    ...tileCenter(13, 4),
    lines: [
      "figured someone would eventually walk this far into the village.",
      "i keep a file on everyone here. names, debts, secrets. it's how i stay rich.",
      "nathan's file is one page. he asked me for a loan to buy a door and i said no.",
      "somebody else sold him that door. shipped it in from past the river.",
      "if he's still around, he's on the other side of that bridge. that's where the door went.",
    ],
  },
  {
    id: "tralalero",
    name: "Tralalero Tralala",
    image: "/images/tralalero-tralala.png",
    bodyColor: "#0e7490",
    ...tileCenter(12, 10),
    lines: [
      "tralalero tralala. the river guardian doesn't usually get visitors.",
      "the water used to be clean. it changed the night the door took nathan.",
      "porco dio, i watched him cross the bridge. he never came back this side.",
      "i hear knocking from the other bank sometimes. small. scared. like someone stuck.",
      "cross if you want. just don't let the water decide you're worth turning red for too.",
    ],
  },
  {
    id: "nathan",
    name: "Nathan",
    image: "/images/nathan.png",
    bodyColor: "#059669",
    ...tileCenter(20, 10),
    lines: [
      "...oh. you actually came looking.",
      "i knocked on the door. it opened. i walked through and it just... led to this side of the river.",
      "i got so scared i never walked back over the bridge. that's it. that's the whole secret.",
      "tung tung thinks it's a mystery. able thinks someone sold me a cursed door. it's just a door.",
      "can we just go back? i don't want to be the guy who 'did a nathan' anymore.",
    ],
  },
]

export const storyFinale =
  "the impossible knock wasn't impossible at all — nathan just froze on the wrong side of a bridge and let the whole village build a legend out of it. tung tung still guards the gate out of habit. silly boy finally stands up. able marks the file closed. tralalero tralala stops watching the water so closely. and nathan walks home, mildly embarrassed, still unable to explain why he never just turned around."
