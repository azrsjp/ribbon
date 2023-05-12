export class Metronome {
  private readonly bpm: number;
  private readonly tickIntervalMs: number;
  private startAtMs: number;
  private nextTickMs: number;

  constructor(bpm: number, startAtMs: number) {
    this.bpm = bpm;
    this.tickIntervalMs = (60 / this.bpm) * 1000;
    this.startAtMs = startAtMs;
    this.nextTickMs = startAtMs;
  }

  setStartAt(startAtMs: number) {
    this.startAtMs = startAtMs;
  }

  setCurrent(currentMs: number) {
    this.updateNextTick(currentMs - 1);
  }

  tick(currentMs: number): boolean {
    if (this.nextTickMs > currentMs) {
      return false;
    }

    this.updateNextTick(currentMs);
    return true;
  }

  private updateNextTick(currentMs: number) {
    const totalTickCount = (currentMs - this.startAtMs) / this.tickIntervalMs;
    this.nextTickMs = this.startAtMs + (Math.floor(totalTickCount) + 1) * this.tickIntervalMs;
  }
}
