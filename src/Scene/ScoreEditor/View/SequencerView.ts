import {Amson} from '@/Score/ScoreTypes';
import Phaser from 'phaser';

const kCellSize = 28;
const kCellCount = 64; // 4/4小節における4小節を考え、1拍あたり4分割する
const kNoteColors = new Map<Amson.NoteType, number[]>([
  [Amson.NoteType.Left, [0x9acd32, 0xc3e084]], // 通常ノーツの色、ロングノーツの持続色
  [Amson.NoteType.Up, [0xff6347, 0xffb5a8]],
  [Amson.NoteType.Right, [0xdaa520, 0xeac775]],
]);

export enum SequencerEvent {
  kAddNote,
  kRemoveNote,
  kToggleNote,
  kAddLength,
  kSubLength,
}

export class SequencerView extends Phaser.GameObjects.Container {
  private amson: Amson.Structure;
  private elapsed = 0;
  private isEditMode = false;
  private callback?: (event: SequencerEvent, tick: number) => void = undefined;

  private cellRects = new Array<Phaser.GameObjects.Rectangle>();
  private barLines = new Array<Phaser.GameObjects.Line>();
  private beatLines = new Array<Phaser.GameObjects.Line>();
  private barNumberTexts = new Array<Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, x: number, y: number, amson: Amson.Structure) {
    super(scene, x, y);

    this.amson = amson;
    this.width = 128;
    this.height = kCellSize * kCellCount;

    this.createObjects();
    this.updateScroll();
  }

  static get fixedWidth() {
    return kCellSize;
  }

  static get fixedHeight() {
    return kCellSize * kCellCount;
  }

  scroll(elapsed: number) {
    this.elapsed = elapsed;
    this.updateScroll();
  }

  setEditMode(isEditMode: boolean) {
    this.isEditMode = isEditMode;
  }

  setCallback(callback: (event: SequencerEvent, tick: number) => void) {
    this.callback = callback;
  }

  private updateScroll() {
    this.cellRects.forEach((cell, i) => {
      cell.fillColor = i % 2 === 0 ? 0xcccccc : 0xdddddd; // 一旦色をクリア

      const tick = this.calcTick(i);
      const note = this.findNote(tick);
      if (note != null) {
        const isLongNoteTail = note.tick != tick;
        cell.fillColor = kNoteColors.get(note.type)?.at(isLongNoteTail ? 1 : 0) ?? 0x999999;
      }
      cell.setY(this.calcObjectY(i, kCellSize, kCellSize, 0));
    });

    this.beatLines.forEach((line, i) => {
      line.setY(this.calcObjectY(i, 0, 4 * kCellSize, -1));
    });

    this.barLines.forEach((line, i) => {
      line.setY(this.calcObjectY(i, 0, 16 * kCellSize, -1));
    });

    this.barNumberTexts.forEach((text, i) => {
      // 小節数のテキストを更新(indexはオフセットするので配列へ直接アクセスする)
      const currentBar = Math.ceil(this.elapsed / (60 / this.amson.info.bpm) / 4);
      const index = (i + currentBar) % this.barNumberTexts.length;
      this.barNumberTexts[index].text = (currentBar + i + 1).toString();

      text.setY(this.calcObjectY(i, 0, 16 * kCellSize, -1));
    });
  }

  private calcObjectY(index: number, height: number, interval: number, offset: number): number {
    const originY = this.height - interval * index - height; // 各オブジェクトの初期配置のY座標
    const cellDuration = 60 / this.amson.info.bpm / 4; // セル1つあたりにかかる時間(sec)
    const scrollLength = (this.elapsed / cellDuration) * kCellSize + offset; // 経過時間時点でスクロールしている量(px)

    const laneYFrom = -height * 2;
    const laneYTo = this.height;

    return ((originY + scrollLength - laneYFrom) % (laneYTo - laneYFrom)) + laneYFrom;
  }

  private calcTick(cellIndex: number) {
    const cellDuration = 60 / this.amson.info.bpm / 4;
    const frontCellNumber = Math.floor(this.elapsed / cellDuration);
    const tick =
      (((cellIndex + this.cellRects.length - (frontCellNumber % this.cellRects.length)) %
        this.cellRects.length) +
        frontCellNumber) *
      (this.amson.info.resolution / 4);

    return tick;
  }

  private findNote(tick: number) {
    return this.amson.notes.find((note) => {
      return note.tick <= tick && tick <= note.tick + note.length;
    });
  }

  private createObjects() {
    const offsetX = (this.width - kCellSize) * 0.5;

    // マスクがコンテナの座標offsetを考慮しないのでlaneBgだけはこのコンテナにaddしないでポジションの手動設定をする
    const mask = this.scene.add
      .rectangle(this.x, this.y, this.width, this.height, 0xfffffff)
      .setOrigin(0, 0)
      .setAlpha(0.85)
      .createGeometryMask();

    // セルの生成(スクロールするので2色分の余分なセルが必要。)
    for (let i = 0; i < kCellCount + 2; i++) {
      const cell = this.scene.add
        .rectangle(offsetX, 0, kCellSize, kCellSize, i % 2 == 0 ? 0xcccccc : 0xdddddd)
        .setOrigin(0)
        .on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
          if (this.isEditMode && this.callback != null) {
            if (pointer.leftButtonDown()) {
              this.callback(SequencerEvent.kAddNote, this.calcTick(i));
            }
            if (pointer.rightButtonDown()) {
              this.callback(SequencerEvent.kRemoveNote, this.calcTick(i));
            }
            if (pointer.middleButtonDown()) {
              this.callback(SequencerEvent.kToggleNote, this.calcTick(i));
            }
          }
        })
        .on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer) => {
          if (this.isEditMode && this.callback != null) {
            const event =
              Math.sign(pointer.deltaY) >= 0
                ? SequencerEvent.kSubLength
                : SequencerEvent.kAddLength;
            this.callback(event, this.calcTick(i));
          }
        })
        .setInteractive({
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        })
        .setMask(mask);

      this.cellRects.push(cell);
    }

    // 一拍ごとの細い線を生成
    for (let i = 0; i < 16; ++i) {
      const beatLine = this.scene.add
        .line(offsetX, 0, 0, 0, kCellSize + 16, 0, 0x666666)
        .setLineWidth(3)
        .setOrigin(0)
        .setMask(mask);
      this.beatLines.push(beatLine);
    }

    // 1小節ごとの太い線を生成
    for (let i = 0; i < 4; ++i) {
      const barline = this.scene.add
        .line(offsetX, 0, 0, 0, kCellSize + 32, 0, 0x333333)
        .setLineWidth(5)
        .setOrigin(0)
        .setMask(mask);
      this.barLines.push(barline);
    }

    // 小節数を表示するテキストを生成
    for (let i = 0; i < 4; ++i) {
      const barNumberText = this.scene.add
        .text(offsetX + 44, 0, '', {font: '32px Arial', color: '#333333'})
        .setOrigin(0.5, 1)
        .setMask(mask);
      this.barNumberTexts.push(barNumberText);
    }

    this.add([...this.cellRects, ...this.beatLines, ...this.barLines, ...this.barNumberTexts]);
    this.scene.add.existing(this);
  }
}
