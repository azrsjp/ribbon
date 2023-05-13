import {SongRecource} from '@/Scene/ScoreEditor/SongRecource';
import {Amson} from '@/Score/ScoreTypes';

export class ScoreBuilder {
  private amson: Amson.Structure;

  constructor(resource: SongRecource) {
    this.amson = {
      info: {
        title: resource.title,
        level: 1,
        bpm: resource.bpm,
        resolution: 240,
        stage: 0,
        mvId: resource.mvId,
        startAtMs: resource.startAtMs,
        endAtMs: resource.endAtMs,
      },
      notes: [],
      sections: [],
      appeals: [],
      fevers: [],
    };
  }

  get score() {
    return this.amson;
  }

  addNote(tick: number, type: Amson.NoteType) {
    const found = this.findNote(tick);
    if (found == null) {
      this.amson.notes.push({tick: tick, type: type, length: 0});
    }
  }

  removeNote(tick: number) {
    this.amson.notes = this.amson.notes.filter((note) => note.tick !== tick);
  }

  toggleNote(tick: number) {
    const found = this.findNote(tick);
    if (found != null) {
      const noteVariety = 3;
      found.type = (found.type + 1) % noteVariety;
    }
  }

  addNoteLength(tick: number) {
    const found = this.findNote(tick);
    if (found != null) {
      const lengthToAdd = this.amson.info.resolution / 4;
      const from = tick;
      const to = tick + found.length + lengthToAdd;
      const conflictNote = this.amson.notes.find((note) => {
        return from < note.tick && note.tick <= to;
      });

      found.length = conflictNote == null ? found.length + lengthToAdd : found.length;
    }
  }

  subNoteLength(tick: number) {
    const found = this.findNote(tick);
    if (found != null) {
      found.length = Math.max(0, found.length - this.amson.info.resolution / 4);
    }
  }

  private findNote(tick: number) {
    return this.amson.notes.find((note) => note.tick == tick);
  }
}
