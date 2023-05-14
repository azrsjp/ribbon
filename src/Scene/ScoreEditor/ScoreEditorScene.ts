import {EditorConstants} from '@/Scene/ScoreEditor/EditorConstants';
import {ScoreBuilder} from '@/Scene/ScoreEditor/ScoreBuilder';
import {ScoreInfoEditor} from '@/Scene/ScoreEditor/ScoreInfoEditor';
import {SongRecourceList} from '@/Scene/ScoreEditor/SongRecource';
import {VideoController} from '@/Scene/ScoreEditor/VideoController';
import {EventLane, EventLaneEvent} from '@/Scene/ScoreEditor/View/EventLane';
import {SequencerEvent, SequencerView} from '@/Scene/ScoreEditor/View/SequencerView';
import metoronome from '@/Scene/ScoreEditor/metoronome.wav';
import {Amson} from '@/Score/ScoreTypes';
import {ScoreUtility} from '@/Score/ScoreUtility';
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
  private scoreUtility: ScoreUtility;
  private infoEditor: ScoreInfoEditor;
  private videoController: VideoController;
  private sequencerView?: SequencerView;
  private eventLane?: EventLane;
  private editMode = EditMode.kSection;
  private elapsedSec = 0;

  constructor() {
    super(ScoreEditorScene.name);

    this.builder = new ScoreBuilder(SongRecourceList[0]);
    this.scoreUtility = new ScoreUtility(this.builder.score);

    this.infoEditor = new ScoreInfoEditor(this.builder.score);
    this.infoEditor.setOnSongChanged(this.loadVideo.bind(this));

    this.videoController = new VideoController(
      this.builder.score,
      this.onVideoStateChange.bind(this)
    );
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
    let elapsedAtDragStart = 0;
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xdddddd)
      .setOrigin(0)
      .setAlpha(0.1)
      .on(Phaser.Input.Events.POINTER_WHEEL, this.onMouseWheelEvent.bind(this))
      .on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer) => {
        elapsedAtDragStart = this.elapsedSec;
      })
      .on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer) =>
        this.onDrageBgEvent(pointer, elapsedAtDragStart)
      )
      .setInteractive({
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
        draggable: true,
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
    // Videoが再生されていたらそれを優先。止まっていたら手動スクロールの値を採用
    this.elapsedSec = this.videoController.isPlaying
      ? this.videoController.elapsedSec
      : this.elapsedSec;

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
    this.elapsedSec = 0;
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

  private onEventLaneEvent(event: EventLaneEvent, tick: number, value?: number): boolean {
    switch (event) {
      case EventLaneEvent.kAddSection:
        return this.builder.addSection(tick);
      case EventLaneEvent.kRemoveSection:
        return this.builder.removeSection(tick);
      case EventLaneEvent.kAddSectionLength:
        return this.builder.addSectionLength(tick);
      case EventLaneEvent.kSubSectionLength:
        return this.builder.subSectionLength(tick);
      case EventLaneEvent.kMoveSection:
        return this.builder.moveSection(tick, value ?? 0);
      case EventLaneEvent.kToggleSectionType:
        return this.builder.toggleSectionType(tick);
      case EventLaneEvent.kAddAppeal:
        return this.builder.addAppeal(tick);
      case EventLaneEvent.kRemoveAppeal:
        return this.builder.removeAppeal(tick);
      case EventLaneEvent.kMoveAppeal:
        return this.builder.moveAppeal(tick, value ?? 0);
      case EventLaneEvent.kAddFever:
        return this.builder.addFever(tick);
      case EventLaneEvent.kRemoveFever:
        return this.builder.removeFever(tick);
      case EventLaneEvent.kMoveFever:
        return this.builder.moveFever(tick, value ?? 0);
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
    const lengthSec = this.scoreUtility.durationSec();
    const diffSec =
      -Math.sign(pointer.deltaY) *
      this.scoreUtility.durationByTick(this.builder.score.info.resolution);

    this.elapsedSec = Phaser.Math.Clamp(this.elapsedSec + diffSec, 0, lengthSec);

    // Videoの再生位置を連動させる
    if (!this.videoController.isPlaying) {
      this.videoController.elapsedSec = this.elapsedSec;
    }
  }

  private onDrageBgEvent(pointer: Phaser.Input.Pointer, elapsedAtDragStart: number) {
    const dragStartTick = this.scoreUtility.tickByDuration(elapsedAtDragStart);
    const currentTick = this.scoreUtility.tickByDuration(this.elapsedSec);
    const diffTickByDrag =
      -Math.floor((pointer.downY - pointer.worldY) / EditorConstants.CellSize) *
      (this.builder.score.info.resolution / 4);
    const processedTick = currentTick - dragStartTick;

    const diffSec = this.scoreUtility.durationByTick(diffTickByDrag - processedTick);
    const durationSec = this.scoreUtility.durationSec();
    this.elapsedSec = Phaser.Math.Clamp(this.elapsedSec + diffSec, 0, durationSec);

    // Videoの再生位置を連動させる
    if (!this.videoController.isPlaying) {
      this.videoController.elapsedSec = this.elapsedSec;
    }
  }

  private onVideoStateChange(event: YT.PlayerState) {
    if (event == YT.PlayerState.PAUSED) {
      this.elapsedSec = this.videoController.elapsedSec;
    }
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
