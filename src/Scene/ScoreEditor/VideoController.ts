import {DebugGui} from '@/Debug/DebugGui';
import {Metronome} from '@/Scene/ScoreEditor/Metronome';
import {Amson} from '@/Score/ScoreTypes';
import {YoutubePlayer} from '@/Youtube/YoutubePlayer';

const kLilGuiTitle = 'VideoControl';

export class VideoController {
  private amson: Amson.Structure;
  private metronome: Metronome;
  private player: YoutubePlayer = new YoutubePlayer();
  private playMetoronome = true;
  private onMetronome?: () => void = undefined;

  constructor(amson: Amson.Structure) {
    this.amson = amson;
    this.metronome = new Metronome(amson.info.bpm, amson.info.startAtMs);
  }

  terminate() {
    this.terminatePlayer();
  }

  loadVideo(width: number, height: number) {
    this.player.createPlayer(this.amson.info.mvId, () => {
      this.player.setVideoSize(width, height);

      this.metronome = new Metronome(this.amson.info.bpm, this.amson.info.startAtMs);
      this.metronome.setCurrent(this.player.getCurrentTime());

      this.initializePlayer();
    });
  }

  setOnMetronome(onMetronome: () => void) {
    this.onMetronome = onMetronome;
  }

  update() {
    if (!this.player.isReady) {
      return;
    }
    if (this.player.getPlayerState() != YT.PlayerState.PLAYING) {
      return;
    }
    // endAtを超えていたら動画を停止
    if (this.amson.info.endAtMs <= this.player.getCurrentTime() * 1000) {
      this.player.pauseVideo();
    }
    // メトロノーム音発火タイミングか否か？
    const timingTick = this.metronome.tick(this.player.getCurrentTime() * 1000);
    if (timingTick && this.playMetoronome && this.onMetronome != null) {
      this.onMetronome();
    }
  }

  get isPlaying(): boolean {
    if (!this.player.isReady) {
      return false;
    }
    return this.player.getPlayerState() === YT.PlayerState.PLAYING;
  }

  get elapsedSec(): number {
    return Math.max(0, this.currentTime - this.amson.info.startAtMs / 1000);
  }

  private get currentTime(): number {
    return this.player.getCurrentTime();
  }

  private set currentTime(value: number) {
    this.player.seekTo(value, true);
  }

  private play() {
    this.player.playVideo();
  }

  private pause() {
    this.player.pauseVideo();
  }

  private stop() {
    this.player.seekTo(this.amson.info.startAtMs / 1000, true);
    this.player.pauseVideo();

    this.metronome.setCurrent(this.amson.info.startAtMs);
  }

  private initializePlayer() {
    DebugGui.createGui(kLilGuiTitle, (gui) => {
      gui
        .add(this, 'currentTime', 0, this.player.getDuration())
        .listen()
        .step(0.001)
        .onChange(() => {
          this.pause();
        })
        .onFinishChange((value: number) => {
          this.metronome.setCurrent(value * 1000);
        });
      gui.add(this, 'playMetoronome');
      gui.add(this, 'play');
      gui.add(this, 'pause');
      gui.add(this, 'stop');
    });
  }

  private terminatePlayer() {
    DebugGui.deleteGui(kLilGuiTitle);
  }
}
