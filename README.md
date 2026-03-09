# Fishbowl

A party game app for playing Fishbowl (aka Fruit Bowl / Flash in the Pan). No servers, no accounts — just phones and a bowl full of names.

**Play it at [bjd39.github.io/fishbowl](https://bjd39.github.io/fishbowl/)**

## How It Works

1. The **host** opens the app and configures the game (timer, rounds, slips per player)
2. The host shows a **QR code** to the room — everyone scans it with their phone camera
3. Each player **writes their slips** (names of people, places, things) on their own phone
4. Players show their **player QR code** back to the host to scan in
5. The host assigns **teams**, and the game begins
6. The host phone gets **passed around** — each player takes turns giving clues while a timer counts down

All game state lives on the host's phone. The only data transfer is via QR codes — no WiFi needed during gameplay.

## Rounds

The default game has three rounds (customizable):

1. **Describe it** — use any words except the name itself
2. **One word** — single word clue only
3. **Charades** — act it out, no sounds

The same slips cycle through every round, so players build on shared knowledge as the game progresses.

## Development

```bash
npm install
npm run dev
```

Built with React, TypeScript, Vite, and Tailwind CSS.
