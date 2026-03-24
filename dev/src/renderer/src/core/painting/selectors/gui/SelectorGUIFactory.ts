import CircleSelector from '../CircleSelector'
import RaycastFaceSelector from '../RaycastFaceSelector'
import Selector from '../Selector'
import CircleSelectorGUI from './CircleSelectorGUI'
import RaycastFaceSelectorGUI from './RaycastFaceSelectorGUI'
import SelectorGUI from './SelectorGUI'

const create = function (selector: Selector, overlayDiv: HTMLDivElement): SelectorGUI {
  if (selector instanceof RaycastFaceSelector)
    return new RaycastFaceSelectorGUI(selector, overlayDiv)
  if (selector instanceof CircleSelector) return new CircleSelectorGUI(selector, overlayDiv)

  throw new Error('No GUI creation implemented for this type of selector.')
}

const SelectorGUIFactory = {
  create
}
export default SelectorGUIFactory
