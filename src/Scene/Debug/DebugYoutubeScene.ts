import {DebugGui} from '@/Debug/DebugGui';
import {YoutubePlayer} from '@/Youtube/YoutubePlayer';
import {Controller} from 'lil-gui';
import Phaser from 'phaser';

const testVideoIds = ['F-F4CZoUoxg', '0NwfGNhQSVg', 'IZnrdGkG9yo', 'lJm-o5fxwU4'];

class DebugPlayer {
  private player: YoutubePlayer;
  private controller?: Controller;
  private videoId: string;

  constructor(player: YoutubePlayer) {
    this.player = player;
    this.videoId = testVideoIds[0];

    DebugGui.createGui(DebugYoutubeScene.name, (gui) => {
      this.controller = gui
        .add(this, 'currentTime', 0, this.player.getDuration())
        .listen()
        .step(0.001)
        .onChange(() => {
          this.player.pauseVideo();
        })
        .onFinishChange(() => {
          this.player.playVideo();
        });
      gui
        .add(this, 'videoId')
        .options(testVideoIds)
        .onFinishChange(() => {
          this.player.cueVideoById(this.videoId);
        });
      gui.add(this, 'play');
      gui.add(this, 'pause');
    });
  }

  terminate() {
    DebugGui.deleteGui(DebugYoutubeScene.name);
  }

  get currentTime(): number {
    return this.player.getCurrentTime();
  }

  set currentTime(value: number) {
    this.player.seekTo(value, true);
  }

  play() {
    this.player.playVideo();

    if (this.controller) {
      this.controller.max(this.player.getDuration());
    }
  }

  pause() {
    this.player.pauseVideo();
  }
}

export class DebugYoutubeScene extends Phaser.Scene {
  private player: YoutubePlayer = new YoutubePlayer();
  private debug?: DebugPlayer;

  constructor() {
    super(DebugYoutubeScene.name);
  }

  init() {
    this.events.once('shutdown', () => this.shutdown());
  }

  create() {
    this.add
      .text(32, 32, 'CreatePlayer', {fontSize: '32px', color: 'black'})
      .on('pointerdown', () => {
        this.createPlayer();
      })
      .setInteractive();

    this.add
      .text(32, 72, 'DeletePlayer', {fontSize: '32px', color: 'black'})
      .on('pointerdown', () => {
        this.deletePlayer();
      })
      .setInteractive();
  }

  private createPlayer() {
    this.player.createPlayer(testVideoIds[0], () => {
      this.debug = new DebugPlayer(this.player);

      this.player.setVideoSize(
        parseInt(this.game.canvas.style.width),
        parseInt(this.game.canvas.style.height)
      );
    });
  }

  private deletePlayer() {
    this.player.deletePlayer();
    this.debug?.terminate();
  }

  private shutdown() {
    this.deletePlayer();
  }
}
