export namespace Amson {
  // inspired by bmson
  export type Structure = {
    info: Info;
    notes: Note[];
    events: Event[];
    sections: Section[];
  };

  export type Info = {
    title: string;
    level: number;
    bpm: number;
    resolution: number;
    stage: StageType;
    mvId: string;
    startAtMs: number;
    endAtMs: number;
  };

  export type Note = {
    type: NoteType;
    tick: number;
    length: number; // 0: normal note; greater than zero (length in tick): long note
  };

  export type Event = {
    type: EventType;
    tick: number;
  };

  export type Section = {
    type: LiveLaneType | FashionLaneType | DanceLaneType;
    lengthTick: number;
  };

  export enum NoteType {
    Up,
    Right,
    Left,
  }

  export enum EventType {
    Section,
    SpecialAppeal,
    FeverTime,
  }

  export enum StageType {
    Live,
    Fashion,
    Dance,
  }

  export enum LiveLaneType {
    kPositiveClockwise,
    kPositiveCounterclockwise,
    kNegativeClockwise,
    kNegativeCounterclockwise,
  }

  export enum FashionLaneType {
    kCircle,
    kSquare,
  }

  export enum DanceLaneType {
    kUpperLeft,
    kUpperRight,
    kLowerLeft,
    kLowerRight,
  }
}
