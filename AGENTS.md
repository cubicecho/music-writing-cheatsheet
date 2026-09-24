# AGENTS.md — Music writing cheatsheet

## Project overview

A web-only, server-free cheatsheet for writing music: pick a key, see its
scale, its modes, its intervals and the chords built on them. Everything is
computed in the browser from `src/lib/music/`; there is no API, no database and
no persistence beyond a theme preference in `localStorage`.

It has a second job. It was the first consumer of **cubeui's web registry** —
the RN-based rewrite, which has since landed on `main` and is published at
https://cubicecho.github.io/cubeui/r/ — so every control on the page is an
installed `@cubeui` item rather than something hand-rolled, and the friction of
installing them is worth recording (see *What the install turned up*).

## Tech stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Build    | Vite 8, TypeScript 6 (strict), React 19             |
| UI       | cubeui web registry via shadcn, Tailwind CSS 4      |
| Theory   | `src/lib/music/` — plain TypeScript, no dependencies |
| Testing  | Vitest (node environment; the theory core is pure)  |
| Linting  | Biome (formatter + linter)                          |
| Runtime  | Node 20+, ESM throughout                            |

## Structure

```
music-writing-cheatsheet/
├── components.json           # shadcn config; @cubeui → the published registry
├── cubeui-tokens.css         # installed: @cubeui/tokens (the oklch palette)
├── cubeui-reset.css          # installed: @cubeui/tokens (imports itself from the tokens)
├── scripts/serve-cubeui.mjs  # serves ../cubeui/public on :8731, for unpublished changes
├── src/
│   ├── App.tsx               # all the state + the three tabs; the tabs are uncontrolled
│   ├── index.css             # tailwind → tokens → the RN reset, in that order
│   ├── components/
│   │   ├── domain/           # the app's own components
│   │   │   ├── ScalesTab.tsx          # tab 1: the scale, its modes, its chords
│   │   │   ├── ProgressionsTab.tsx    # tab 2: the same key, read as progressions
│   │   │   ├── FlowTab.tsx            # tab 3: the same key, read as a map you walk
│   │   │   ├── KeyPicker.tsx          # key, scale, relative/parallel, 7ths
│   │   │   ├── Field.tsx              # an overline label over a control, for both settings bars
│   │   │   ├── ModePicker.tsx         # the mode chips, and `modeRoot`
│   │   │   ├── NoteStrip.tsx          # the scale as notes + steps, and IntervalBreakdown
│   │   │   ├── ChordTable.tsx         # one row per chord it is handed
│   │   │   ├── ScalePanel.tsx         # a card: strip + breakdown + chords
│   │   │   ├── ProgressionPicker.tsx  # the progression chips, split native/transplanted
│   │   │   ├── ProgressionPanel.tsx   # one progression as a row of chord blocks
│   │   │   ├── ProgressionBuilder.tsx # the sketchpad: a chord palette + what you built
│   │   │   ├── ChordBlock.tsx         # one chord: click to hear it, X to take it out
│   │   │   ├── FlowChart.tsx          # the flowchart itself: chips, and the arrows between them
│   │   │   ├── FlowRoute.tsx          # one song section: the path you walked, faint arrows off-chart
│   │   │   ├── SongPanel.tsx          # the sections in order, chord length + tempo, play the whole song
│   │   │   ├── RelatedKeys.tsx        # relative/parallel keys, as links
│   │   │   ├── HomeKeyNote.tsx        # "this tab is reading the pentatonic's home key"
│   │   │   ├── PlayButton.tsx         # play/stop
│   │   │   └── useSequence.ts         # playing a chord list, and which one is sounding
│   │   ├── ui/               # INSTALLED from @cubeui — do not edit by hand
│   │   ├── action-button.tsx # INSTALLED (@cubeui/action-button)
│   │   ├── option-select.tsx # INSTALLED (@cubeui/option-select)
│   │   ├── page.tsx          # INSTALLED (@cubeui/page)
│   │   ├── page-header.tsx   # INSTALLED (@cubeui/page-header)
│   │   ├── section-heading.tsx  # INSTALLED (@cubeui/section-heading)
│   │   └── section.tsx       # INSTALLED (@cubeui/section)
│   ├── lib/
│   │   ├── audio.ts          # the only impure module: Web Audio
│   │   ├── music/            # the theory core and its tests
│   │   ├── song.ts           # the chord map's song: sections, their order, beats and tempo
│   │   ├── utils.ts          # INSTALLED (@cubeui/utils)
│   │   └── color.ts          # INSTALLED (@cubeui/color)
└── AGENTS.md
```

