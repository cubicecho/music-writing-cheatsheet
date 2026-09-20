# AGENTS.md — Music writing cheatsheet

## Project overview

A web-only, server-free cheatsheet for writing music: pick a key, see its
scale, its modes, its intervals and the chords built on them. Everything is
computed in the browser from `src/lib/music/`; there is no API, no database and
no persistence beyond a theme preference in `localStorage`.

It has a second job. It is the first consumer of **cubeui-rn's web registry**,
so every control on the page is an installed `@cubeui` item rather than
something hand-rolled, and the friction of installing them is worth recording
(see *What the install turned up*).

## Tech stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Build    | Vite 8, TypeScript 6 (strict), React 19             |
| UI       | cubeui-rn web registry via shadcn, Tailwind CSS 4   |
| Theory   | `src/lib/music/` — plain TypeScript, no dependencies |
| Testing  | Vitest (node environment; the theory core is pure)  |
| Linting  | Biome (formatter + linter)                          |
| Runtime  | Node 20+, ESM throughout                            |

## Structure

```
music-writing-cheatsheet/
├── components.json           # shadcn config; @cubeui → the local registry server
├── cubeui-tokens.css         # installed: @cubeui/tokens (the oklch palette)
├── scripts/serve-cubeui.mjs  # serves ../cubeui-rn/public on :8731
├── src/
│   ├── App.tsx               # all the state + the two tabs; the tabs are uncontrolled
│   ├── index.css             # tailwind → tokens → the RN reset, in that order
│   ├── components/
│   │   ├── domain/           # the app's own components
│   │   │   ├── ScalesTab.tsx          # tab 1: the scale, its modes, its chords
│   │   │   ├── ProgressionsTab.tsx    # tab 2: the same key, read as progressions
│   │   │   ├── KeyPicker.tsx          # key, scale, relative/parallel, 7ths
│   │   │   ├── ModePicker.tsx         # the mode chips, and `modeRoot`
│   │   │   ├── NoteStrip.tsx          # the scale as notes + steps, and IntervalBreakdown
│   │   │   ├── ChordTable.tsx         # one row per degree
│   │   │   ├── ScalePanel.tsx         # a card: strip + breakdown + chords
│   │   │   ├── ProgressionPicker.tsx  # the progression chips, split native/transplanted
│   │   │   ├── ProgressionPanel.tsx   # one progression as a row of chord blocks
│   │   │   ├── ProgressionBuilder.tsx # the sketchpad: a chord palette + what you built
│   │   │   ├── ChordBlock.tsx         # one chord: click to hear it, X to take it out
│   │   │   ├── RelatedKeys.tsx        # relative/parallel keys, as links
│   │   │   ├── PlayButton.tsx         # play/stop
│   │   │   └── useSequence.ts         # playing a chord list, and which one is sounding
│   │   ├── ui/               # INSTALLED from @cubeui — do not edit by hand
│   │   ├── page.tsx          # INSTALLED (@cubeui/page)
│   │   ├── section-heading.tsx  # INSTALLED (@cubeui/section-heading)
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── audio.ts          # the only impure module: Web Audio
│   │   ├── music/            # the theory core and its tests
│   │   ├── theme.ts
│   │   ├── utils.ts          # INSTALLED (@cubeui/utils)
│   │   └── color.ts          # INSTALLED (@cubeui/color)
│   └── styles/
│       └── cube-rn-reset.css # VENDORED from cubeui-rn — see below
└── AGENTS.md
```

## The theory core

`src/lib/music/` is pure and dependency-free, and every claim it makes is
tested. Six modules, each with one job:

- **`pitch.ts`** — a note is a *letter plus an alteration*, never a number. The
  pitch class is derived from it. This is what makes F♯ major spell an E♯
  rather than an F, and it is load-bearing for everything downstream.
- **`intervals.ts`** — naming an interval takes the scale step *and* the
  semitone count, because six semitones is an augmented 4th or a diminished
  5th depending on how many letters it spans. Produces the formal name, the
  `M3` shorthand and the player's `♭3` degree from one calculation.
- **`scales.ts`** — the five families and their modes, as data, plus the
  rotation that turns a family into one of its modes. Every family is seven
  notes on purpose: it is what gives one note per letter, seven chords and
  seven rotations without a special case.
- **`chords.ts`** — thirds stacked out of the scale's own notes. The naming is
  a lookup keyed on the intervals that come out, with a fallback that describes
  rather than guesses; `chord.unnamed` says which happened, and a test asserts
  that nothing in the shipped families hits the fallback.
- **`progressions.ts`** — progressions as lists of scale *degrees*, which is
  what lets one entry realise correctly in every key and every family. A step
  may name a `borrowedFrom` family to take that one chord from the parallel
  scale instead; `realizeProgression` then compares the result against what the
  home scale would have given and only reports a borrowing when the notes
  really differ, so the same entry is right whether you are in natural or
  harmonic minor. `chordPalette` is the same idea read the other way: the
  scale's own seven chords, then whatever the other families stand on the same
  degrees that this one has not already given you, deduplicated by symbol.
