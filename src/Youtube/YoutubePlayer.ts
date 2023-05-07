import Phaser from 'phaser';
import css from './YoutubePlayer.module.css';

// Dynamic loading Youtube IframeAPI
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';

const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

// Will be fired automatically on loaded YoutubeAPI
declare global {
  interface Window {
    onYouTubeIframeAPIReady(): void;
  }
}

Window.prototype.onYouTubeIframeAPIReady = () => {
  console.log('[YoutubeAPI] onYoutubeIframeAPIReady');
  isYoutubePrepared = true;
};

let isYoutubePrepared = false;
const PlayerIDPrefix = 'youtube-player';
const PlayerActivatorIDPrefix = 'youtube-player-activator';

export class YoutubePlayer {
  private uuid: string;
  private isPlayerReady: boolean;
  private player?: YT.Player;
  private playerElm?: HTMLDivElement;
  private playerActivatorElm?: HTMLButtonElement;
  private requestAnimationID?: number;

  static get isPrepared(): boolean {
    return isYoutubePrepared;
  }

  constructor() {
    this.uuid = Phaser.Utils.String.UUID();
    this.isPlayerReady = false;
  }

  get isReady(): boolean {
    return this.isPlayerReady;
  }

  createPlayer(
    videoId: string,
    onReady?: () => void,
    onStateChange?: (event: YT.PlayerState) => void
  ) {
    if (this.player) {
      this.deletePlayer();
    }

    // Prepare DOM for Youtube Player
    const playerId = PlayerIDPrefix + this.uuid;
    const playerActivatorId = PlayerActivatorIDPrefix + this.uuid;
    this.createDOM(playerId, playerActivatorId);
    this.startFadeAnimation();

    // Replace target dom with iframe contains a video
    this.player = new YT.Player(playerId, {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        iv_load_policy: 3,
        loop: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          this.onPlayerReady();
          if (onReady) {
            onReady();
          }
        },
        onStateChange: (evt) => {
          this.onPlayerStateChange(evt);
          if (onStateChange) {
            onStateChange(evt.data);
          }
        },
        onError: (evt) => {
          this.onPlyerError(evt);
        },
      },
    });
  }

  deletePlayer() {
    this.stopFadeAnimation();
    this.requestAnimationID = undefined;
    this.isPlayerReady = false;

    this.player?.destroy();
    this.player = undefined;

    this.playerElm?.remove();
    this.playerElm = undefined;

    this.playerActivatorElm?.remove();
    this.playerActivatorElm = undefined;
  }

  cueVideoById(id: string) {
    if (this.isPlayerReady) {
      this.player?.cueVideoById(id);
    }
  }

  playVideo() {
    if (this.isPlayerReady) {
      this.player?.playVideo();
    }
  }

  pauseVideo() {
    if (this.isPlayerReady) {
      this.player?.pauseVideo();
    }
  }

  setVideoSize(width: number, height: number) {
    if (this.isPlayerReady) {
      this.player?.setSize(width, height);
    }
    if (this.playerActivatorElm) {
      this.playerActivatorElm.style.width = width + 'px';
      this.playerActivatorElm.style.height = height + 'px';
    }
  }

  seekTo(seconds: number, allowSeekAhead: boolean) {
    if (this.isPlayerReady) {
      this.player?.seekTo(seconds, allowSeekAhead);
    }
  }

  getCurrentTime(): number {
    if (this.isPlayerReady) {
      return this.player?.getCurrentTime() ?? 0;
    }
    return 0;
  }

  getDuration(): number {
    if (this.isPlayerReady) {
      return this.player?.getDuration() ?? 0;
    }
    return 0;
  }

  getPlayerState(): YT.PlayerState {
    if (this.isPlayerReady) {
      return this.player?.getPlayerState() ?? YT.PlayerState.UNSTARTED;
    }
    return YT.PlayerState.UNSTARTED;
  }

  private startFadeAnimation() {
    this.stopFadeAnimation();
    this.requestAnimationID = window.requestAnimationFrame(this.fadeAnimationLoop.bind(this));
  }

  private stopFadeAnimation() {
    if (this.requestAnimationID) {
      window.cancelAnimationFrame(this.requestAnimationID);
      this.requestAnimationID = undefined;
    }
  }

  private fadeAnimationLoop() {
    if (this.isPlayerReady) {
      const safeOffsetMs = 1.2;
      const fadeDuration = 1.0;

      // FadeIn around start point of movie duration.
      const fadeInOpacity = Math.min(
        Math.max((this.getCurrentTime() - safeOffsetMs) / fadeDuration, 0.0),
        1.0
      );
      // FadeOut around end point of movie duration
      const fadeOutOpacity = Math.min(
        Math.max((this.getDuration() - safeOffsetMs - this.getCurrentTime()) / fadeDuration, 0.0),
        1.0
      );
      const opacityAtCurrentTime = Math.min(fadeInOpacity, fadeOutOpacity);

      if (this.player) {
        this.player.getIframe().style.opacity = opacityAtCurrentTime.toString();
      }
    }
    this.requestAnimationID = window.requestAnimationFrame(this.fadeAnimationLoop.bind(this));
  }

  private createDOM(playerId: string, playerActivatorId: string) {
    // element for Youtube iframe auto insertion(identified by id)
    this.playerElm = document.createElement('div');
    this.playerElm.className = css.player;
    this.playerElm.id = playerId;

    // XXX: On mobile HTML5 video api dont allow to play its by called api programmatically.
    // Because user's voluntary operation to play(tap play button) is required at least once,
    // overlay transparent button to be tapped by user unconsciously, and play and pause in a very short time
    this.playerActivatorElm = document.createElement('button');
    this.playerActivatorElm.className = css.playerActivator;
    this.playerActivatorElm.id = playerActivatorId;
    this.playerActivatorElm.onclick = () => this.onClickedPlayerActivator();

    const body = document.querySelector('body');
    body?.appendChild(this.playerElm);
    body?.appendChild(this.playerActivatorElm);
  }

  private onClickedPlayerActivator() {
    if (this.isPlayerReady) {
      // Impersonate the user's execution:
      // play and pause in the context of tapped transparent play button
      this.playVideo();
      this.pauseVideo();

      // This button will be unnecessary so erase it
      this.playerActivatorElm?.remove();
      this.playerActivatorElm = undefined;
    }
  }

  private onPlayerReady() {
    console.log('[YoutubeAPI] onPlayerReady');
    this.isPlayerReady = true;
  }

  private onPlayerStateChange(event: YT.OnStateChangeEvent) {
    const statusString = ((state: YT.PlayerState) => {
      switch (state) {
        case YT.PlayerState.UNSTARTED:
          return 'UNSTARTED';
        case YT.PlayerState.ENDED:
          return 'ENDED';
        case YT.PlayerState.PLAYING:
          return 'PLAYING';
        case YT.PlayerState.PAUSED:
          return 'PAUSED';
        case YT.PlayerState.BUFFERING:
          return 'BUFFERING';
        case YT.PlayerState.CUED:
          return 'CUED';
        default:
          return 'UNKNOWN';
      }
    })(event.data);

    console.log('[YoutubeAPI] onPlayerStateChange' + ' -> ' + statusString);
  }

  private onPlyerError(event: YT.OnErrorEvent) {
    console.log('[YoutubeAPI] onPlyerError');

    const errorString = ((errorNo: number) => {
      switch (errorNo) {
        case YT.PlayerError.InvalidParam:
          return '動画IDのフォーマットが不正です';
        case YT.PlayerError.Html5Error:
          return 'HTMLのプレイヤーで再生できない動画の可能性があります';
        case YT.PlayerError.VideoNotFound:
          return '読み込もうとした動画が削除されたか非公開にされた可能性があります';
        case YT.PlayerError.EmbeddingNotAllowed:
        case YT.PlayerError.EmbeddingNotAllowed2:
          return '動画が存在しない可能性があります';
        default:
          return '不明なエラーです';
      }
    })(event.data);

    alert('エラー: ' + errorString);
  }
}
