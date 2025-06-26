import { expect } from 'vitest'
import { Vector2Like } from 'three'

function isVector2(a: unknown): a is Vector2Like {
  return typeof a === 'object' && 'x' in a && 'y' in a && !('z' in a)
}
function vector2Equals(a: unknown, b: unknown): boolean {
  const aIsVector2 = isVector2(a)
  const bIsVector2 = isVector2(b)

  if (aIsVector2 && bIsVector2) return a.x === b.x && a.y === b.y
  else return false
}
expect.addEqualityTesters([vector2Equals])
