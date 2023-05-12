import {ScoreBuilder} from '@/Scene/ScoreEditor/ScoreBuilder';
import {SongRecourceList} from '@/Scene/ScoreEditor/SongRecource';
import {SequencerEvent, SequencerView} from '@/Scene/ScoreEditor/View/SequencerView';
import {Amson} from '@/Score/ScoreTypes';
import Phaser from 'phaser';

enum EditMode {
  kLeft,
  kUp,
  kRight,
  kSection,
  kAppeal,
  kFever,
  kLocked,
}

export class ScoreEditorScene extends Phaser.Scene {
  private builder: ScoreBuilder;
  private sequencerView?: SequencerView;
  private editMode = EditMode.kSection;
  private elapsedSec = 0;

  constructor() {
    super(ScoreEditorScene.name);

    this.builder = new ScoreBuilder(SongRecourceList[0]);
  }

  init() {
    this.events.once('shutdown', this.shutdown.bind(this));
    this.input.keyboard?.on(
      Phaser.Input.Keyboard.Events.ANY_KEY_DOWN,
      this.onKeyboardEvent.bind(this)
    );
  }

  preload() {}

  create() {
    const marginHeight = (this.scale.height - SequencerView.fixedHeight) / 2;
    const bgRectMask = this.add
      .rectangle(0, marginHeight, this.scale.width, this.scale.height - marginHeight * 2, 0xeeeeee)
      .setOrigin(0)
      .on(Phaser.Input.Events.POINTER_WHEEL, this.onMouseWheelEvent.bind(this))
      .setInteractive({
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      })
      .createBitmapMask();

    this.sequencerView = new SequencerView(this, 48, marginHeight, this.builder.score);
    this.sequencerView.setMask(bgRectMask);
    this.sequencerView.setCallback(this.onSequencerEvent.bind(this));
  }

  update() {
    this.sequencerView?.scroll(this.elapsedSec);
  }

  private shutdown() {}

  private onSequencerEvent(event: SequencerEvent, tick: number) {
    switch (event) {
      case SequencerEvent.kAddNote:
        this.builder.addNote(tick, this.modeToNoteType(this.editMode));
        break;
      case SequencerEvent.kRemoveNote:
        this.builder.removeNote(tick);
        break;
      case SequencerEvent.kToggleNote:
        this.builder.toggleNote(tick);
        break;
      case SequencerEvent.kAddLength:
        this.builder.addNoteLength(tick);
        break;
      case SequencerEvent.kSubLength:
        this.builder.subNoteLength(tick);
        break;
    }
  }

  private onKeyboardEvent(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowLeft':
        this.editMode = EditMode.kLeft;
        this.sequencerView?.setEditMode(true);
        break;
      case 'ArrowUp':
        this.editMode = EditMode.kUp;
        this.sequencerView?.setEditMode(true);
        break;
      case 'ArrowRight':
        this.editMode = EditMode.kRight;
        this.sequencerView?.setEditMode(true);
        break;
      default:
        break;
    }
  }

  private onMouseWheelEvent(pointer: Phaser.Input.Pointer) {
    const lengthSec = (this.builder.score.info.endAtMs - this.builder.score.info.startAtMs) * 0.001;
    const diffSec = 1 * Math.sign(pointer.deltaY);

    this.elapsedSec = Phaser.Math.Clamp(this.elapsedSec + diffSec, 0, lengthSec);
  }

  private modeToNoteType(mode: EditMode) {
    switch (mode) {
      case EditMode.kUp:
        return Amson.NoteType.Up;
      case EditMode.kLeft:
        return Amson.NoteType.Left;
      case EditMode.kRight:
        return Amson.NoteType.Right;
      default:
        return Amson.NoteType.Up;
    }
  }
}
