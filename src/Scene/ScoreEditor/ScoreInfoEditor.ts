import {DebugGui} from '@/Debug/DebugGui';
import {SongRecourceList} from '@/Scene/ScoreEditor/SongRecource';
import {Amson} from '@/Score/ScoreTypes';

const kLilGuiTitle = 'ScoreInfo';

const kStageNameLive = 'Live';
const kStageNameFashion = 'Fashion';
const kStageNameDance = 'Dance';

const kStageTypeMap = new Map<string, Amson.StageType>([
  [kStageNameLive, Amson.StageType.Live],
  [kStageNameFashion, Amson.StageType.Fashion],
  [kStageNameDance, Amson.StageType.Dance],
]);

export class ScoreInfoEditor {
  private amson: Amson.Structure;
  private stage: string;
  private onSongChanged?: () => void = undefined;

  constructor(amson: Amson.Structure) {
    this.amson = amson;
    this.stage = kStageNameLive;

    this.initializeScoreInfo();
  }

  terminate() {
    this.terminateScoreInfo();
  }

  setOnSongChanged(onSongChanged: () => void) {
    this.onSongChanged = onSongChanged;
  }

  private initializeScoreInfo() {
    const titles = SongRecourceList.map((e) => e.title);
    const stages = Array.from(kStageTypeMap.keys());

    DebugGui.createGui(kLilGuiTitle, (gui) => {
      gui.add(this.amson.info, 'title', titles).onFinishChange((title: string) => {
        const movieResorce = SongRecourceList.find((e) => e.title === title);
        if (movieResorce != null) {
          // bpmやmvIdなど曲に紐づく情報の更新
          this.amson.info.title = movieResorce.title;
          this.amson.info.mvId = movieResorce.mvId;
          this.amson.info.bpm = movieResorce.bpm;
          this.amson.info.startAtMs = movieResorce.startAtMs;
          this.amson.info.endAtMs = movieResorce.endAtMs;

          // videoの再読み込み要求
          if (this.onSongChanged != null) {
            this.onSongChanged();
          }
        }
      });
      gui.add(this.amson.info, 'level', [1, 2, 3, 4, 5]);
      gui.add(this.amson.info, 'bpm').listen().disable();
      gui.add(this.amson.info, 'resolution').disable();
      gui.add(this, 'stage', stages).onFinishChange((stageName: string) => {
        const stageType = kStageTypeMap.get(stageName);
        if (stageType != null) {
          this.amson.info.stage = stageType;
        }
      });
      gui.add(this.amson.info, 'mvId').listen().disable();
      gui.add(this.amson.info, 'startAtMs').listen();
      gui.add(this.amson.info, 'endAtMs').listen();
      gui.add(this, 'youtube');
      gui.add(this, 'dumpAsLog');
      gui.add(this, 'dumpAsFile');
    });
  }

  private terminateScoreInfo() {
    DebugGui.deleteGui(kLilGuiTitle);
  }

  private youtube() {
    window.open('https://www.youtube.com/watch?v=' + this.amson.info.mvId);
  }

  private dumpAsLog() {
    console.log(this.amson);
  }

  private dumpAsFile() {
    const jsonString = JSON.stringify(this.amson, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
