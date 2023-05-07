import {DebugGui} from '@/Debug/DebugGui';
import Phaser from 'phaser';

class DebugScenes {
  private game: Phaser.Game;

  constructor(game: Phaser.Game) {
    const sceneNames = Object.keys(game.scene.keys);
    this.game = game;

    const guiParam = {sceneName: sceneNames[0] ?? ''};

    DebugGui.createGui('Scenes', (gui) => {
      gui.add(guiParam, 'sceneName', sceneNames).onChange((v: string) => {
        this.startScene(v);
      });
    });
  }

  destory() {
    DebugGui.deleteGui('Scenes');
  }

  private startScene(key: string, param?: object) {
    this.game.scene.scenes.forEach((sceneKey) => {
      this.game.scene.stop(sceneKey);
    });
    this.game.scene.start(key, param);
  }
}

export class DebugSandBoxScene extends Phaser.Scene {
  private debug?: DebugScenes;

  constructor() {
    super(DebugSandBoxScene.name);
  }

  init() {
    this.debug ??= new DebugScenes(this.game);
  }

  create() {
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, 'Hello, World', {
        fontSize: '48px',
        color: 'black',
      })
      .on('pointerdown', () => {
        console.log('DebugSandBoxScene onpointerdown');
      })
      .setOrigin(0.5, 0.5)
      .setInteractive();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      console.log('DebugSandBoxScene shutdown');
    });

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      console.log('DebugSandBoxScene destroy');

      this.debug?.destory();
    });
  }
}
