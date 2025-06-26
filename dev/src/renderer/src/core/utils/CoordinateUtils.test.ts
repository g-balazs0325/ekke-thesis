import { test, expect, beforeAll, describe } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from './CoordinateUtils'
import { Vector2 } from 'three'

beforeAll(() => {
  const bounds = new ConstantCoordinateUtilBounds(800, 600)
  CoordinateUtils.setBounds(bounds)
})

describe('Window position <=> normalized position', () => {
  test('Zero normalized position returns center of window (400, 300)', () => {
    const expected = new Vector2(400, 300)
    const actual = CoordinateUtils.normalizedToClient(new Vector2(0, 0))
    expect(actual).toEqual(expected)
  })

  test.for([
    { normX: 1, normY: 1, windX: 800, windY: 0 },
    { normX: 1, normY: -1, windX: 800, windY: 600 },
    { normX: -1, normY: 1, windX: 0, windY: 0 },
    { normX: -1, normY: -1, windX: 0, windY: 600 },
    { normX: 0.5, normY: -0.25, windX: 600, windY: 375 }
  ])(
    'Normalized position ($normX, $normY) returns window position ($windX, $windY)',
    ({ normX, normY, windX, windY }) => {
      const target = new Vector2(normX, normY)
      const expected = new Vector2(windX, windY)
      const actual = CoordinateUtils.normalizedToClient(target)
      expect(actual).toEqual(expected)
    }
  )

  test('Center of window (400, 300) returns zero normalized position', () => {
    const expected = new Vector2(0, 0)
    const actual = CoordinateUtils.clientToNormalized(new Vector2(400, 300))
    expect(actual).toEqual(expected)
  })

  test.for([
    { windX: 800, windY: 0, normX: 1, normY: 1 },
    { windX: 800, windY: 600, normX: 1, normY: -1 },
    { windX: 0, windY: 0, normX: -1, normY: 1 },
    { windX: 0, windY: 600, normX: -1, normY: -1 },
    { windX: 300, windY: 105, normX: -0.25, normY: 0.65 }
  ])(
    'Window position ($windX, $windY) returns normal position ($normX, $normY)',
    ({ windX, windY, normX, normY }) => {
      const target = new Vector2(windX, windY)
      const expected = new Vector2(normX, normY)
      const actual = CoordinateUtils.clientToNormalized(target)
      expect(actual).toEqual(expected)
    }
  )

  test('Window positions to normalized and back yields the original window positions', () => {
    const targets = [
      new Vector2(0, 0),
      new Vector2(800, 600),
      new Vector2(400, 300),
      new Vector2(250, 175),
      new Vector2(133, 275)
    ]
    for (const target of targets) {
      const expected = target
      const normalized = CoordinateUtils.clientToNormalized(target)
      const actual = CoordinateUtils.normalizedToClient(normalized)
      expect(actual).toEqual(expected)
    }
  })
})
