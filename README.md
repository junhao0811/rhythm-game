# 🎵 Rhythm Game (TypeScript + RxJS)

A Guitar Hero–style browser rhythm game built with **functional reactive programming**. Notes fall down four colour-coded lanes in time with the song, while the backing track plays through real sampled instruments.

---

## ✨ Features

- **Song-driven notes**: songs are loaded from a CSV of notes (instrument, pitch, velocity, start and end time), and each note is placed in one of four lanes based on its pitch
- **Live music playback**: background parts play through **Tone.js** sampled instruments (violin, piano, trumpet, saxophone, flute and more) at exactly the right moment. The included song is *Rockin' Robin* (public domain)
- **Smooth animation**: notes fall continuously and disappear when they leave the play area
- **Keyboard lanes**: `H` `J` `K` `L` map to the four lanes, with live highlighting of the pressed key
- **Game-over screen** when the song ends

### 🛣️ Roadmap
- Hit detection and scoring (with score multiplier and high score, as the UI already has slots for them)
- More songs and a song picker

---

## 🧠 How it works

The whole game is built as **pure, reactive streams** with RxJS:

```
keypress$ ─┐
           ├─▶ merge ─▶ scan(reduceState) ─▶ render(state)
tick$ ─────┘
```

- **Input and time are streams**: key presses and a fixed-rate clock (`interval`) are turned into *actions*
- **State is immutable**: every action is a pure function `State → State`, folded together with `scan`
- **Side effects stay at the edge**: only the final `subscribe` touches the SVG canvas and plays audio

| File | Responsibility |
|---|---|
| `src/main.ts` | Streams, rendering and wiring everything together |
| `src/state.ts` | Immutable game state and the `Tick` / note actions |
| `src/util.ts` | CSV parsing and audio playback helpers |
| `src/types.ts` | Shared types and constants |

---

## 🚀 Run it

```bash
npm install
npm run dev      # then open the local URL shown in the terminal
npm test         # run the tests
```

Instrument samples are included in `samples/` (from [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)).

## 🛠️ Tech
TypeScript · RxJS · Tone.js · Vite · Vitest
