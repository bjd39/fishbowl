# Fishbowl Party Game

Zero-backend party game app. All game state lives on the host device. Data transfer between devices is via QR codes only.

## Tech Stack

- React 19 + TypeScript + Vite + Tailwind CSS v4
- `qrcode.react` for QR generation, `html5-qrcode` for camera scanning
- `@dnd-kit` installed but not yet wired up (using buttons/dropdowns for reordering)
- No backend, no database, no networking

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build to `dist/`
- `npx tsc --noEmit` — type check without emitting
- No test framework set up yet

## Architecture

### Routing

Hash-based, no router library. Two modes:
- **Host**: navigates to `/` → enters `HostApp` with game state reducer
- **Writer**: scans host QR which opens `/#/write?slips=N` → enters `WriterFlow`

Routing logic is in `src/App.tsx` `getRoute()`.

### State Management

Single `useReducer` in `HostApp` (`src/state/gameState.ts`). The `GameContext` provides `state` and `dispatch` to all host components via `useGame()` hook.

Game progresses through phases defined by `GamePhase` type in `src/types.ts`: settings → add-players → duplicate-check → team-assignment → turn-order → pre-turn → active-turn → turn-summary → round-summary → game-over.

`App.tsx` renders the component matching `state.phase`.

### Key State Flows

- **Adding players**: `ADD_PLAYER` action adds a `Player` + their `Slip[]` to state
- **Turn lifecycle**: `START_TURN` → (`GOT_IT` | `PASS_SLIP` | `FOUL`)* → (`TIMER_EXPIRED` | `END_TURN`) → `NEXT_TURN`
- **Round lifecycle**: `START_ROUND` fills bowl → turns repeat → bowl empty triggers `END_ROUND` → `NEXT_ROUND` or game-over
- **Bowl**: array of slip IDs. `GOT_IT` removes from bowl, `PASS_SLIP`/`FOUL` keep it in

### QR Payloads

Host join QR encodes a URL: `{origin}{base}#/write?slips={N}`

Player QR encodes JSON: `{ "v": 1, "player": "Name", "slips": ["...", "..."] }`

Encoding/decoding in `src/utils/qr.ts`.

## Project Structure

```
src/
├── App.tsx                    # Router + HostApp with reducer
├── main.tsx                   # Entry point
├── app.css                    # Tailwind imports + custom animations
├── types.ts                   # All interfaces, defaults, constants
├── state/
│   └── gameState.ts           # Reducer, actions, context, useGame hook
├── components/
│   ├── writer/                # Writer device screens
│   │   ├── WriterFlow.tsx     # Step container (name → slips → QR)
│   │   ├── PlayerNameEntry.tsx
│   │   ├── SlipEntry.tsx
│   │   └── QRCodeDisplay.tsx
│   ├── host/                  # Host setup screens
│   │   ├── GameSettings.tsx   # Timer, slips, passes, rounds config
│   │   ├── AddPlayers.tsx     # Join QR + scanner + player list
│   │   ├── HostSlipEntry.tsx  # Inline slip writing for host
│   │   ├── DuplicateCheck.tsx
│   │   ├── TeamAssignment.tsx # Random/manual team building
│   │   └── TurnOrderSetup.tsx
│   ├── game/                  # Gameplay screens
│   │   ├── PreTurn.tsx        # Handoff screen before each turn
│   │   ├── ActiveTurn.tsx     # Timer + slip + action buttons
│   │   ├── TurnSummary.tsx    # Post-turn results
│   │   ├── RoundSummary.tsx   # End-of-round scores + MVP
│   │   └── GameOver.tsx       # Winner, stats, confetti
│   └── shared/
│       ├── Timer.tsx          # requestAnimationFrame countdown
│       ├── Scoreboard.tsx     # Cumulative team scores
│       └── SlipCard.tsx       # Styled slip display
└── utils/
    ├── qr.ts                  # QR encode/decode helpers
    ├── dedup.ts               # Case-insensitive duplicate detection
    ├── shuffle.ts             # Fisher-Yates shuffle
    └── stats.ts               # MVP, fastest slip, score calculations
```

## Deployment

GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`). Triggers on push to `main`. `base: '/fishbowl/'` in `vite.config.ts` for correct asset paths.

## Known Gaps

- Drag-and-drop for team/turn-order reordering (using ↑↓ buttons currently, `@dnd-kit` is installed)
- All-game guess tracking for stats — `currentRoundGuesses` resets each round, so `GameOver` stats only reflect the last round
- No test suite
- Bundle is ~589KB (mostly `html5-qrcode`) — could code-split with dynamic import
- No buzzer sound file yet (`src/assets/sounds/buzzer.mp3` referenced in spec but not created)
