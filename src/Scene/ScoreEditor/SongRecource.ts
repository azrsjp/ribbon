export type SongRecource = {
  title: string;
  mvId: string;
  bpm: number;
  startAtMs: number;
  endAtMs: number;
};

export const SongRecourceList: Array<SongRecource> = [
  {title: 'おけまる', mvId: 'nxU0C9mRI0w', bpm: 181, startAtMs: 5220, endAtMs: 123000},
  {title: '6㎝上の景色', mvId: '5CPUWvvZy9U', bpm: 138, startAtMs: 5495, endAtMs: 118000},
  {title: 'Believe it', mvId: 'swGUp33vfqc', bpm: 94, startAtMs: 5670, endAtMs: 128000},
];
