import CircleSelector from '../CircleSelector'
import SelectorGUI from './SelectorGUI'

export default class CircleSelectorGUI extends SelectorGUI {
  private selector: CircleSelector
  private circle: HTMLDivElement

  public constructor(selector: CircleSelector, overlayDiv: HTMLDivElement) {
    super(overlayDiv)
    this.selector = selector
  }

  public onSelected(): void {
    this.createCircleElement()
  }
  public onMouseMove(mouseX: number, mouseY: number): void {
    this.updateCircleDimensions(mouseX, mouseY)
  }
  public onUnselected(): void {
    this.circle.remove()
  }

  private createCircleElement(): void {
    const circle = document.createElement('div')

    const style = circle.style
    style.position = 'relative'
    style.transform = 'translate(-50%, -50%)'
    style.borderRadius = '50%'
    style.border = '1px solid white'
    style.boxShadow = '0 0 2px 0 black'

    this.circle = circle
    this.getOverlayDiv().appendChild(this.circle)
  }

  private updateCircleDimensions(mouseX: number, mouseY: number): void {
    const radius = this.selector.getRadius()

    const style = this.circle.style
    style.left = `${mouseX}px`
    style.top = `${mouseY}px`
    style.width = `${radius * 2}px`
    style.height = `${radius * 2}px`
  }
}
