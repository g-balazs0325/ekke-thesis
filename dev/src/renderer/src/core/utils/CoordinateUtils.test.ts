import { expect, test, beforeAll } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from './CoordinateUtils'
import { Vector2 } from 'three'

beforeAll(() => {
  const bounds = new ConstantCoordinateUtilBounds(800, 600)
  CoordinateUtils.setBounds(bounds)
})

test('Zero normalized position returns center of window (400, 300)', () => {
  const expected = new Vector2(400, 300)
  const actual = CoordinateUtils.normalizedToClient(new Vector2(0, 0))
  expect(actual.equals(expected)).toBe(true)
})

test('Center of window (400, 300) returns zero normalized position', () => {
  const expected = new Vector2(0, 0)
  const actual = CoordinateUtils.clientToNormalized(new Vector2(400, 300))
  expect(actual.equals(expected)).toBe(true)
})

test('Converting client position to normalized and back yields the original client position', () => {
  const target = CoordinateUtils.normalizedToClient(new Vector2(0, 0))
  const expected = new Vector2(0, 0)
  const actual = CoordinateUtils.clientToNormalized(target)
  expect(actual.equals(expected)).toBe(true)
})
