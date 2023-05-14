import {EditorConstants} from '@/Scene/ScoreEditor/EditorConstants';
import {SongRecource} from '@/Scene/ScoreEditor/SongRecource';
import {Amson} from '@/Score/ScoreTypes';
import {ScoreUtility} from '@/Score/ScoreUtility';

export class ScoreBuilder {
  private amson: Amson.Structure;
  private utility: ScoreUtility;

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

    this.utility = new ScoreUtility(this.score);
  }

  get score() {
    return this.amson;
  }

  isValidScore(): boolean {
    const sectionCountCheck =
      1 <= this.amson.sections.length && this.amson.sections.length <= Amson.Constants.SectionMax;
    const appealCountCheck = this.amson.appeals.length === Amson.Constants.AppealMax;
    const feverCountCheck = this.amson.fevers.length === Amson.Constants.FeverMax;
    const noteRangeCheck = this.amson.notes.filter(
      (note) => !this.isInSectionRange(note.tick, note.length)
    );

    return (
      sectionCountCheck &&
      appealCountCheck &&
      feverCountCheck &&
      noteRangeCheck.length === 0 &&
      this.eventNonOverlappingCheck() &&
      this.notesNonOverlappingCheck()
    );
  }

  addNote(tick: number, type: Amson.NoteType) {
    const isValidDuration = this.isValidDuration(tick, tick);
    const found = this.findNote(tick);
    if (isValidDuration && found == null) {
      this.amson.notes.push({tick: tick, type: type, length: 0});
      this.amson.notes.sort((a, b) => a.tick - b.tick);
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
      const isValidDuration = this.isValidDuration(tick, tick + found.length + lengthToAdd);

      found.length =
        conflictNote == null && isValidDuration ? found.length + lengthToAdd : found.length;
    }
  }

  subNoteLength(tick: number) {
    const found = this.findNote(tick);
    if (found != null) {
      found.length = Math.max(0, found.length - this.amson.info.resolution / 4);
    }
  }

  addSection(tick: number): boolean {
    // 上限チェック
    if (this.amson.sections.length >= Amson.Constants.SectionMax) {
      return false;
    }
    // コンフリクトチェック(追加時のデフォルトの長さを利用)
    const sectionLengthTick = this.amson.info.resolution * 4 * EditorConstants.DefaultSectionBar;
    if (!this.checkRangeConflict(tick, tick + sectionLengthTick)) {
      return false;
    }
    // durationチェック
    if (!this.isValidDuration(tick, tick + sectionLengthTick)) {
      return false;
    }

    this.amson.sections.push({
      type: this.defaultLaneType(),
      tick: tick,
      lengthTick: sectionLengthTick,
    });
    this.amson.sections.sort((a, b) => a.tick - b.tick);

    return true;
  }

  addSectionLength(tick: number): boolean {
    const found = this.amson.sections.find((section) => section.tick === tick);
    if (found == null) {
      return false;
    }

    // checkRangeConflict()で正しくチェックするために一旦消す
    this.removeSection(tick);

    const lengthToAdd = this.amson.info.resolution / 4;
    const from = tick;
    const to = tick + found.lengthTick + lengthToAdd;
    const conflict = !this.checkRangeConflict(from, to);

    // コンフリクトしてたら元に戻す、そうでなければTickを伸ばしたSectionを追加
    this.amson.sections.push({
      type: found.type,
      tick: tick,
      lengthTick: conflict ? found.lengthTick : found.lengthTick + lengthToAdd,
    });
    this.amson.sections.sort((a, b) => a.tick - b.tick);

    return !conflict;
  }

  subSectionLength(tick: number): boolean {
    const found = this.amson.sections.find((section) => section.tick === tick);
    if (found == null) {
      return false;
    }

    found.lengthTick = Math.max(
      this.amson.info.resolution * 4 * 1, // 1小節を下限としておく(変更可能)
      found.lengthTick - this.amson.info.resolution / 4
    );
    return true;
  }

  moveSection(tick: number, diffTick: number): boolean {
    const found = this.amson.sections.find((section) => section.tick === tick);
    if (found == null) {
      return false;
    }

    const from = tick + diffTick;
    const to = tick + diffTick + found.lengthTick;

    if (!this.isValidDuration(from, to)) {
      return false;
    }

    // checkRangeConflict()で正しくチェックするために一旦消す
    this.removeSection(tick);
    const conflict = !this.checkRangeConflict(from, to);

    // コンフリクトしてたら元に戻す、そうでなければTickを伸ばしたSectionを追加
    this.amson.sections.push({
      type: found.type,
      tick: conflict ? tick : tick + diffTick,
      lengthTick: found.lengthTick,
    });
    this.amson.sections.sort((a, b) => a.tick - b.tick);
    return !conflict;
  }

  toggleSectionType(tick: number): boolean {
    const found = this.amson.sections.find((section) => section.tick === tick);
    if (found == null) {
      return false;
    }

    switch (this.amson.info.stage) {
      case Amson.StageType.Live:
        found.type = (found.type + 1) % (Object.keys(Amson.LiveLaneType).length / 2);
        break;
      case Amson.StageType.Fashion:
        found.type = (found.type + 1) % (Object.keys(Amson.FashionLaneType).length / 2);
        break;
      case Amson.StageType.Dance:
        found.type = (found.type + 1) % (Object.keys(Amson.DanceLaneType).length / 2);
        break;
    }
    return true;
  }

  removeSection(tick: number) {
    this.amson.sections = this.amson.sections.filter((section) => section.tick !== tick);
    return true;
  }

  addAppeal(tick: number): boolean {
    // 上限チェック
    if (this.amson.appeals.length >= Amson.Constants.AppealMax) {
      return false;
    }
    // コンフリクトチェック
    const appealLength = this.utility.tickByDuration(Amson.Constants.AppealDuationSec);
    if (!this.checkRangeConflict(tick, tick + appealLength)) {
      return false;
    }
    // durationチェック
    if (!this.isValidDuration(tick, tick + appealLength)) {
      return false;
    }

    this.amson.appeals.push({tick: tick});
    this.amson.appeals.sort((a, b) => a.tick - b.tick);
    return true;
  }

  removeAppeal(tick: number): boolean {
    this.amson.appeals = this.amson.appeals.filter((appeal) => appeal.tick !== tick);
    return true;
  }

  moveAppeal(tick: number, diffTick: number): boolean {
    const found = this.amson.appeals.find((appeal) => appeal.tick === tick);
    if (found == null) {
      return false;
    }

    const from = tick + diffTick;
    const to = tick + diffTick + this.utility.tickByDuration(Amson.Constants.AppealDuationSec);

    if (!this.isValidDuration(from, to)) {
      return false;
    }

    // checkRangeConflict()で正しくチェックするために一旦消す
    this.removeAppeal(tick);
    const conflict = !this.checkRangeConflict(from, to);

    // コンフリクトしてたら元に戻す、そうでなければTickを伸ばしたSectionを追加
    this.amson.appeals.push({
      tick: conflict ? tick : tick + diffTick,
    });
    this.amson.appeals.sort((a, b) => a.tick - b.tick);
    return !conflict;
  }

  addFever(tick: number): boolean {
    // 上限チェック
    if (this.amson.fevers.length >= Amson.Constants.FeverMax) {
      return false;
    }
    // コンフリクトチェック
    const feverLength = this.utility.tickByDuration(Amson.Constants.FeverDuraionSec);
    if (!this.checkRangeConflict(tick, tick + feverLength)) {
      return false;
    }
    // durationチェック
    if (!this.isValidDuration(tick, tick + feverLength)) {
      return false;
    }

    this.amson.fevers.push({tick: tick});
    this.amson.fevers.sort((a, b) => a.tick - b.tick);
    return true;
  }

  removeFever(tick: number): boolean {
    this.amson.fevers = this.amson.fevers.filter((fever) => fever.tick !== tick);
    return true;
  }

  moveFever(tick: number, diffTick: number): boolean {
    const found = this.amson.fevers.find((fever) => fever.tick === tick);
    if (found == null) {
      return false;
    }

    const from = tick + diffTick;
    const to = tick + diffTick + this.utility.tickByDuration(Amson.Constants.FeverDuraionSec);

    if (!this.isValidDuration(from, to)) {
      return false;
    }

    // checkRangeConflict()で正しくチェックするために一旦消す
    this.removeFever(tick);
    const conflict = !this.checkRangeConflict(from, to);

    // コンフリクトしてたら元に戻す、そうでなければTickを伸ばしたSectionを追加
    this.amson.fevers.push({
      tick: conflict ? tick : tick + diffTick,
    });
    this.amson.fevers.sort((a, b) => a.tick - b.tick);
    return !conflict;
  }

  private findNote(tick: number) {
    return this.amson.notes.find((note) => note.tick == tick);
  }

  private isValidDuration(from: number, to: number) {
    const fromMs = this.amson.info.startAtMs + this.utility.durationByTick(from) * 1000;
    const toMs = this.amson.info.startAtMs + this.utility.durationByTick(to) * 1000;

    return this.amson.info.startAtMs <= fromMs && toMs <= this.amson.info.endAtMs;
  }

  private defaultLaneType() {
    switch (this.amson.info.stage) {
      case Amson.StageType.Live:
        return Amson.LiveLaneType.kPositiveClockwise;
      case Amson.StageType.Fashion:
        return Amson.FashionLaneType.kCircle;
      case Amson.StageType.Dance:
        return Amson.DanceLaneType.kUpperLeft;
    }
  }

  private checkRangeConflict(from: number, to: number) {
    {
      const conflictSection = this.amson.sections.find(
        (section) => section.tick <= to && from <= section.tick + section.lengthTick
      );
      if (conflictSection != null) {
        console.log('conflict with section', conflictSection);
        return false;
      }
    }
    {
      const appealLength = this.utility.tickByDuration(Amson.Constants.AppealDuationSec);
      const conflictAppeal = this.amson.appeals.find(
        (appeal) => appeal.tick <= to && from <= appeal.tick + appealLength
      );
      if (conflictAppeal != null) {
        console.log('conflict with appeal', conflictAppeal);
        return false;
      }
    }
    {
      const feverLength = this.utility.tickByDuration(Amson.Constants.FeverDuraionSec);
      const conflictFever = this.amson.fevers.find(
        (fever) => fever.tick <= to && from <= fever.tick + feverLength
      );
      if (conflictFever != null) {
        console.log('conflict with fever', conflictFever);
        return false;
      }
    }

    return true;
  }

  private isInSectionRange(tick: number, lengthTick: number): boolean {
    const rangeFound = this.amson.sections.find(
      (section) => section.tick <= tick && tick + lengthTick < section.tick + section.lengthTick
    );
    return rangeFound != null;
  }

  private eventNonOverlappingCheck(): boolean {
    const appealDurationTick = this.utility.tickByDuration(Amson.Constants.AppealDuationSec);
    const feverDurationTick = this.utility.tickByDuration(Amson.Constants.FeverDuraionSec);

    const ranges = [
      ...this.amson.sections.map((section) => [section.tick, section.lengthTick]),
      ...this.amson.appeals.map((appeal) => [appeal.tick, appealDurationTick]),
      ...this.amson.fevers.map((fever) => [fever.tick, feverDurationTick]),
    ].sort((a, b) => a[0] - b[0]);

    for (let i = 0; i < ranges.length - 1; i++) {
      if (ranges[i][0] + ranges[i][1] > ranges[i + 1][0]) {
        return false;
      }
    }
    return true;
  }

  private notesNonOverlappingCheck(): boolean {
    const notes = this.amson.notes.sort((a, b) => a.tick - b.tick);

    for (let i = 0; i < notes.length - 1; i++) {
      if (notes[i].tick + notes[i].length > notes[i + 1].tick) {
        return false;
      }
    }
    return true;
  }
}
