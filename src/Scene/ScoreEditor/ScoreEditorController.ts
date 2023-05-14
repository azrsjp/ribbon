import {DebugGui} from '@/Debug/DebugGui';
import {Amson} from '@/Score/ScoreTypes';

const kLilGuiTitle = 'EditotrController';

export enum EditorControllerEvent {
  kToPutSectionMode,
  kToPutAppealMode,
  kToPutFeverMode,
  kNormalizeNotes,
  kClearAllNotes,
}

export class ScoreEditorController {
  private amson: Amson.Structure;
  private onEvent?: (event: EditorControllerEvent) => void = undefined;

  constructor(amson: Amson.Structure) {
    this.amson = amson;

    this.initializeGui();
  }

  terminate() {
    this.terminateGui();
  }

  setOnEvent(onEvent: (event: EditorControllerEvent) => void) {
    this.onEvent = onEvent;
  }

  private initializeGui() {
    DebugGui.createGui(kLilGuiTitle, (gui) => {
      gui.add(this, 'totalNotes').listen().disable();
      gui.add(this, 'normalNotes').listen().disable();
      gui.add(this, 'longNotes').listen().disable();
      gui.add(this, 'sectionCount').listen().disable();
      gui.add(this, 'appealCount').listen().disable();
      gui.add(this, 'feverCount').listen().disable();
      const eventLane = gui.addFolder('EventLane');
      eventLane.add(this, 'putSectionMode');
      eventLane.add(this, 'putAppealMode');
      eventLane.add(this, 'putFeverMode');

      const danger = gui.addFolder('Danger');
      danger.add(this, 'normalizeNotes');
      danger.add(this, 'clearAllNotes');
    });
  }

  private get totalNotes() {
    return this.amson.notes.length;
  }

  private get normalNotes() {
    return this.amson.notes.filter((note) => note.length === 0).length;
  }

  private get longNotes() {
    return this.amson.notes.filter((note) => note.length !== 0).length;
  }

  private get sectionCount() {
    return this.amson.sections.length;
  }
  private get appealCount() {
    return this.amson.appeals.length;
  }
  private get feverCount() {
    return this.amson.fevers.length;
  }

  private putSectionMode() {
    if (this.onEvent != null) {
      this.onEvent(EditorControllerEvent.kToPutSectionMode);
    }
  }

  private putAppealMode() {
    if (this.onEvent != null) {
      this.onEvent(EditorControllerEvent.kToPutAppealMode);
    }
  }

  private putFeverMode() {
    if (this.onEvent != null) {
      this.onEvent(EditorControllerEvent.kToPutFeverMode);
    }
  }

  private normalizeNotes() {
    if (this.onEvent != null) {
      this.onEvent(EditorControllerEvent.kNormalizeNotes);
    }
  }

  private clearAllNotes() {
    if (this.onEvent != null) {
      this.onEvent(EditorControllerEvent.kClearAllNotes);
    }
  }

  private terminateGui() {
    DebugGui.deleteGui(kLilGuiTitle);
  }
}
