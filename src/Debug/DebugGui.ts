import {GUI} from 'lil-gui';

export class DebugGui {
  private static managedGui = new Map<string, GUI>();

  private constructor() {
    console.log('DebugGui constructor');
  }

  static createGui(name: string, registrar: (gui: GUI) => void) {
    this.deleteGui(name);

    const added = new GUI({title: name, container: this.debugHTMLElement()});
    if (registrar) {
      registrar(added);
    }
    this.managedGui.set(name, added);
  }

  static deleteGui(name: string) {
    const registred = this.managedGui.get(name);
    if (registred) {
      registred.destroy();
      this.managedGui.delete(name);
    }
  }

  private static debugHTMLElement() {
    let debugDiv = document.getElementById('debug');
    if (debugDiv) {
      return debugDiv;
    }

    // デバッグ用Flexbox配置
    debugDiv = document.createElement('div');
    debugDiv.id = 'debug';
    debugDiv.style.position = 'absolute';
    debugDiv.style.height = '100%';
    debugDiv.style.top = '0';
    debugDiv.style.right = '0';
    debugDiv.style.display = 'flex';
    debugDiv.style.flexFlow = 'column wrap-reverse';
    debugDiv.style.gap = '10px 10px';

    const appDiv = document.getElementById('app');
    appDiv?.after(debugDiv);

    return debugDiv;
  }
}
