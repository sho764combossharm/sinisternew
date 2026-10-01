export type PlayableId = "tung" | "silly" | "able" | "tralalero"
export type StoryCharacterId = PlayableId | "nathan"

export type Tile = "grass" | "path" | "water" | "bridge" | "tree" | "flower" | "stone" | "sand"

/** Pixel size of one tile. */
export const TILE = 48
export const COLS = 32
export const ROWS = 20
export const WORLD_W = COLS * TILE
export const WORLD_H = ROWS * TILE

const RIVER_COL = 20
const MAIN_ROW = 10

function tileCenter(col: number, row: number) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 }
}

function buildVillageGrid(): Tile[][] {
  const grid: Tile[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "grass" as Tile))

  // Border dense forest
  for (let c = 0; c < COLS; c++) {
    grid[0][c] = "tree"
    grid[1][c] = "tree"
    grid[ROWS - 1][c] = "tree"
    grid[ROWS - 2][c] = "tree"
  }
  for (let r = 0; r < ROWS; r++) {
    grid[r][0] = "tree"
    grid[r][1] = "tree"
    grid[r][COLS - 1] = "tree"
    grid[r][COLS - 2] = "tree"
  }

  // Winding River (Col 19-21)
  for (let r = 1; r < ROWS - 1; r++) {
    const offset = Math.round(Math.sin(r * 0.45) * 1.5)
    grid[r][RIVER_COL + offset] = "water"
    grid[r][RIVER_COL + offset + 1] = "water"
  }

  // Main East-West Highway connecting Town Square to Grand Bridge & Nathan's Shrine
  for (let c = 2; c < COLS - 2; c++) {
    if (grid[MAIN_ROW][c] !== "water") grid[MAIN_ROW][c] = "path"
    if (grid[MAIN_ROW + 1][c] !== "water" && c < RIVER_COL) grid[MAIN_ROW + 1][c] = "path"
  }

  // Grand Bridge spanning the river
  const bridgeOffset = Math.round(Math.sin(MAIN_ROW * 0.45) * 1.5)
  grid[MAIN_ROW][RIVER_COL + bridgeOffset] = "bridge"
  grid[MAIN_ROW][RIVER_COL + bridgeOffset + 1] = "bridge"
  grid[MAIN_ROW + 1][RIVER_COL + bridgeOffset] = "bridge"
  grid[MAIN_ROW + 1][RIVER_COL + bridgeOffset + 1] = "bridge"

  // Town Square Cobblestone Plaza (Col 4-7, Row 9-12)
  for (let r = 8; r <= 12; r++) {
    for (let c = 3; c <= 7; c++) {
      grid[r][c] = "stone"
    }
  }

  // Branch Paths
  // 1. Path to Able's Estate (North-West)
  for (let r = 3; r <= 8; r++) grid[r][5] = "path"
  for (let c = 4; c <= 7; c++) grid[4][c] = "path"

  // 2. Path to Tung's Watchtower (North-Central)
  for (let r = 3; r <= MAIN_ROW; r++) grid[r][11] = "path"
  for (let c = 10; c <= 13; c++) grid[4][c] = "path"

  // 3. Path to Silly Boy's Riverside Meadow (South-West)
  for (let r = MAIN_ROW; r <= 16; r++) grid[r][8] = "path"
  for (let c = 7; c <= 10; c++) grid[16][c] = "path"

  // 4. Path to Tralalero's Riverbank Docks (South-Central)
  for (let r = MAIN_ROW; r <= 15; r++) grid[r][17] = "path"

  // 5. Path to Nathan's Forbidden Plateau (East)
  for (let c = 22; c <= 27; c++) grid[MAIN_ROW][c] = "path"
  for (let r = 8; r <= 12; r++) grid[r][26] = "path"

  // Decorative trees & groves
  const treeClusters: Array<[number, number]> = [
    [8, 4], [9, 5], [14, 5], [15, 6], [16, 4],
    [3, 14], [4, 15], [5, 16],
    [13, 14], [14, 15], [15, 16],
    [23, 4], [24, 5], [25, 4], [28, 5],
    [23, 15], [24, 16], [28, 15], [29, 14],
  ]
  for (const [c, r] of treeClusters) {
    if (r < ROWS && c < COLS && grid[r][c] === "grass") grid[r][c] = "tree"
  }

  // Flower fields
  const flowerClusters: Array<[number, number]> = [
    [3, 8], [7, 7], [9, 9], [10, 14], [11, 15], [12, 16],
    [15, 8], [16, 9], [24, 8], [25, 13], [27, 8], [28, 12],
  ]
  for (const [c, r] of flowerClusters) {
    if (r < ROWS && c < COLS && grid[r][c] === "grass") grid[r][c] = "flower"
  }

  return grid
}

export const villageGrid = buildVillageGrid()

export function isBlockedTile(tile: Tile | undefined) {
  return tile === undefined || tile === "tree" || tile === "water"
}

export const spawnPoint = tileCenter(5, 10)

