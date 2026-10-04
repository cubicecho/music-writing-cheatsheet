/**
 * The rhythms, as data.
 *
 * A rhythm here is what a drummer would call a groove: a few instruments, each with a row of hits
 * on a grid, in a meter. Everything else on the Rhythms tab — the staff, the grid, the sound and
 * the MIDI file — is read off these rows, so adding a rhythm is adding an entry to `RHYTHMS`.
 *
 * A row is a string, one character per grid step, because that is how these are passed around on
 * paper and it is the form you can check against a book at a glance:
 *
 *   `.` nothing   `x` a hit   `X` an accented hit   `o` a ghost note
 *
 * Outside `music/` for the same reason `song.ts` is: none of it is about pitch.
 */

export type NoteHead = 'normal' | 'cross' | 'diamond';

type InstrumentInfo = {
  name: string;
  /** The General MIDI percussion key, which is what makes the download play on any drum kit. */
  midi: number;
  /** Where it sits on the staff, in half-spaces up from the bottom line. */
  position: number;
  head: NoteHead;
  /** The same position in words, for the key under the staff. */
  where: string;
};

/**
 * What can be hit, top of the kit first — the order the grid's rows and the staff's key are in.
 *
 * The positions are the ones drum notation settled on: cymbals as crosses at the top, the snare in
 * the third space, the kick in the bottom one, and whatever the left foot does under the staff.
 */
export const INSTRUMENTS = {
  openHat: { name: 'Open hi-hat', midi: 46, position: 9, head: 'cross', where: 'a ringed cross above the staff' },
  hat: { name: 'Hi-hat', midi: 42, position: 9, head: 'cross', where: 'a cross above the staff' },
  ride: { name: 'Ride', midi: 51, position: 8, head: 'cross', where: 'a cross on the top line' },
  bell: { name: 'Cowbell', midi: 56, position: 7, head: 'diamond', where: 'a diamond in the top space' },
  claves: { name: 'Claves', midi: 75, position: 7, head: 'cross', where: 'a cross in the top space' },
  snare: { name: 'Snare', midi: 38, position: 5, head: 'normal', where: 'a note in the third space' },
  rim: { name: 'Cross-stick', midi: 37, position: 5, head: 'cross', where: 'a cross in the third space' },
  kick: { name: 'Kick', midi: 36, position: 1, head: 'normal', where: 'a note in the bottom space' },
  pedal: { name: 'Hi-hat (foot)', midi: 44, position: -1, head: 'cross', where: 'a cross below the staff' },
} as const satisfies Record<string, InstrumentInfo>;

export type InstrumentId = keyof typeof INSTRUMENTS;

export const INSTRUMENT_ORDER = Object.keys(INSTRUMENTS) as InstrumentId[];

/**
 * The meters, in the terms everything downstream needs: how many pulses you tap your foot to, and
 * how long one is. 6/8 is two pulses of a dotted quarter, not six of an eighth — that is the
 * difference between it and 3/4, which have the same six eighths in a bar.
 */
export const METERS = {
  '4/4': { pulses: 4, pulseSixteenths: 4, numerator: 4, denominator: 4 },
  '3/4': { pulses: 3, pulseSixteenths: 4, numerator: 3, denominator: 4 },
  '6/8': { pulses: 2, pulseSixteenths: 6, numerator: 6, denominator: 8 },
  '12/8': { pulses: 4, pulseSixteenths: 6, numerator: 12, denominator: 8 },
} as const;

export type MeterId = keyof typeof METERS;

export const STYLES = [
  { id: 'rock', name: 'Rock & pop' },
  { id: 'folk', name: 'Folk & country' },
  { id: 'jazz', name: 'Blues & jazz' },
  { id: 'latin', name: 'Afro-Cuban & Brazilian' },
  { id: 'caribbean', name: 'Reggae & reggaeton' },
  { id: 'funk', name: 'Funk & hip-hop' },
] as const;

export type StyleId = (typeof STYLES)[number]['id'];

export type Rhythm = {
  id: string;
  name: string;
  style: StyleId;
  meter: MeterId;
  /**
   * Grid steps per pulse: 2 is eighths in 4/4, 4 is sixteenths, and 3 is the eighths of a compound
   * meter. Not 3 in a simple meter — triplet feels are written as `swing` instead, which is how
   * they are written on paper.
   */
  division: 2 | 3 | 4;
  /** Eighths written straight and played long–short. Only meaningful with a division of 2. */
  swing?: true;
  /** Pulses a minute — the foot-tap, so a dotted quarter in 6/8. */
  bpm: number;
  description: string;
  heardIn?: string;
  /** One row per instrument, each one or two bars long and all the same length. */
  voices: Partial<Record<InstrumentId, string>>;
};

