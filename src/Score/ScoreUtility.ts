import {Amson} from '@/Score/ScoreTypes';

export class ScoreUtility {
  private amson: Amson.Structure;

  constructor(amson: Amson.Structure) {
    this.amson = amson;
  }

  tickByDuration(elapsedSec: number): number {
    if (elapsedSec < 0) {
      return 0;
    }
    return elapsedSec * (this.amson.info.bpm / 60.0) * this.amson.info.resolution;
  }

  durationByTick(tick: number): number {
    if (tick < 0) {
      return 0;
    }
    return (tick * (60.0 / this.amson.info.bpm)) / this.amson.info.resolution;
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