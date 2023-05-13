import {ScoreBuilder} from '@/Scene/ScoreEditor/ScoreBuilder';
import {ScoreInfoEditor} from '@/Scene/ScoreEditor/ScoreInfoEditor';
import {SongRecourceList} from '@/Scene/ScoreEditor/SongRecource';
import {VideoController} from '@/Scene/ScoreEditor/VideoController';
import {EventLane, EventLaneEvent} from '@/Scene/ScoreEditor/View/EventLane';
import {SequencerEvent, SequencerView} from '@/Scene/ScoreEditor/View/SequencerView';
import metoronome from '@/Scene/ScoreEditor/metoronome.wav';
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
  private infoEditor: ScoreInfoEditor;
  private videoController: VideoController;
  private sequencerView?: SequencerView;
  private eventLane?: EventLane;
  private editMode = EditMode.kSection;
  private elapsedSec = 0;

  constructor() {
    super(ScoreEditorScene.name);

    this.builder = new ScoreBuilder(SongRecourceList[0]);

    this.infoEditor = new ScoreInfoEditor(this.builder.score);
    this.infoEditor.setOnSongChanged(this.loadVideo.bind(this));

    this.videoController = new VideoController(this.builder.score);
    this.videoController.setOnMetronome(this.playMetoronomeSound.bind(this));
  }

  init() {
    this.sound.pauseOnBlur = false; // フォーカスアウトしてもサウンドを鳴らす

    this.events.once('shutdown', this.shutdown.bind(this));
    this.input.keyboard?.on(
      Phaser.Input.Keyboard.Events.ANY_KEY_DOWN,
      this.onKeyboardEvent.bind(this)
    );
  }

  preload() {
    this.load.audio('metoronome', metoronome);
  }

  create() {
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xdddddd)
      .setOrigin(0)
      .setAlpha(0)
      .on(Phaser.Input.Events.POINTER_WHEEL, this.onMouseWheelEvent.bind(this))
      .setInteractive({
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

    const marginHeight = (this.scale.height - SequencerView.fixedHeight) / 2;

    this.sequencerView = new SequencerView(this, 0, marginHeight, this.builder.score);
    this.sequencerView.setCallback(this.onSequencerEvent.bind(this));

    const eventLaneX = this.sequencerView.width + 32;
    this.eventLane = new EventLane(this, eventLaneX, marginHeight, this.builder.score);
    this.eventLane?.setOnEvent(this.onEventLaneEvent.bind(this));

    this.loadVideo();
  }

  update() {
    this.elapsedSec = this.videoController.elapsedSec;
    this.videoController.update();
    this.sequencerView?.scroll(this.elapsedSec);
    this.eventLane?.scroll(this.elapsedSec);
  }

  private shutdown() {
    this.infoEditor.terminate();
    this.videoController.terminate();
  }

  private playMetoronomeSound() {
    this.sound.play('metoronome');
  }

  private loadVideo() {
    this.videoController.loadVideo(
      parseInt(this.game.canvas.style.width),
      parseInt(this.game.canvas.style.height)
    );
  }

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

  private onEventLaneEvent(event: EventLaneEvent, tick: number): boolean {
    switch (event) {
      case EventLaneEvent.kAddSection:
        return this.builder.addSection(tick);
      case EventLaneEvent.kAddSectionLength:
        return this.builder.addSectionLength(tick);
      case EventLaneEvent.kSubSectionLength:
        return this.builder.subSectionLength(tick);
      case EventLaneEvent.kToggleSectionType:
        return this.builder.toggleSectionType(tick);
      case EventLaneEvent.kRemoveSection:
        return this.builder.removeSection(tick);
      case EventLaneEvent.kAddAppeal:
        return this.builder.addAppeal(tick);
      case EventLaneEvent.kRemoveAppeal:
        return this.builder.removeAppeal(tick);
      case EventLaneEvent.kAddFever:
        return this.builder.addFever(tick);
      case EventLaneEvent.kRemoveFever:
        return this.builder.removeFever(tick);
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
