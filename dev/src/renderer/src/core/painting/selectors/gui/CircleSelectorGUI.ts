import CircleSelector from '../CircleSelector'
import SelectorGUI from './SelectorGUI'

export default class CircleSelectorGUI extends SelectorGUI {
  private selector: CircleSelector

  public constructor(selector: CircleSelector, overlayDiv: HTMLDivElement) {
    super(overlayDiv)
    this.selector = selector
  }

  public onSelected(): void {
    throw new Error('Method not implemented.')
  }
  public onMouseMove(): void {
    throw new Error('Method not implemented.')
  }
  public onUnselected(): void {
    throw new Error('Method not implemented.')
  }
}
