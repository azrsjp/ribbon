import {
  BoolStorage,
  ClearAllLocalStorageInApp,
  NumberStorage,
  ObjectStorage,
  StringStorage,
} from '@/Storage/LocalStorageAPI';
import Phaser from 'phaser';

class TestUserStorage {
  static ClearAll = ClearAllLocalStorageInApp;

  static testBool = new BoolStorage('testBool');
  static testString = new StringStorage('testString');
  static testNumber = new NumberStorage('testNumber');
  static testObject = new ObjectStorage<{test: number}>('testObject');
}

export class DebugLocalStorageScene extends Phaser.Scene {
  private valueText?: Phaser.GameObjects.Text;

  constructor() {
    super(DebugLocalStorageScene.name);
  }

  create() {
    this.add
      .text(0, 0, 'SetValue', {fontSize: '32px', color: 'black'})
      .on('pointerdown', () => {
        TestUserStorage.testBool.value = true;
        TestUserStorage.testString.value = 'hello';
        TestUserStorage.testNumber.value = 100.55;
        TestUserStorage.testObject.value = {test: 500};
        this.renderValue();
      })
      .setInteractive();

    this.add
      .text(0, 32, 'Clear', {fontSize: '32px', color: 'black'})
      .on('pointerdown', () => {
        TestUserStorage.ClearAll();
        this.renderValue();
      })
      .setInteractive();

    this.valueText = this.add.text(0, 64, '', {
      fontSize: '32px',
      color: 'black',
    });

    this.renderValue();
  }

  private renderValue() {
    const text = `
    testBool: ${TestUserStorage.testBool.value}
    testString: ${TestUserStorage.testString.value}
    testNumber: ${TestUserStorage.testNumber.value}
    testObject: ${TestUserStorage.testObject.value.test}
    `;

    this.valueText?.setText(text);
  }
}
