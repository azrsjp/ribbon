import {Amson} from '@/Score/ScoreTypes';

export class ScoreUtility {
  private amson: Amson.Structure;

  constructor(amson: Amson.Structure) {
    this.amson = amson;
  }

  tickByDuration(elapsedSec: number): number {
    return elapsedSec * (this.amson.info.bpm / 60.0) * this.amson.info.resolution;
  }

  durationByTick(tick: number): number {
    return (tick * (60.0 / this.amson.info.bpm)) / this.amson.info.resolution;
  }

  durationSec(): number {
    return (this.amson.info.endAtMs - this.amson.info.startAtMs) * 0.001;
  }

  durationMs(): number {
    return this.amson.info.endAtMs - this.amson.info.startAtMs;
  }

  totalNotes(): number {
    return this.amson.notes.length;
  }

  normalNotes(): number {
    return this.amson.notes.filter((note) => note.length === 0).length;
  }

  longNotes(): number {
    return this.amson.notes.filter((note) => note.length > 0).length;
  }
}