export type DialogueChoice = {
  id: string
  label: string
  response: string
  emotion: string
  clue?: string
}

export type StoryNpc = {
  id: StoryCharacterId
  name: string
  title: string
  image: string
  bodyColor: string
  x: number
  y: number
  greeting: string
  lines: string[]
  choices: DialogueChoice[]
}

export const playableCharacters: { id: PlayableId; name: string; image: string; bodyColor: string; role: string }[] = [
  { id: "tung", name: "Tung Tung Sahur", image: "/images/tung-tung-sahur.png", bodyColor: "#b91c1c", role: "Night Watcher" },
  { id: "silly", name: "Silly Boy Sho", image: "/images/silly-boy.jpg", bodyColor: "#52525b", role: "Quiet Witness" },
  { id: "able", name: "Able", image: "/images/able.jpg", bodyColor: "#1d4ed8", role: "Syndicate Boss" },
  { id: "tralalero", name: "Tralalero Tralala", image: "/images/tralalero-tralala.png", bodyColor: "#0e7490", role: "River Guardian" },
]

export const storyIntro =
  "The mist settles over Sahur. Ever since Nathan attempted the forbidden knock and disappeared beyond the eastern bridge, strange whispers echo across the water. Explore the reworked 3D village, interrogate the residents, unearth hidden clues, and discover what truly awaits across the river."

