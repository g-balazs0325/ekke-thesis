import CircleSelector from '../CircleSelector'
import RaycastFaceSelector from '../RaycastFaceSelector'
import Selector from '../Selector'
import CircleSelectorGUI from './CircleSelectorGUI'
import RaycastFaceSelectorGUI from './RaycastFaceSelectorGUI'
import SelectorGUI from './SelectorGUI'
import { GUI } from 'lil-gui'

const create = function (
  selector: Selector,
  overlayDiv: HTMLDivElement,
  interfaceRoot: GUI
): SelectorGUI {
  if (selector instanceof RaycastFaceSelector)
    return new RaycastFaceSelectorGUI(selector, overlayDiv, interfaceRoot)
  if (selector instanceof CircleSelector)
    return new CircleSelectorGUI(selector, overlayDiv, interfaceRoot)

  throw new Error('No GUI creation implemented for this type of selector.')
}

const SelectorGUIFactory = {
  create
}
export default SelectorGUIFactory