- **`voicing.ts`** — the arithmetic half of sound: note + octave → MIDI number,
  MIDI → frequency, and a chord or scale laid out as pitches. Pure, so it is
  tested like the rest; `src/lib/audio.ts` is the thin, untested layer that
  actually makes a noise.

Conventions worth keeping:

- Scale steps are **0-based** everywhere (`degreeIndex`, the `steps` argument),
  so they index straight into an array. Interval *numbers* are 1-based.
- `mod()` from `pitch.ts`, not `%` — `%` keeps the sign of the dividend.
- The theory core never respells for effect. C altered stacks to `Cm7♭5`, not
  `C7♯9♭5`: the second is a claim about function, and this reports notes.

## Sound

`src/lib/audio.ts` is the one impure module. An `AudioContext` cannot exist
before a user gesture, so it is created lazily on the first click and cached
with its master gain on the context object. Two things to know:

- Every note gets a gain envelope. A bare oscillator start/stop clicks, and at
  eight notes a second that is all you hear.
- `playSequence` schedules the audio sample-accurately and the UI callbacks on
  `setTimeout`, because those are different clocks and only one of them can be
  trusted for sound. It returns a `{ stop }` handle and runs through a gain
  node of its own, so stopping one panel leaves another panel's playback alone.
  `useSequence` wraps that in the `playing` / `step` state a panel renders.

## Adding a scale family

Add to `SCALE_FAMILIES` in `src/lib/music/scales.ts`: seven ascending
semitone offsets and seven modes with unique ids. Nothing else needs to change —
the pickers, the chord table and the tests are all driven off that array, and
the "every chord is named" test will tell you if the family produces a stack
the naming table does not cover.

Progressions pick the family up for free: `groupProgressions` splits the
catalogue into the ones that name your family in `families` and the rest, and
the rest still realise — a major-key shape against a minor scale is a different
real progression, not an error. Add `families: ['your-family-id']` to anything
the new family should lead with.

Pentatonic and blues scales do **not** fit. They break the one-note-per-letter
rule and the stack-of-thirds rule, so they need their own spelling path and
their own answer for the chord panel. That is a separate piece of work, not a
row in the array.

## What the install turned up

Findings from being cubeui-rn's first DOM consumer. None of them is worked
around silently — each one is a comment at the place it bites.

1. **The web registry does not ship `cube-rn-reset.css`.** Every compiled
   component carries `cube-rn-view` / `cube-rn-text` / `cube-rn-pressable`
   classes and no registry item defines them; only cubeui-rn's own Storybook
   imports the file. Without it a compiled `Card` is a `display: block` div and
   every `flex-1` beside it means something else. Vendored to
   `src/styles/cube-rn-reset.css`, unedited, until the registry publishes it.
2. **`ToggleChip` only colours a string child.** Pass markup and it renders it
   untouched — dark text on the selected (primary) background. `ModePicker`
   passes a template string for that reason.
3. **`ToggleChip` spreads `accessibilityLabel` onto a `<button>`**, which is a
   React unknown-prop warning on the web rather than an accessible name. Don't
   pass `aria-label` to it; name the chip with its text.
4. **The `@cubeui/icons` barrel is a fixed set.** It has no light/dark glyph,
   so `ThemeToggle` is text, and no transport glyphs, so `PlayButton` imports
   `Play` and `Square` from `lucide-react` directly. Prefer the barrel when it
   has the icon — `ChordBlock` takes its `X` and `RelatedKeys` its `ArrowRight`
   from there — and reach past it only for what the barrel does not carry.
5. **shadcn reads `paths` from the root `tsconfig.json`**, not from
   `tsconfig.app.json`. Without it there, `shadcn add` writes a literal `@/`
   directory at the project root. Both tsconfigs carry `paths` here.
6. Tooltip and select animations want `tw-animate-css`, which no registry item
   declares. Installed as a devDependency.

Installed files are **excluded from Biome** (`biome.json` → `files.includes`)
so that re-running `shadcn add ... --overwrite` produces no diff. Do not
reformat them, and do not edit them: change them upstream in cubeui-rn and
reinstall.

## Working on it

```sh
npm run dev        # :3000, bound to 0.0.0.0 so other devices on the LAN can reach it
npm run check      # biome + tsc + vitest, the one to run before finishing
npm run test
npm run build
npm run registry:serve   # ../cubeui-rn/public on :8731, for `shadcn add`
```

`CUBEUI_RN_PATH` overrides where the registry server looks for the sibling
checkout.

CI runs `npm run check` and a build on every push and PR; a push to `main` also
publishes `dist/` to GitHub Pages behind the same check. The Vite `base` is
`'./'` rather than the repo name, so the artefact is not tied to the subpath it
happens to be served from.

## Conventions

- Biome: single quotes in TS, double in JSX, 120 columns, semicolons.
- `@/` is `src/`.
- Comments explain *why*, at the place the reason bites. The file header says
  what the file is for and what would be wrong to do instead.
- Tests assert musical facts by name ("gives the seventh of F♯ major an E♯"),
  not implementation shape.
