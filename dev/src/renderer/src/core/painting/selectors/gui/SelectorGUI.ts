import { GUI } from 'lil-gui'

export default abstract class SelectorGUI {
  private overlayDiv: HTMLDivElement
  private controllersRoot: GUI

  protected getOverlayDiv(): HTMLDivElement {
    return this.overlayDiv
  }
  protected getControllersRoot(): GUI {
    return this.controllersRoot
  }

  public constructor(overlayDiv: HTMLDivElement, interfaceRoot: GUI) {
    this.overlayDiv = overlayDiv
    this.controllersRoot = interfaceRoot
  }

  public abstract onSelected(): void // pl. elem létrehozása a circleselectorhoz, állítható property hozzáadása a guihoz
  public abstract onMouseMove(mouseX: number, mouseY: number): void // elem mozgatása az egérhez
  public abstract onUnselected(): void // elem és gui property törlése
}