export const RHYTHMS: Rhythm[] = [
  {
    id: 'rock-eighths',
    name: 'Eighth-note rock',
    style: 'rock',
    meter: '4/4',
    division: 2,
    bpm: 112,
    description:
      'The beat everything else here is a variation on: kick on 1 and 3, snare on 2 and 4 (the backbeat), and the hi-hat counting eighths over the top.',
    heardIn: 'most rock and pop since the 1960s — “Billie Jean”, “Back in Black”',
    voices: { hat: 'xxxxxxxx', snare: '..x...x.', kick: 'x...x...' },
  },
  {
    id: 'four-on-the-floor',
    name: 'Four on the floor',
    style: 'rock',
    meter: '4/4',
    division: 2,
    bpm: 122,
    description:
      'The kick on every beat, which is what makes it dance music, and an open hi-hat answering on every off-beat.',
    heardIn: 'disco, house and most four-to-the-bar dance music',
    voices: { openHat: '.x.x.x.x', snare: '..x...x.', kick: 'x.x.x.x.' },
  },
  {
    id: 'half-time',
    name: 'Half-time',
    style: 'rock',
    meter: '4/4',
    division: 2,
    bpm: 140,
    description:
      'The same bar with one backbeat instead of two: the snare lands on 3 alone, so the song feels half as fast without the tempo changing.',
    heardIn: 'breakdowns, ballads and trap',
    voices: { hat: 'xxxxxxxx', snare: '....x...', kick: 'x.......' },
  },
  {
    id: 'motown',
    name: 'Motown four-snare',
    style: 'rock',
    meter: '4/4',
    division: 2,
    bpm: 126,
    description: 'The snare on all four beats rather than two. There is no backbeat to wait for, so it never lets up.',
    heardIn: '“I Can’t Help Myself”, “You Can’t Hurry Love”',
    voices: { hat: 'xxxxxxxx', snare: 'x.x.x.x.', kick: 'x...x...' },
  },
  {
    id: 'boom-chick',
    name: 'Boom-chick (two-beat)',
    style: 'folk',
    meter: '4/4',
    division: 2,
    bpm: 168,
    description:
      'Bass on 1 and 3, a chick on 2 and 4, and nothing else. On a guitar it is a bass note and a strum; on a kit it is this.',
    heardIn: 'country, bluegrass, polka',
    voices: { snare: '..x...x.', kick: 'x...x...' },
  },
  {
    id: 'train-beat',
    name: 'Train beat',
    style: 'folk',
    meter: '4/4',
    division: 4,
    bpm: 104,
    description:
      'Steady sixteenths on the snare, usually with brushes, accented on every off-beat while the kick walks the beats under it. The accents are the chick of the boom-chick; the rest is the train.',
    heardIn: 'Johnny Cash, rockabilly, most country shuffles played straight',
    voices: { snare: 'xxXxxxXxxxXxxxXx', kick: 'x...x...x...x...' },
  },
  {
    id: 'waltz',
    name: 'Waltz',
    style: 'folk',
    meter: '3/4',
    division: 2,
    bpm: 138,
    description: 'Three beats, weight on the first: boom, chick, chick.',
    heardIn: 'waltzes, and a great many folk ballads',
    voices: { snare: '..x.x.', kick: 'x.....' },
  },
  {
    id: 'six-eight',
    name: '6/8 ballad',
    style: 'folk',
    meter: '6/8',
    division: 3,
    bpm: 58,
    description:
      'Six eighths felt as two groups of three: the kick on the first group, the snare on the second. The same six eighths as a waltz, counted in two instead of three.',
    heardIn: '“House of the Rising Sun”, Irish jigs at four times the speed',
    voices: { hat: 'xxxxxx', snare: '...x..', kick: 'x.....' },
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    style: 'jazz',
    meter: '4/4',
    division: 2,
    swing: true,
    bpm: 112,
    description:
      'The rock beat with its eighths swung: each off-beat is pushed late, to the last third of the beat. Written straight, played long–short.',
    heardIn: 'Chicago blues, boogie, “Pride and Joy”',
    voices: { hat: 'xxxxxxxx', snare: '..x...x.', kick: 'x...x...' },
  },
  {
    id: 'slow-blues',
    name: '12/8 slow blues',
    style: 'jazz',
    meter: '12/8',
    division: 3,
    bpm: 60,
    description:
      'Four beats of three eighths each. It is a shuffle slow enough that the middle eighth gets played, so it is written out rather than swung.',
    heardIn: 'slow blues and doo-wop — “Stormy Monday”, “Unchained Melody”',
    voices: { hat: 'xxxxxxxxxxxx', snare: '...x.....x..', kick: 'x.....x.....' },
  },
  {
    id: 'swing',
    name: 'Jazz swing',
    style: 'jazz',
    meter: '4/4',
    division: 2,
    swing: true,
    bpm: 144,
    description:
      'The ride cymbal carries the time — ding, ding-a-ding — and the left foot closes the hi-hat on 2 and 4. The kick and snare are left free to answer the soloist, which is why they are not written here.',
    heardIn: 'swing and bebop',
    voices: { ride: 'x.xxx.xx', pedal: '..x...x.' },
  },
  {
    id: 'jazz-waltz',
    name: 'Jazz waltz',
    style: 'jazz',
    meter: '3/4',
    division: 2,
    swing: true,
    bpm: 152,
    description: 'The swing ride pattern cut to three beats, with the hi-hat foot on 2.',
    heardIn: '“My Favorite Things”, “Someday My Prince Will Come”',
    voices: { ride: 'x.xxx.', kick: 'x.....', pedal: '..x...' },
  },
  {
    id: 'son-clave-3-2',
    name: 'Son clave (3–2)',
    style: 'latin',
    meter: '4/4',
    division: 2,
    bpm: 180,
    description:
      'Five strokes over two bars — three, then two — that every other part in Afro-Cuban music is placed against. Squeezed into one bar it is the Bo Diddley beat.',
    heardIn: 'son, salsa, mambo',
    voices: { claves: 'x..x..x...x.x...' },
  },
  {
    id: 'son-clave-2-3',
    name: 'Son clave (2–3)',
    style: 'latin',
    meter: '4/4',
    division: 2,
    bpm: 180,
    description:
      'The same clave started on its other bar. Which way round it runs is decided by the melody, and once a tune has started it does not turn over.',
    heardIn: 'most salsa arrangements',
    voices: { claves: '..x.x...x..x..x.' },
  },
  {
    id: 'rumba-clave-3-2',
    name: 'Rumba clave (3–2)',
    style: 'latin',
    meter: '4/4',
    division: 2,
    bpm: 180,
    description:
      'Son clave with the third stroke moved an eighth later, off the beat. One note of difference, and a good deal more tension.',
    heardIn: 'rumba, guaguancó, songo',
    voices: { claves: 'x..x...x..x.x...' },
  },
  {
    id: 'bossa-nova',
    name: 'Bossa nova',
    style: 'latin',
    meter: '4/4',
    division: 2,
    bpm: 140,
    description:
      'A two-bar cross-stick figure that is close to a clave but is not one, over a kick that plays the bass line’s rhythm and a hi-hat in even eighths.',
    heardIn: '“The Girl from Ipanema”, “Corcovado”',
    voices: { hat: 'xxxxxxxxxxxxxxxx', rim: 'x..x..x...x..x..', kick: 'x..xx..xx..xx..x' },
  },
  {
    id: 'bembe',
    name: 'Afro-Cuban 6/8 bell',
    style: 'latin',
    meter: '12/8',
    division: 3,
    bpm: 112,
    description:
      'Seven strokes in twelve, the bell pattern most West African and Afro-Cuban 6/8 music is built round. The foot keeps the four pulses so you can hear the bell pull against them.',
    heardIn: 'bembé, and under “Afro Blue”',
    voices: { bell: 'x.x.xx.x.x.x', pedal: 'x..x..x..x..' },
  },
  {
    id: 'one-drop',
    name: 'One drop',
    style: 'caribbean',
    meter: '4/4',
    division: 2,
    bpm: 144,
    description:
      'Nothing on 1 — the beat is dropped — and the kick and cross-stick together on 3. The space at the front of the bar is the whole feel.',
    heardIn: 'roots reggae — “One Drop”, “No Woman, No Cry”',
    voices: { hat: 'xxxxxxxx', rim: '....x...', kick: '....x...' },
  },
  {
    id: 'dembow',
    name: 'Dembow',
    style: 'caribbean',
    meter: '4/4',
    division: 4,
    bpm: 94,
    description:
      'Four on the floor under a snare that plays the last two strokes of a tresillo, 3+3+2, in each half of the bar.',
    heardIn: 'reggaeton and dancehall',
    voices: { snare: '...x..x....x..x.', kick: 'x...x...x...x...' },
  },
  {
    id: 'funk-sixteenths',
    name: 'Sixteenth-note funk',
    style: 'funk',
    meter: '4/4',
    division: 4,
    bpm: 98,
    description:
      'The backbeat stays put and everything else moves onto the sixteenths: a syncopated kick, and ghost notes on the snare filling the gaps between the accents.',
    heardIn: 'James Brown, The Meters, Tower of Power',
    voices: { hat: 'xxxxxxxxxxxxxxxx', snare: '....X..o.o..X..o', kick: 'x..x......x..x..' },
  },
  {
    id: 'boom-bap',
    name: 'Boom bap',
    style: 'funk',
    meter: '4/4',
    division: 4,
    bpm: 90,
    description:
      'A hard backbeat and a kick that arrives early or late for 3 instead of on it. The name is the sound of the kick and the snare.',
    heardIn: '1990s East Coast hip-hop',
    voices: { hat: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', kick: 'x......x..x.....' },
  },
];

export function findRhythm(id: string): Rhythm {
  return RHYTHMS.find((rhythm) => rhythm.id === id) ?? RHYTHMS[0]!;
}