## The theory core

`src/lib/music/` is pure and dependency-free, and every claim it makes is
tested. Seven modules, each with one job:

- **`pitch.ts`** — a note is a *letter plus an alteration*, never a number. The
  pitch class is derived from it. This is what makes F♯ major spell an E♯
  rather than an F, and it is load-bearing for everything downstream.
- **`intervals.ts`** — naming an interval takes the scale step *and* the
  semitone count, because six semitones is an augmented 4th or a diminished
  5th depending on how many letters it spans. Produces the formal name, the
  `M3` shorthand and the player's `♭3` degree from one calculation.
- **`scales.ts`** — the five seven-note families (`SCALE_FAMILIES`) and the
  four pentatonic and blues ones (`GAPPED_FAMILIES`), with their modes, as
  data, plus the rotation that turns a family into one of its modes. The two
  arrays are apart on purpose: seven notes is what gives one note per letter,
  seven chords and seven rotations without a special case, and the chord
  palette and the chord map loop over `SCALE_FAMILIES` relying on all three. A
  gapped family carries `letters` (which letter each degree is spelled on — the
  blues ♭5 is G♭ beside G, not F♯) and a `home` key whose chords it is played
  over. `familyScale`, `buildMode` and `degreeNote` read `letters`;
  `buildScale(tonic, intervals)` alone assumes one letter per degree.
- **`chords.ts`** — thirds stacked out of the scale's own notes. The naming is
  a lookup keyed on the intervals that come out, with a fallback that describes
  rather than guesses; `chord.unnamed` says which happened, and a test asserts
  that nothing in the shipped families hits the fallback. `chordsForFamily` is
  what a chord panel asks for: a seven-note family's own thirds, a gapped
  family's `harmony` (the blues' I7–IV7–V7) or else its home key's chords.
- **`progressions.ts`** — progressions as lists of scale *degrees*, which is
  what lets one entry realise correctly in every key and every family. A step
  may name a `borrowedFrom` family to take that one chord from the parallel
  scale instead; `realizeProgression` then compares the result against what the
  home scale would have given and only reports a borrowing when the notes
  really differ, so the same entry is right whether you are in natural or
  harmonic minor. `chordPalette` is the same idea read the other way: the
  scale's own seven chords, then whatever the other families stand on the same
  degrees that this one has not already given you, deduplicated by symbol.
- **`flow.ts`** — the common-progressions flowchart, stored as *moves* rather
  than as paths: each degree, what it is doing (tonic / pre-dominant /
  dominant), and where the chart goes from it, with a line of prose per arrow.
  That is what lets the UI answer "what usually happens after this chord" and
  mark a progression that has wandered off. There is no single chart: half the
  moves depend on whether the 7th degree is a leading tone or a subtonic, which
  `seventhKind` reads off the family's own intervals (11 semitones or not)
  rather than off a list of family ids, so a family added later gets the right
  chart for free. The chart is deliberately *not* exhaustive — a test asserts
  it refuses the blues its V–IV, because that is the point of the blues.
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

## The song layer

`src/lib/song.ts` sits next to the theory core rather than inside it, because
nothing in it is theory: a section's name and the order the sections play in
are facts about *a song*, not about a key. Like the core it is pure and
tested, and like everything else here a section stores **degrees**, so a song
rereads itself when you change key.

- A `Song` is `{ sections, activeId, beats, bpm }`. Every function takes a song
  and returns a new one (`appendStep`, `addSection`, `duplicateSection`,
  `moveSection`, `removeSection`, `renameSection`, …), which is why the panel
  needs one `onChange` rather than a callback per verb — sections multiply
  callbacks, and pure helpers are unit-testable where a `setState` closure is
  not.
- **One chord length for the whole song**, chosen in beats, with a tempo beside
  it: `chordMs = 60000 / bpm * beats`. A chord that lasts two bars is that
  chord written twice. That is the trade the feature is built on — no per-chord
  duration means no note-length editor, and the row of chord blocks stays a
  progression rather than becoming a score.
