# Music writing cheatsheet

**[cubicecho.github.io/music-writing-cheatsheet](https://cubicecho.github.io/music-writing-cheatsheet/)**

Pick a key. Everything a writer needs to see about it is on the page at once:
the scale, what each degree is, the modes hiding in it, the chords that sit on
top of them, and the progressions people actually build out of those chords.

Aimed at guitarists — degrees, step patterns and chord symbols rather than
staves — but nothing in it is instrument-specific.

- **The key's scale**, spelled properly. F♯ major gets an E♯, not an F, because
  a seven-note scale has one of every letter and the cheatsheet that fudges
  that is teaching the wrong thing.
- **Its modes**, as many as you want open at once, shown two ways: *relative*
  (the same seven notes, started somewhere else) or *parallel* (the same root,
  new notes). The second is how you hear what a mode actually does.
- **The intervals**, three ways over — the degree under each note (`1 2 ♭3 4`),
  the semitone count from the root, and the step from each note to the next.
  Hover anything for the formal name: *Minor 3rd*, *Augmented 4th*.
- **The chords**, thirds stacked out of the scale's own notes and nothing else.
  Roman numeral, symbol, and each note labelled by the job it does in the chord.
- **Seventh chords** on a switch, for when triads are not enough.
- **Common progressions**, on a second tab that keeps your key and scale. Each
  one is stored as scale *degrees*, not chord names, so it realises itself in
  whatever key and scale you have open — and a major-key shape heard against a
  minor scale is a real progression too, which the tab shows you rather than
  hides. Chords from outside the scale (the major V of the Andalusian cadence,
  the ♭VII of rock) are marked, and the panel says where they were borrowed
  from.
- **A chord map**, on a third tab: the flowchart every theory book draws —
  home, the chords that set up the pull, the pull itself, arrows between them —
  except it is drawn in your key and you click it. Stand on a chord and its own
  arrows light up, the chords the chart does not reach from there dim, and each
  arrow says what it is for ("ii–V: the root falls a fourth and the 7th of one
  chord becomes the 3rd of the next"). Walk it and you get a progression you can
  play, with a faint arrow wherever you left the well-trodden path. Dimmed, not
  disabled: the chart describes what is common, not what is allowed.
- **A song, under the map.** The route you walk is one section — a verse, a
  chorus, a bridge — and you can keep as many as you like, name them from the
  usual list, copy them, and move them up and down into an order. Play one, or
  play the whole thing through with the chord you are on lit up as it goes.
  Every chord is held the same length, which you set once in beats with a tempo
  beside it, so C, C, Am, G at four beats is two bars of C and one each of Am
  and G — a chord that stays is a chord written twice.
- **Sound.** Click any note, chord or chord tone to hear it; play a scale from
  the root up, or a progression through in time with the chord it is on
  highlighted. Reading that a ♭VI is "brighter than you expect" is not the same
  as hearing one.
- **A sketchpad.** Build your own progression by clicking chords: the seven the
  scale gives you, plus the ones only the other families have. It is stored as
  degrees like everything else, so changing key or scale rewrites your sketch
  instead of losing it.
- **Relative and parallel keys**, as somewhere you can go. C major's relative
  is A natural minor (the same seven notes); its parallel is C natural minor
  (the same root). One click each, and the whole page follows.

Five scale families — major, natural minor, harmonic minor, melodic minor,
harmonic major — seven modes each.

## Running it

```sh
npm install
npm run dev        # http://localhost:3000, bound to 0.0.0.0
```

No server and no database: the whole thing is a static page that computes
everything in the browser.

```sh
npm run check      # biome + tsc + vitest
npm run build      # dist/
npm run preview
```

Pushing to `main` builds and publishes `dist/` to GitHub Pages
(`.github/workflows/pages.yml`), gated on the same `npm run check`. The Vite
`base` is relative, so the build does not care what subpath it is served from.

## What this is also for

This app is the first consumer of [cubeui-rn]'s **web** registry — the DOM half
of the React Native component set, produced by its `rn2web` compiler. Every
control on the page is an installed `@cubeui` item: `Select`, `Switch`,
`Tooltip`, `ToggleChip`, `SegmentedButton`, `Card`, `Badge`, `Button`, `Page`,
`Section`, `SectionHeading`. Nothing was hand-written to stand in for one.

Components are installed from a local copy of the registry rather than from
GitHub Pages, so the app tracks the sibling checkout:

```sh
npm run registry:serve    # serves ../cubeui-rn/public on :8731
npx shadcn@latest add @cubeui/<item> --yes
```

`components.json` points `@cubeui` at `http://localhost:8731/r/{name}.json` —
the web half of the registry, as it is laid out on cubeui's `next` branch; the
React Native half is under `/r/native/`. Point it at the published registry's
own `/r/{name}.json` once that is the one you want.

See [AGENTS.md](AGENTS.md) for what the install turned up.

[cubeui-rn]: https://github.com/cubicecho/cubeui-rn

## Stack

| Layer   | Technology                                  |
| ------- | ------------------------------------------- |
| Build   | Vite 8, TypeScript 6, React 19              |
| UI      | cubeui-rn web registry (shadcn), Tailwind 4 |
| Theory  | `src/lib/music/` — no dependencies          |
| Testing | Vitest                                      |
| Linting | Biome                                       |
