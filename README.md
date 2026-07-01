# LiftIQ — AI Workout Form Coach

> **Built for Bitcamp 2026**

| | |
|--|--|
| **Live app** | [lift-iq-eta.vercel.app](https://lift-iq-eta.vercel.app) |
| **Repo** | [github.com/MokshJainrock/LiftIQ](https://github.com/MokshJainrock/LiftIQ) |

LiftIQ is an AI-powered fitness app that runs in your browser. Point your webcam at the camera workout mode and get real-time pose tracking, per-rep form scores, and live coaching cues — or log sets manually with an AI coach that reads your history and suggests what to do next. Browse **188+ exercises** with video demos, form guides, and a full workout history.

---

## Highlights

- **Camera coach** — MediaPipe tracks 33 body landmarks; joints color-code green / yellow / red by form quality
- **Rep scoring** — Every rep scored 0–100 on depth, alignment, tempo, and symmetry
- **188-exercise library** — Searchable by muscle and equipment, with **180+ MP4 demos**, posters, and detail modals (Steps · Focus · Mistakes · Cues)
- **Manual & live logging** — Log weight/reps with rest timers; AI feedback on progression and suggestions for the next session
- **Workout history** — Sessions grouped into named workouts (camera + manual), with volume and rename support
- **Mind hub** — Check-ins, guided breathing, journaling with AI reflection, and support resources
- **Progress dashboard** — Score trends, streaks, calories, and charts (Recharts)
- **Nutrition** — Food logging with USDA search and optional AI food scan
- **Optional accounts** — Neon (primary) or Supabase for cloud sync; core tracking works offline in the browser

---

## Workout Modes

| Mode | What it does |
|------|----------------|
| **Camera** | Webcam + skeleton overlay + live cues for 10 tracked movements (squat, push-up, lunge, plank, curl, etc.) |
| **Manual log** | Quick set/rep entry from the workout page |
| **Live session** | Full gym-style session builder with rest timer, AI coach, and workout save |
| **Routines** | Build and run multi-exercise routines with progress tracking |

---

## Exercise Library & Demos

The **Exercises** page lists the full library with filters for muscle group and equipment. Each card includes:

- Static poster thumbnail (fast grid loading)
- **20-second looping MP4** in the detail modal
- Animated skeleton fallback when no demo is mapped
- Link to start a camera workout when the exercise supports AI tracking

Demo media is generated locally via scripts in `scripts/` (GymGifsDB + optional HD overrides) and stored in `public/exercise-videos/`.

```bash
npm run generate:gifs          # Map library → demo sources
npm run generate:videos        # GIF/source → MP4 + poster
npm run generate:videos:force  # Re-encode all videos
npm run hd:overrides           # Apply HD CDN overrides (e.g. bench press)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui patterns (Radix UI) |
| Pose | MediaPipe Tasks Vision (PoseLandmarker) |
| Charts | Recharts |
| State | Zustand |
| Motion | Framer Motion |
| AI | OpenAI (`gpt-4o-mini`) — coach, form explain, mind reflect, food scan |
| Auth / DB | Neon + custom auth (Supabase fallback) |
| Local data | `localStorage`, IndexedDB (recordings) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with webcam support (Chrome recommended)
- Webcam permission (for camera workouts)

### Installation

```bash
git clone https://github.com/MokshJainrock/LiftIQ.git
cd LiftIQ
npm install
cp .env.example .env.local   # optional — AI & cloud features
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` → `.env.local`. All keys are optional; the app degrades gracefully without them.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (auth fallback) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `OPENAI_API_KEY` | AI coach, form explain, mind reflect, food scan |
| `USDA_API_KEY` | Food search via USDA FoodData Central |

### Production build

```bash
npm run build
npm start
```

Deploys cleanly to Vercel — production: **[lift-iq-eta.vercel.app](https://lift-iq-eta.vercel.app)**.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── workout/                 # Camera workout hub
│   ├── workout/live/            # Live manual session + AI coach
│   ├── exercises/               # 188-exercise library + demos
│   ├── history/                 # Grouped workout history
│   ├── dashboard/               # Progress & streaks
│   ├── recordings/              # Saved camera recordings
│   ├── mind/                    # Check-in, breathe, journal, support
│   ├── settings/
│   ├── login/
│   └── api/                     # Auth, coach, food, mind, data routes
├── components/
│   ├── workout/                 # Webcam, HUD, manual log, routines
│   ├── exercise-guide/          # Demo player, skeleton, modals
│   ├── exercise-detail-modal.tsx
│   └── mind/
├── lib/
│   ├── ai/                      # Coach clients & prompts
│   ├── exercises/               # Library, scoring configs, demo map
│   ├── pose/                    # MediaPipe hook, angles
│   ├── scoring/                 # Rep detector
│   ├── mind/                    # Wellness storage & logic
│   ├── storage/                 # Sessions, workouts, sync
│   └── store.ts
public/
└── exercise-videos/             # Hosted MP4 demos + JPEG posters
scripts/
├── generate-exercise-gifs.mjs
├── convert-exercise-videos.mjs
└── hd-video-overrides.mjs
```

---

## Camera Exercise Architecture

Tracked exercises implement `ExerciseConfig` with phase detection and scoring:

```typescript
interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetJoints: number[];
  phases: string[];
  detectPhase: (...) => string;
  scoreRep: (...) => { score, issues };
  getCoachingCues: (...) => string[];
  caloriesPerRep: number;
}
```

**Scoring considers:** range of motion, joint alignment, posture, and left/right symmetry. Issues map to joint colors on the skeleton overlay.

---

## Contributors

- [@MokshJainrock](https://github.com/MokshJainrock)
- [@ranchboi](https://github.com/ranchboi)
- [@agransh](https://github.com/agransh)

---

## License

MIT
