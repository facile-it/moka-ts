import { curry, recurse } from './function'

describe('function', () => {
  describe('curry', () => {
    it('should make a function partially appliable', () => {
      const f = (a: boolean, b: number) => [a, b] as const
      const g = (a: boolean, b: number, c: string) => [a, b, c] as const

      const a = true
      const b = 1138
      const c = 'foo'

      expect(curry(f)(a)(b)).toStrictEqual(f(a, b))
      expect(curry(g)(a)(b)(c)).toStrictEqual(g(a, b, c))
    })
  })

  describe('recurse', () => {
    it('should help prevent infinite recursion using depth knowledge', () => {
      const f = (): (() => string) =>
        recurse(
          (self, depth) => () =>
            depth < 16 ? (0 / 0).toString() + self() : ' Batman!',
        )
      const pi = (max: number) => (): ((n?: number) => number) =>
        recurse(
          (self, depth) =>
            (n = 1) =>
              4 / n + (depth < max ? self(-1 * n + (n < 0 ? 2 : -2)) : 0),
        )
      const pi100 = pi(100)()()

      expect(f()()).toBe(
        'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!',
      )
      expect(pi100).toBeGreaterThan(3.15)
      expect(pi100).toBeLessThan(3.16)
    })
  })
})