- Section names come from a fixed `SECTION_LABELS` list and `sectionOrdinals()`
  numbers them *in running order* only where a label repeats: one chorus is
  "Chorus", two are "Chorus 1" and "Chorus 2", and moving one renumbers both.
  The number comes back on its own because the UI needs it both ways — the
  picker draws the label and the number apart, while every button that acts on
  a section has to name it in prose, which is what `sectionNames()` is for.
- `songSteps()` flattens the sections for playback and `locateChord()` maps an
  index in that flat list back to `{ sectionId, position }`, which is how the
  whole song's playhead lights up the right chord in the right section. Only
  one transport can be in charge: while the song plays, each section's own
  play button is disabled and its highlight comes from the song.

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

A pentatonic or blues scale goes in `GAPPED_FAMILIES` instead. It needs
`letters` alongside `intervals` (ascending, repeating a letter only where two
degrees share one), a `home` seven-note family, and optionally `harmony` plus
`harmonyNote` when the chords it is played over are not the home key's. Its
`modes` list only the rotations worth naming, so a mode's `degree`, not its
position in the array, is its rotation — `ModePicker` and `ScalesTab` read
`mode.degree - 1`. A mode whose id is also a gapped family's id shows that
family's chords; the rest show none. The Progressions and Chord map tabs read
`harmonicHome(family)`, so they need nothing new; `gapped.test.ts` checks the
spelling, the relatives and the chords by name.

## What the install turned up

