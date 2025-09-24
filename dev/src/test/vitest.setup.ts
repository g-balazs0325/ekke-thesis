import { expect } from 'vitest'
import { Vector2Like, Vector3Like } from 'three'

function isNonNullObject(a: unknown): a is object {
  return a !== null && typeof a === 'object'
}

function isVector2(a: unknown): a is Vector2Like {
  return isNonNullObject(a) && 'x' in a && 'y' in a && !('z' in a)
}
function vector2Equals(a: unknown, b: unknown): boolean | undefined {
  const aIsVector2 = isVector2(a)
  const bIsVector2 = isVector2(b)

  if (aIsVector2 && bIsVector2) return a.x === b.x && a.y === b.y
  else if (aIsVector2 === bIsVector2) return undefined
  else return false
}

function isVector3(a: unknown): a is Vector3Like {
  return isNonNullObject(a) && 'x' in a && 'y' in a && 'z' in a
}
function vector3Equals(a: unknown, b: unknown): boolean | undefined {
  const aIsVector3 = isVector3(a)
  const bIsVector3 = isVector3(b)

  if (aIsVector3 && bIsVector3) return a.x === b.x && a.y === b.y && a.z === b.z
  else if (aIsVector3 === bIsVector3) return undefined
  else return false
}

expect.addEqualityTesters([vector2Equals, vector3Equals])
