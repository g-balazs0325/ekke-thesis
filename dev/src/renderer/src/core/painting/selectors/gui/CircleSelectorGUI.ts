import CircleSelector from '../CircleSelector'
import SelectorGUI from './SelectorGUI'
import { Controller, GUI } from 'lil-gui'

export default class CircleSelectorGUI extends SelectorGUI {
  private selector: CircleSelector
  private circle: HTMLDivElement
  private controllers: Controller[]

  public constructor(selector: CircleSelector, overlayDiv: HTMLDivElement, interfaceRoot: GUI) {
    super(overlayDiv, interfaceRoot)
    this.selector = selector
    this.controllers = []
  }

  public onSelected(): void {
    this.createCircleElement()
    this.createGUIControllers()
  }
  public onMouseMove(mouseX: number, mouseY: number): void {
    this.updateCircleDimensions(mouseX, mouseY)
  }
  public onUnselected(): void {
    this.circle.remove()
    this.destroyGUIControllers()
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
  private createGUIControllers(): void {
    const properties = {
      radius: this.selector.getRadius()
    }

    const root = this.getControllersRoot()
    const radiusController = root
      .add(properties, 'radius', 1, 300)
      .name('Radius')
      .onChange((value: number) => this.selector.setRadius(value))
    this.controllers.push(radiusController)
  }

  private updateCircleDimensions(mouseX: number, mouseY: number): void {
    const radius = this.selector.getRadius()

    const style = this.circle.style
    style.left = `${mouseX}px`
    style.top = `${mouseY}px`
    style.width = `${radius * 2}px`
    style.height = `${radius * 2}px`
  }

  private destroyGUIControllers(): void {
    while (this.controllers.length > 0) {
      const controller = this.controllers.pop()
      controller.destroy()
    }
  }
}
