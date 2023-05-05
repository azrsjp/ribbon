import Phaser from 'phaser';

const width = 608;
const height = 1080;

class TestScene extends Phaser.Scene {
  constructor() {
    super('testScene');
  }
  preload() {
    //
  }

  create() {
    this.add
      .text(width * 0.5, height * 0.5, 'Hello, world!')
      .setOrigin(0.5, 0.5)
      .setColor('black')
      .setFontSize('18px');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    width: width,
    height: height,
    parent: 'app',
  },
  disableContextMenu: true,
  backgroundColor: 0xdddddd,
  scene: [TestScene],
});
