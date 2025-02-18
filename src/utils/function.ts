import { Lazy } from 'fp-ts/function'

export const run = <A>(f: Lazy<A>): A => f()

export function curry<A, B, C>(f: (a: A, b: B) => C): (a: A) => (b: B) => C
export function curry<A, B, C, D>(
  f: (a: A, b: B, c: C) => D,
): (a: A) => (b: B) => (c: C) => D
export function curry(f: (...args: any) => any) {
  return function curried(...head: ReadonlyArray<unknown>) {
    return head.length >= f.length
      ? f(...head)
      : (...rest: ReadonlyArray<unknown>) => curried(...head.concat(rest))
  }
}

/**
 * @example
 * const pi = (max: number) => (): ((n?: number) => number) =>
 *   recurse((self, depth) => (n = 1) =>
 *     4 / n + (depth < max ? self(-1 * n + (n < 0 ? 2 : -2)) : 0)
 *   )
 * const pi100 = pi(100)()()
 *
 * expect(pi100).toBeGreaterThan(3.15)
 * expect(pi100).toBeLessThan(3.16)
 */
export const recurse = <A extends (...args: any) => any>(
  f: (self: A, depth: number) => A,
  cache = false,
): A => {
  let depth = 0
  let _cache: A | null = null
  const run = !cache
    ? f
    : (_self: A, _depth: number): A => {
        if (!_cache) {
          _cache = f(_self, _depth)
        }

        return _cache
      }

  const self = ((...args: any) => run(self, depth++)(...args)) as A

  return self
}
