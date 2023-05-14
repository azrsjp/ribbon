import Phaser from 'phaser';

export class ImageUtil {
  static setSize(target: Phaser.GameObjects.Image, width: number, height: number) {
    this.setWidth(target, width);
    this.setHeight(target, height);
  }

  static setWidth(target: Phaser.GameObjects.Image, width: number) {
    const originalWidth = target.width;
    const scaleX = width / originalWidth;
    target.setScale(scaleX, target.scaleY);
  }

  static setHeight(target: Phaser.GameObjects.Image, height: number) {
    const originalHeight = target.height;
    const scaleY = height / originalHeight;
    target.setScale(target.scaleX, scaleY);
  }
}