export const allStoryNpcs: StoryNpc[] = [
  {
    id: "tung",
    name: "Tung Tung Sahur",
    title: "Vigilante of the 4am Knock",
    image: "/images/tung-tung-sahur.png",
    bodyColor: "#b91c1c",
    ...tileCenter(11, 4),
    greeting: "Tung... tung... sahur. Keep your eyes on the road. Who sent you up to the watchtower?",
    lines: [
      "I patrol at 4am with this bat. That's the exact hour Nathan crossed the bridge toward the forbidden door.",
      "He claimed he could perform 'a Nathan'. Knocked once into the void. The door didn't knock back.",
      "I've stood watch from this lookout every night since. Nobody else has had the guts to cross.",
      "If you're heading toward that eastern bank, keep your guard high. You don't get to un-knock.",
    ],
    choices: [
      {
        id: "bat",
        label: "What's the deal with the 4am bat?",
        response: "It's acoustic deterrent. When I strike a hollow door at 4am, whatever's hiding inside knows its lease is expired.",
        emotion: "smirks tightly",
        clue: "Tung knows the acoustic resonance of the door.",
      },
      {
        id: "nathan_knock",
        label: "What did Nathan's knock sound like that night?",
        response: "It wasn't a normal knock. It was a soft, cowardly triple-tap. Like someone begging the universe to say 'nobody's home.' But the door opened anyway.",
        emotion: "grimaces",
        clue: "Nathan was visibly terrified before he even crossed.",
      },
      {
        id: "tungwaffen",
        label: "Are the rumors about 'Tungwaffen' true?",
        response: "That's classified village security business. Let's just say... if Able doesn't pay his taxes to the night watch, things get noisy.",
        emotion: "lowers guard cautiously",
      },
    ],
  },
  {
    id: "silly",
    name: "Silly Boy Sho",
    title: "Sole Riverbank Witness",
    image: "/images/silly-boy.jpg",
    bodyColor: "#52525b",
    ...tileCenter(8, 16),
    greeting: "...hey. Don't mind me. I've been tying this shoe since midnight. If I look up, things get complicated.",
    lines: [
      "Everyone thinks I'm just sitting here. But I saw it all from the weeping willows.",
      "Nathan didn't get dragged through that door by demons. He walked through on his own two trembling legs.",
      "Then the door swung shut. No explosion. No blood. Just quiet.",
      "I don't stand up because standing up means we have to admit he's still right over there.",
    ],
    choices: [
      {
        id: "shoe",
        label: "Why haven't you finished tying that shoe?",
        response: "Because as long as I'm tying it, nobody expects me to cross that bridge and drag him back. It's strategic stalling.",
        emotion: "looks down nervously",
        clue: "Silly knows Nathan is alive on the other side.",
      },
      {
        id: "door_look",
        label: "What did the mysterious door actually look like?",
        response: "It had peeling paint, brass hinges, and smelled like damp cedar. Like a door from an old basement. But it stood upright with no walls around it.",
        emotion: "shivers",
        clue: "The door stands freely in the grass without a frame.",
      },
      {
        id: "friendship",
        label: "Were you and Nathan close?",
        response: "We used to skip stones on the river until Able chased us off. Nathan always wanted to be legendary. Now look at him.",
        emotion: "sighs softly",
      },
    ],
  },
  {
    id: "able",
    name: "Able",
    title: "Syndicate Financier",
    image: "/images/able.jpg",
    bodyColor: "#1d4ed8",
    ...tileCenter(5, 4),
    greeting: "Step into the courtyard. Time is currency in Sahur, and you're currently in debt. Speak your business.",
    lines: [
      "I maintain dossiers on everyone in this quadrant. Debts, leverage, lineage.",
      "Nathan came to me three days before the incident requesting an emergency line of credit.",
      "He wanted to buy an antique portal door imported from the void merchants. I denied the loan.",
      "Someone else funded him. If you cross that bridge, find out whose money built that door.",
    ],
    choices: [
      {
        id: "loan",
        label: "Why did you refuse Nathan's loan?",
        response: "Poor collateral. What was he offering? 'The rights to the greatest stunt in Sahur history'? I trade in gold and real estate, not delusions.",
        emotion: "adjusts tailored collar",
        clue: "Someone with void connections financed the door.",
      },
      {
        id: "records",
        label: "What does Nathan's file say?",
        response: "Age: indeterminate. Threat level: laughable. Financial status: bankrupt. Notable traits: cannot execute a backflip, prone to freezing under pressure.",
        emotion: "flips ledger page",
        clue: "Nathan has a history of freezing when people watch him.",
      },
      {
        id: "tung_bribe",
        label: "Is Tung Tung extorting you?",
        response: "Tung thinks he collects dues. In reality, I let him believe he's in charge so he patrols my warehouses for free at 4am.",
        emotion: "smirks with cold precision",
      },
    ],
  },
  {
    id: "tralalero",
    name: "Tralalero Tralala",
    title: "Guardian of the Red Waters",
    image: "/images/tralalero-tralala.png",
    bodyColor: "#0e7490",
    ...tileCenter(17, 14),
    greeting: "Tralalero... tralala... Porco dio! Watch where you step, the current is treacherous today.",
    lines: [
      "The waters haven't been calm since the bridge creaked under Nathan's boots.",
      "A shark wearing fresh kicks doesn't normally care for human gossip, but this river remembers everything.",
      "Every midnight, faint whimpering drifts from the eastern reeds. It's not a ghost. It's a coward.",
      "Cross the grand bridge if your shoes have grip. But don't look directly into the water.",
    ],
    choices: [
      {
        id: "nikes",
        label: "Why does a river shark wear Nike sneakers?",
        response: "You try swimming upstream over jagged cobblestones for three centuries without arch support! Porco dio, it's about hydrodynamics AND drip.",
        emotion: "flexes red sneakers",
      },
      {
        id: "river_secret",
        label: "What did you see in the water the night he vanished?",
        response: "I saw the reflection of the door open. Inside wasn't hell or heaven. It was just an empty field overgrown with purple weeds. Nathan took one step, the latch clicked, and he choked.",
        emotion: "eyes narrow intently",
        clue: "The door is not a trap — Nathan simply locked himself out.",
      },
      {
        id: "threat",
        label: "Will you stop me if I cross the bridge?",
        response: "I don't guard the bridge to stop people from going in. I guard it to make sure whatever Nathan left over there doesn't come crawling back.",
        emotion: "teeth glint in the water",
      },
    ],
  },
  {
    id: "nathan",
    name: "Nathan",
    title: "The Legend across the Bridge",
    image: "/images/nathan.png",
    bodyColor: "#059669",
    ...tileCenter(26, 10),
    greeting: "Wait... someone actually crossed the bridge?! Please tell me you didn't bring the whole village...",
    lines: [
      "I swear it was supposed to be a magic trick. I bought the door from an old traveler.",
      "I walked through, turned around to take a bow... and the handle fell off in the grass.",
      "Then I heard Tung's bat echoing, and Silly Boy was staring from the reeds, and Able was taking notes.",
      "I was so monumentally embarrassed that I just sat here hoping everyone would assume I ascended to another realm.",
    ],
    choices: [
      {
        id: "truth",
        label: "So 'doing a Nathan' was just locking yourself out?!",
        response: "YES! The brass knob came off in my palm! I've been eating wild berries behind this stone shrine for weeks because I couldn't bear to walk back across the bridge!",
        emotion: "covers face in shame",
        clue: "The entire village lore was born from sheer social anxiety.",
      },
      {
        id: "return",
        label: "The whole village thinks you're trapped in an alternate dimension.",
        response: "Let them think that! If Tung finds out I've been chilling across the river this whole time, he'll hit me with the bat for waking him up at 4am!",
        emotion: "pleads anxiously",
      },
      {
        id: "rescue",
        label: "Come on Nathan, it's time to walk home.",
        response: "...Fine. But you have to tell them the door had a demonic lock and you fought three void beasts to get me out. Deal?",
        emotion: "stands up reluctantly",
      },
    ],
  },
]

export const storyFinale =
  "The mystery of Sahur is solved! The dreaded 'impossible knock' wasn't an ancient curse or void sacrifice — Nathan simply broke the door handle, panicked, and hid behind the shrine while the village turned his clumsy mistake into mythic folklore. Tung lowers his bat, Silly Boy finally stands up to untangle his shoes, Able files the case under 'human error', Tralalero splashes in disgust, and Nathan walks home with his head held low."
