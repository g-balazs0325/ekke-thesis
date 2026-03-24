import RaycastFaceSelector from '../RaycastFaceSelector'
import SelectorGUI from './SelectorGUI'

export default class RaycastFaceSelectorGUI extends SelectorGUI {
  private selector: RaycastFaceSelector

  public constructor(selector: RaycastFaceSelector, overlayDiv: HTMLDivElement) {
    super(overlayDiv)
    this.selector = selector
  }

  /*eslint-disable*/
  public onSelected(): void {}
  public onMouseMove(): void {}
  public onUnselected(): void {}
  /*eslint-enable*/
}
