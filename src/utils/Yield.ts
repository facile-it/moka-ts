import * as FIO from 'fp-ts/FromIO'
import { flip, Lazy, pipe } from 'fp-ts/function'
import * as Fu from 'fp-ts/Functor'
import * as Pr from 'fp-ts/Predicate'
import * as Re from 'fp-ts/Refinement'
import { curry } from './function'

const URI = 'Yield'

type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: Yield<A>
  }
}

type Yield<A> = Lazy<Generator<A>>

export const Functor: Fu.Functor1<URI> = {
  URI,
  map: (fa, f) =>
    function* () {
      for (const a of fa()) {
        yield f(a)
      }
    },
}

export const map = curry(flip(Functor.map))

export const FromIO: FIO.FromIO1<URI> = {
  URI,
  fromIO: (fa) => pipe(range(0), map(fa)),
}

export const fromIO = FromIO.fromIO

export const makeBy = <A>(f: (i: number) => A): Yield<A> =>
  function* () {
    for (let i = 0; true; i++) {
      yield f(i)
    }
  }

export function takeLeftWhile<A, B extends A>(
  refinement: Re.Refinement<A, B>,
): (ma: Yield<A>) => Yield<B>
export function takeLeftWhile<A>(
  predicate: Pr.Predicate<A>,
): (ma: Yield<A>) => Yield<A>
export function takeLeftWhile<A>(predicate: Pr.Predicate<A>) {
  return (ma: Yield<A>) =>
    function* () {
      for (const a of ma()) {
        if (!predicate(a)) {
          break
        }

        yield a
      }
    }
}

export const range = (start: number, end = Infinity): Yield<number> =>
  pipe(
    makeBy((i) => start + i),
    takeLeftWhile((n) => n <= Math.max(start, end)),
  )

export const takeLeft =
  (n: number) =>
  <A>(ma: Yield<A>): Yield<A> =>
    function* () {
      for (const [a, i] of pipe(ma, zip(range(0)))()) {
        if (i >= n) {
          break
        }

        yield a
      }
    }

export const zipWith =
  <A, B, C>(mb: Yield<B>, f: (a: A, b: B) => C) =>
  (ma: Yield<A>): Yield<C> =>
    function* () {
      const bs = mb()
      for (const a of ma()) {
        const b = bs.next()
        if (b.done) {
          break
        }

        yield f(a, b.value)
      }
    }

export const zip =
  <B>(mb: Yield<B>) =>
  <A>(ma: Yield<A>): Yield<Readonly<[A, B]>> =>
    pipe(
      ma,
      zipWith(mb, (a, b) => [a, b] as const),
    )

export const toReadonlyArray = <A>(ma: Yield<A>): ReadonlyArray<A> => [...ma()]