Findings from being cubeui's first DOM consumer. Every one of them was filed
upstream and **every one is fixed** (cubicecho/cubeui issues #47–#55), so this
list is now history rather than a set of workarounds — kept because it says
what this app is for, and because the fix is the thing to reinstall rather than
to re-derive.

1. **The web registry shipped no `cube-rn-reset.css`** (#47), so a compiled
   `Card` was a `display: block` div. It was vendored here for a while. Now
   `@cubeui/tokens` installs `cubeui-reset.css` beside the palette and imports
   it — along with `tw-animate-css` (#52, finding 6) — so `src/index.css` has
   one import where it had three, and the vendored copy is gone.
2. **`ToggleChip` had a closed prop list and no ref** (#49), so it could not be
   a Radix `asChild` trigger: the chart's chips were wrapped in a `<span>` that
   carried the trigger's props. It now takes the rest of a button's props and
   forwards a ref, and `FlowChart` hands the trigger the chip itself.
3. **A selected `ToggleChip` only coloured a string child** (#51), which is why
   the chips here pass template strings. Fixed — the selected colour is on the
   container now, so markup inside a chip is legible too. The strings stayed,
   because a chip's label here *is* a string.
4. **`accessibilityLabel` reached the DOM as an unknown prop** (#50). The chips
   are still named by their text, which is what a chip should be named by.
5. **The `@cubeui/icons` barrel was a fixed set with no transport or
   light/dark glyphs** (#53), so `PlayButton` imported `Play` and `Square` from
   `lucide-react`. The barrel now carries `Play`, `Pause`, `Square`, `Sun` and
   `Moon`, and nothing in `src/` imports `lucide-react` directly any more. Take
   icons from `@/components/ui/icons`; reach past it only for what it does not
   carry.
6. **shadcn reads `paths` from the root `tsconfig.json`** (#54), not from
   `tsconfig.app.json`. Without it there, `shadcn add` writes a literal `@/`
   directory at the project root. Both tsconfigs carry `paths` here.
7. **The compiled web half had diverged from the RN source and was broken**
   (#48): every `SelectItem` carried the separator's `h-px`, so every dropdown
   row rendered one pixel tall. The native file was correct, so nothing in
   cubeui's own tests could see it — a compiled component being wrong in a way
   its source is not is the failure mode this app exists to catch. Fixed, and
   the registry now renders its compiled output in Storybook.
8. **Nothing said an item was web-only** (#55), so a consumer could not tell a
   shell that compiles for both platforms from one that never will.

One thing from that list is worth knowing as a *rule* rather than as history:
a registry item is installed, not edited.

The last hand-written control went with cubicecho/cubeui #77. The header's
light/dark/system switch is `@cubeui/theme-picker`: `ThemePicker` in the
header, `useThemePreference()` at the root of `App` so applying the theme does
not depend on where the picker is mounted, and the registry's pre-paint script
inline in `index.html`. That script is a copy of `THEME_PRE_PAINT_SCRIPT` in
`src/components/ui/theme-preference-base.ts` because the head here is static
HTML, so a reinstall that changes the export means pasting it again. The
preference is stored under `cubeui-theme`, not the old `mwc-theme`. Anyone who
had picked a theme before the switch starts back on System, once.

### The September 2026 reinstall

`components.json` now points at the published registry rather than at a local
server, and every item was reinstalled from it. What changed in this app:

- `PageHeader` moved into `@cubeui/page-header` and renamed its props on the
  way: `subtitle` → `description`, `actions` → `action`, and the heading is an
  `h1`.
- `@cubeui/action-button` replaced the hand-rolled icon buttons. It is worth
  the install for one behaviour: it marks a disabled button `aria-disabled`
  instead of `disabled`, so the control keeps its hover, its focus and its
  tooltip. Every explanation on this page that only a disabled button could
  give — *already first*, *a song keeps at least one section*, *the whole song
  is playing* — was written in a `title` the browser would not show, because
  `disabled` kills the pointer events that would have shown it.
- `@cubeui/option-select` replaced the seven-primitive `Select` assembly at
  every call site, and there is now no hand-assembled select left. `FlowRoute`'s
  section picker was the one holdout: its trigger showed the numbered name
  ("Chorus 2") while its value was the bare label, which `OptionSelect` cannot
  do — it renders the selected option's own label. The fix was to stop asking
  it to. The number is the *song's* and not the writer's, so `sectionOrdinals`
  hands it over on its own and it is drawn in a badge beside the menu, leaving
  the menu to offer the seven labels and nothing else. A menu offering "Verse 2"
  was always offering something reordering the song takes straight back.
- Tooltips open immediately: the provider's `delayDuration` now defaults to
  shadcn's 0 rather than Radix's 700ms.

One thing the install does that is worth undoing: `shadcn add` rewrites
`@types/react-dom` to the range the registry item declares (`~19.2.0`), which
caps the DOM types a minor behind `@types/react` and quietly downgrades them.
Put the caret range back in `package.json` and `npm update @types/react-dom`
after an install, so the two type packages stay on the same minor.

`FlowChart` draws its arrows by **measuring** where the chips landed — one
`ResizeObserver`, then curves between the measured boxes — rather than by
laying the graph out on a fixed grid. A chord's label decides its chip's width,
so C major, F♯ harmonic minor and the 7ths switch are three different layouts
of the same graph; measuring is what makes all three right, and the geometry is
stamped with the labels it was taken for so a stale measurement is never drawn.

Nothing on the page is a hand-rolled version of something the registry ships:
`PlayButton` and `FlowRoute`'s icon row are `@cubeui/action-button`, the
relative/parallel key links and both sketchpads' *Clear* are `@cubeui/button`
with a variant, the key picker's *Show modes as* pills are `@cubeui/segmented`'s
`SegmentedGroup` and its 7ths toggle is `@cubeui/switch-field` (cubicecho/cubeui
#104 and #105 were filed from here), and the `<button>`s that remain are the ones the registry has
no item for — `ChordBlock`'s chord face and its floating remove ×,
`NoteStrip`'s note, octave and step tiles, `ChordTable`'s chord-tone chips.
Those are data tiles rather than controls, and `Button` wraps a bare string
child and cannot be a three-line tile. Reach for a registry item first; write a
`<button>` only when what you are making is not a control the set has.

Installed files are **excluded from Biome** (`biome.json` → `files.includes`)
so that re-running `shadcn add ... --overwrite` produces no diff. Do not
reformat them, and do not edit them: change them upstream in cubeui and
reinstall. A new item means a new line in that ignore list.

## Working on it

```sh
npm run dev        # :3000, bound to 0.0.0.0 so other devices on the LAN can reach it
npm run check      # biome + tsc + vitest, the one to run before finishing
npm run test
npm run build
npm run registry:serve   # ../cubeui/public on :8731, for an unpublished item
```

`CUBEUI_PATH` overrides where that server looks for the sibling checkout. The
ordinary install path is the published registry, which `components.json`
already points at — the server is only for trying a change before it ships.

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
