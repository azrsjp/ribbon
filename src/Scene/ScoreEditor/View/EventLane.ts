import {EditorConstants} from '@/Scene/ScoreEditor/EditorConstants';
import {Amson} from '@/Score/ScoreTypes';
import {ScoreUtility} from '@/Score/ScoreUtility';
import Phaser from 'phaser';

export enum EventLaneEvent {
  kAddSection,
  kRemoveSection,
  kAddSectionLength,
  kSubSectionLength,
  kMoveSection,
  kToggleSectionType,
  kAddAppeal,
  kRemoveAppeal,
  kMoveAppeal,
  kAddFever,
  kRemoveFever,
  kMoveFever,
}

const colorSection = 0x22a8f5;
const colorAppeal = 0xff7f50;
const colorFever = 0x9acd32;

export class EventLane extends Phaser.GameObjects.Container {
  private amson: Amson.Structure;
  private socoreUtility: ScoreUtility;
  private onEvent?: (event: EventLaneEvent, tick: number, value?: number) => boolean;
  private elapsedSec = 0;

  private sections: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, number][] = [];
  private appeals: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, number][] = [];
  private fevers: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, number][] = [];
  private cursorRect?: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, EventLaneEvent];

  constructor(scene: Phaser.Scene, x: number, y: number, amson: Amson.Structure) {
    super(scene, x, y);

    this.amson = amson;
    this.socoreUtility = new ScoreUtility(amson);
    this.width = EditorConstants.CellSize * 2;
    this.height = EditorConstants.CellSize * EditorConstants.CellCount;

    this.createObjects();
    this.updateScroll();
  }

  setOnEvent(onEvent: (event: EventLaneEvent, tick: number, value?: number) => boolean) {
    this.onEvent = onEvent;
  }

  scroll(elapsedSec: number) {
    this.elapsedSec = elapsedSec;
    this.updateScroll();
  }

  sectionPutMode() {
    this.toPutMode(
      EventLaneEvent.kAddSection,
      'Putting Section',
      this.tickToLenght(EditorConstants.DefaultSectionBar * this.amson.info.resolution * 4),
      Phaser.Display.Color.ValueToColor(colorSection).darken(30).color
    );
  }

  appealPutMode() {
    this.toPutMode(
      EventLaneEvent.kAddAppeal,
      'Putting Appeal',
      this.tickToLenght(this.appealTick()),
      Phaser.Display.Color.ValueToColor(colorAppeal).darken(30).color
    );
  }

  feverPutMode() {
    this.toPutMode(
      EventLaneEvent.kAddFever,
      'Putting Fever',
      this.tickToLenght(this.feverTick()),
      Phaser.Display.Color.ValueToColor(colorFever).darken(30).color
    );
  }

  clearPutMode() {
    if (this.cursorRect != null) {
      this.cursorRect[0].destroy();
      this.cursorRect[1].destroy();
      this.cursorRect = undefined;
    }
  }

  private toPutMode(event: EventLaneEvent, tagName: string, height: number, color: number) {
    this.clearPutMode();

    const cursor = this.scene.add.rectangle(0, 0, this.width, height, color).setOrigin(0, 1);
    const tagText = this.createTagText(tagName);

    this.cursorRect = [cursor, tagText, event];
    this.add([cursor, tagText]);
  }

  private updateScroll() {
    const apply = (
      object: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, number],
      tick: number,
      lengthTick: number
    ) => {
      object[0].height = this.tickToLenght(lengthTick);
      object[0].input?.hitArea.setTo(0, 0, object[0].displayWidth, object[0].displayHeight);
      object[0].setY(this.calcObjectY(tick));
      object[0].setOrigin(0, 1);
      object[0].setVisible(true);

      object[1].height = this.tickToLenght(lengthTick);
      object[1].setY(this.calcObjectY(tick) - 16);
      object[1].setVisible(true);

      object[2] = tick;
    };

    this.sections.forEach((section, i) => {
      const sectionInfo = this.amson.sections.at(i);
      sectionInfo != null
        ? apply(section, sectionInfo.tick, sectionInfo.lengthTick)
        : section[0].setVisible(false) && section[1].setVisible(false);
    });

    this.appeals.forEach((appeal, i) => {
      const appealInfo = this.amson.appeals.at(i);
      appealInfo != null
        ? apply(appeal, appealInfo.tick, this.appealTick())
        : appeal[0].setVisible(false) && appeal[1].setVisible(false);
    });

    this.fevers.forEach((fever, i) => {
      const feverInfo = this.amson.fevers.at(i);
      feverInfo != null
        ? apply(fever, feverInfo.tick, this.feverTick())
        : fever[0].setVisible(false) && fever[1].setVisible(false);
    });
  }

  private createObjects() {
    // マスクがコンテナの座標offsetを考慮しないのでlaneBgだけはこのコンテナにaddしないでポジションの手動設定をする
    // this.maskは継承元の要素です
    this.mask = this.scene.add
      .rectangle(this.x, this.y, this.width, this.height, 0xfffffff)
      .setOrigin(0, 0)
      .setAlpha(0.85)
      .setInteractive({
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      })
      .on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMoveBg.bind(this))
      .on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDownBg.bind(this))
      .createGeometryMask();

    for (let i = 0; i < Amson.Constants.SectionMax; ++i) {
      let dragStartTick = 0;

      const sectionRect = this.scene.add
        .rectangle(0, 0, this.width, 1, colorSection)
        .on(Phaser.Input.Events.POINTER_WHEEL, (event: Phaser.Input.Pointer) => {
          this.onPointerWheelSection(event, this.sections[i][2]);
        })
        .on(Phaser.Input.Events.POINTER_DOWN, (event: Phaser.Input.Pointer) => {
          this.onPointerDownSection(event, this.sections[i][2]);
        })
        .on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer) => {
          dragStartTick = this.sections[i][2];
        })
        .on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer) => {
          this.onDragObject(pointer, dragStartTick, this.sections[i], EventLaneEvent.kMoveSection);
        })
        .setInteractive({
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
          draggable: true,
        });
      const tagText = this.createTagText('Section');
      this.sections.push([sectionRect, tagText, 0]);
    }
    for (let i = 0; i < Amson.Constants.AppealMax; ++i) {
      let dragStartTick = 0;

      const appealRect = this.scene.add
        .rectangle(0, 0, this.width, 1, colorAppeal)
        .on(Phaser.Input.Events.POINTER_DOWN, (event: Phaser.Input.Pointer) => {
          this.onPointerDownAppeal(event, this.appeals[i][2]);
        })
        .on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer) => {
          dragStartTick = this.appeals[i][2];
        })
        .on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer) => {
          this.onDragObject(pointer, dragStartTick, this.appeals[i], EventLaneEvent.kMoveAppeal);
        })
        .setInteractive({
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
          draggable: true,
        });
      const tagText = this.createTagText('Appeal');
      this.appeals.push([appealRect, tagText, 0]);
    }
    for (let i = 0; i < Amson.Constants.FeverMax; ++i) {
      let dragStartTick = 0;

      const feverRect = this.scene.add
        .rectangle(0, 0, this.width, 1, colorFever)
        .on(Phaser.Input.Events.POINTER_DOWN, (event: Phaser.Input.Pointer) => {
          this.onPointerDownFever(event, this.fevers[i][2]);
        })
        .on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer) => {
          dragStartTick = this.fevers[i][2];
        })
        .on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer) => {
          this.onDragObject(pointer, dragStartTick, this.fevers[i], EventLaneEvent.kMoveFever);
        })
        .setInteractive({
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
          draggable: true,
        });
      const tagText = this.createTagText('Fever');
      this.fevers.push([feverRect, tagText, 0]);
    }

    this.add([
      ...this.sections.map((e) => e[0]),
      ...this.sections.map((e) => e[1]),
      ...this.appeals.map((e) => e[0]),
      ...this.appeals.map((e) => e[1]),
      ...this.fevers.map((e) => e[0]),
      ...this.fevers.map((e) => e[1]),
    ]);
    this.scene.add.existing(this);
  }

  private createTagText(tagText: string) {
    return this.scene.add
      .text(this.width * 0.5, 0, tagText, {
        color: '#ffffff',
        fontSize: 32,
      })
      .setOrigin(1, 0.5)
      .setAngle(90);
  }

  private calcObjectY(tick: number) {
    const currentTick = this.socoreUtility.tickByDuration(this.elapsedSec);
    const offsetY =
      this.height - (tick - currentTick) / ((this.amson.info.resolution * 4 * 4) / this.height);

    return offsetY;
  }

  private appealTick() {
    return this.socoreUtility.tickByDuration(Amson.Constants.AppealDuationSec);
  }

  private feverTick() {
    return this.socoreUtility.tickByDuration(Amson.Constants.FeverDuraionSec);
  }

  private tickToLenght(tick: number) {
    return (tick / (this.amson.info.resolution / 4)) * EditorConstants.CellSize;
  }

  private snappedTick(y: number) {
    const tickCurrent = this.socoreUtility.tickByDuration(this.elapsedSec);
    const tick4Bars = this.amson.info.resolution * 4 * 4;
    const cellTick = this.amson.info.resolution / 4;

    const mouseTick = tickCurrent + tick4Bars * (y / this.height);
    const snappedTick = Math.floor(mouseTick / cellTick) * cellTick;
    return snappedTick;
  }

  private snappedY(y: number) {
    const tickCurrent = this.socoreUtility.tickByDuration(this.elapsedSec);
    const tick4Bars = this.amson.info.resolution * 4 * 4;
    const snappedTick = this.snappedTick(y);
    const offsetY = this.height - this.height * ((snappedTick - tickCurrent) / tick4Bars);
    return offsetY;
  }

  private onPointerMoveBg(event: Phaser.Input.Pointer) {
    if (this.cursorRect != null) {
      const y = this.y + this.height - event.y;
      this.cursorRect[0].y = this.snappedY(y);
      this.cursorRect[1].y = this.snappedY(y) - 16;
    }
  }

  private onPointerDownBg(event: Phaser.Input.Pointer) {
    // 配置モードのとき、確定できるならば確定する
    if (event.leftButtonDown()) {
      if (this.cursorRect != null && this.onEvent != null) {
        const y = this.y + this.height - event.y;
        const tick = this.snappedTick(y);

        const putSuccess = this.onEvent(this.cursorRect[2], tick);
        if (putSuccess) {
          this.clearPutMode();
        }
      }
    }
  }

  private onPointerWheelSection(pointer: Phaser.Input.Pointer, tick: number) {
    if (this.onEvent != null) {
      const event =
        Math.sign(pointer.deltaY) >= 0
          ? EventLaneEvent.kSubSectionLength
          : EventLaneEvent.kAddSectionLength;

      this.onEvent(event, tick);
    }
  }

  private onDragObject(
    pointer: Phaser.Input.Pointer,
    dragStartAtTick: number,
    target: [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, number],
    event: EventLaneEvent
  ) {
    const diffTickByDrag =
      Math.floor((pointer.downY - pointer.worldY) / EditorConstants.CellSize) *
      (this.amson.info.resolution / 4);

    if (this.onEvent != null) {
      const currentTick = target[2];
      const processedTick = currentTick - dragStartAtTick; // すでにドラッグが反映されている分は余計なので除外
      if (this.onEvent(event, currentTick, diffTickByDrag - processedTick)) {
        target[2] = currentTick + diffTickByDrag - processedTick;
      }
    }
  }

  private onPointerDownSection(pointer: Phaser.Input.Pointer, tick: number) {
    if (pointer.rightButtonDown()) {
      if (this.onEvent != null) {
        this.onEvent(EventLaneEvent.kRemoveSection, tick);
      }
    }
    if (pointer.middleButtonDown()) {
      if (this.onEvent != null) {
        this.onEvent(EventLaneEvent.kToggleSectionType, tick);
      }
    }
  }

  private onPointerDownAppeal(pointer: Phaser.Input.Pointer, tick: number) {
    if (pointer.rightButtonDown()) {
      if (this.onEvent != null) {
        this.onEvent(EventLaneEvent.kRemoveAppeal, tick);
      }
    }
  }

  private onPointerDownFever(pointer: Phaser.Input.Pointer, tick: number) {
    if (pointer.rightButtonDown()) {
      if (this.onEvent != null) {
        this.onEvent(EventLaneEvent.kRemoveFever, tick);
      }
    }
  }
}
