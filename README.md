# 🌺 Tiki Topple

> Real-time multiplayer stack battle board game.
> Play on browser or install as mobile app.

## ✨ Features

- ✅ Real-time multiplayer (2-4 players)
- ✅ AI opponent with Minimax algorithm (depth 3, alpha-beta pruning)
- ✅ Secret Tiki scoring system (+9/+5/+2 objective bonuses)
- ✅ In-game chat + emoji reactions (🔥 😂 😤 🎉 👑 💀 🌺 ⚡ 🎯)
- ✅ QR code + room code joining
- ✅ PWA — install on Android/iOS
- ✅ Mobile responsive
- ✅ Keyboard shortcuts (M=move, R=reorder, 1/2/3=count)
- ✅ Web Audio sound effects (no audio files)
- ✅ Canvas confetti celebrations

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SERVER_URL in .env.local
```

**Terminal 1** — Frontend:
```bash
npm run dev
```

**Terminal 2** — Game server:
```bash
npm run server
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy Free in 10 Minutes

1. **Push code to GitHub**
2. **Vercel**: Import repo → auto deploys frontend
3. **Railway**: Import same repo → runs `server/index.ts`
4. **Set env vars** (see `.env.example`):
   - Vercel: `NEXT_PUBLIC_SERVER_URL` = your Railway URL
   - Railway: `FRONTEND_URL` = your Vercel URL, `PORT` = 3001

## 🎮 How to Play

### Joining a Game

| Method     | How                                         |
|------------|---------------------------------------------|
| Room Code  | Enter 4-letter code (e.g. `TIKI`)           |
| QR Code    | Scan QR from lobby screen                   |
| Paste Link | Paste full lobby URL into join input        |

### Game Rules

- **9 tokens** start stacked at position 0
- **Each turn**, choose one action:
  - **MOVE**: Push top 1, 2, or 3 tokens forward one position
  - **REORDER**: Rearrange the top 2 or 3 tokens in the frontmost stack
- **Game ends**: After 25 turns OR when all tokens reach position 35

### Secret Tiki Scoring

Each player receives a secret objective with 3 target tokens:

| Objective   | Condition           | Bonus Points |
|-------------|---------------------|--------------|
| 🥇 Primary   | Token finishes #1   | +9 pts       |
| 🥈 Secondary | Token finishes top 2 | +5 pts       |
| 🥉 Tertiary  | Token finishes top 3 | +2 pts       |

**Max bonus**: 16 pts per player (9 + 5 + 2)

Base scoring: Rank 1 = 9pts, Rank 2 = 8pts, ..., Rank 9 = 1pt

## 📁 Project Structure

```
tiki-topple/
├── app/                  # Next.js pages
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout (PWA + SEO)
│   ├── lobby/[code]/     # Lobby with QR sharing
│   ├── game/[code]/      # Game board
│   └── results/[code]/   # Results + confetti
├── components/
│   ├── game/             # TrackBoard, ActionPanel, ScorePanel, ChatPanel
│   └── ui/               # Token, Button, PlayerCard, RoomShare
├── lib/
│   ├── types.ts          # TypeScript interfaces
│   ├── constants.ts      # Token colors, track config
│   ├── gameLogic.ts      # Pure game state functions
│   ├── ai.ts             # Minimax AI with alpha-beta pruning
│   ├── sounds.ts         # Web Audio API sound effects
│   └── boardgame-client.ts
├── server/
│   ├── game.ts           # boardgame.io game definition
│   └── index.ts          # Standalone server
└── scripts/
    └── generate-icons.mjs
```

## 🛠️ Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Framework  | Next.js 14 (App Router, TypeScript)  |
| Styling    | Tailwind CSS + Custom CSS            |
| Animation  | Framer Motion                        |
| Multiplayer| boardgame.io + Socket.IO             |
| AI         | Minimax with Alpha-Beta Pruning      |
| Sound      | Web Audio API (programmatic)         |
| Fonts      | Fredoka One + Nunito (Google Fonts)  |
| Deploy     | Vercel (frontend) + Railway (server) |

## 📜 Scripts

| Command               | Description                     |
|-----------------------|---------------------------------|
| `npm run dev`         | Start Next.js dev server        |
| `npm run build`       | Production build                |
| `npm run server`      | Start boardgame.io server (dev) |
| `npm run server:build`| Compile server for production   |
| `npm run server:start`| Run compiled server             |
| `npm run typecheck`   | TypeScript type check           |
| `npm run generate-icons` | Generate PWA icons           |

## 📄 License

MIT
