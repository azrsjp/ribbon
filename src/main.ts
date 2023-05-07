import Phaser from 'phaser';

import {DebugLocalStorageScene} from '@/Scene/Debug/DebugLocalStorageScene';
import {DebugSandBoxScene} from '@/Scene/Debug/DebugSandboxScene';
import {DebugYoutubeScene} from '@/Scene/Debug/DebugYoutubeScene';

const width = 1080;
const height = 1920;

// 本番用シーンの登録
let sceneList: Phaser.Types.Scenes.SceneType[] = [];

// デバッグ用シーンの登録
if (import.meta.env.DEV) {
  sceneList = [DebugSandBoxScene, DebugLocalStorageScene, DebugYoutubeScene, ...sceneList];
}

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    width: width,
    height: height,
    parent: 'app',
    mode: Phaser.Scale.ScaleModes.FIT,
  },
  pixelArt: false,
  disableContextMenu: true,
  transparent: true,
  scene: sceneList,
});
