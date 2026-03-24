export default abstract class SelectorGUI {
  private overlayDiv: HTMLDivElement

  protected getOverlayDiv(): HTMLDivElement {
    return this.overlayDiv
  }

  public constructor(overlayDiv: HTMLDivElement) {
    this.overlayDiv = overlayDiv
  }

  public abstract onSelected(): void // pl. elem létrehozása a circleselectorhoz, állítható property hozzáadása a guihoz
  public abstract onMouseMove(): void // elem mozgatása az egérhez
  public abstract onUnselected(): void // elem és gui property törlése
}
