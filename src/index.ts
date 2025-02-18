import * as Appli from 'fp-ts/Applicative'
import * as _Apply from 'fp-ts/Apply'
import * as C from 'fp-ts/Chain'
import * as FIO from 'fp-ts/FromIO'
import {
  constNull,
  constUndefined,
  constVoid,
  flip,
  pipe,
} from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import * as M from 'fp-ts/Monad'
import * as MIO from 'fp-ts/MonadIO'
import * as N from 'fp-ts/number'
import * as Op from 'fp-ts/Option'
import * as Or from 'fp-ts/Ord'
import * as P from 'fp-ts/Pointed'
import * as Pr from 'fp-ts/Predicate'
import * as R from 'fp-ts/Random'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as Se from 'fp-ts/Semigroup'
import * as t from 'io-ts'
import { curry, recurse, run } from './utils/function'
import * as $St from './utils/struct'
import { PartialDeep } from './utils/struct'
import * as $t from './utils/Type'
import * as $Y from './utils/Yield'

export const URI = 'Mock'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Mock<A>
  }
}

type EnforceNonEmptyRecord<R> = keyof R extends never ? never : R

export interface Mock<A> {
  (...as: ReadonlyArray<PartialDeep<A>>): IO.IO<A>
}

export const Functor: F.Functor1<URI> = {
  URI,
  map: (fa, f) => pipe(fa(), IO.map(f), FromIO.fromIO),
}

export const map = curry(flip(Functor.map))
export const flap = F.flap(Functor)
export const bindTo = F.bindTo(Functor)

export const Pointed: P.Pointed1<URI> = {
  URI,
  of:
    <A>(a: A): Mock<A> =>
    (...as) =>
      pipe(
        as,
        RNEA.fromReadonlyArray,
        Op.traverse(IO.Applicative)(R.randomElem),
        IO.map(
          Op.match(
            () => a,
            (_a) =>
              $t.struct.is(a) && $t.struct.is(_a)
                ? (pipe(_a, $St.filterDeep(Pr.not(t.undefined.is)), (_a) =>
                    $St.patch<A & $St.Struct, PartialDeep<A & $St.Struct>>(
                      _a as PartialDeep<A & $St.Struct>,
                    )(a),
                  ) as A)
                : (_a as A),
          ),
        ),
      ),
}

export const of = Pointed.of
export const Do = Pointed.of({})

export const Apply: _Apply.Apply1<URI> = {
  ...Functor,
  ap: (fab, fa) => Chain.chain(fab, curry(Functor.map)(fa)),
}

export const ap = curry(flip(Apply.ap))
export const apFirst = _Apply.apFirst(Apply)
export const apSecond = _Apply.apSecond(Apply)
export const apS = _Apply.apS(Apply)

export const Applicative: Appli.Applicative1<URI> = { ...Pointed, ...Apply }

export const Chain: C.Chain1<URI> = {
  ...Apply,
  chain: (fa, f) => Functor.map(Functor.map(fa, f), (fb) => fb()()),
}

export const chain = curry(flip(Chain.chain))
export const chainFirst = C.chainFirst(Chain)
export const bind = C.bind(Chain)

export const Monad: M.Monad1<URI> = { ...Applicative, ...Chain }

export const FromIO: FIO.FromIO1<URI> = {
  URI,
  fromIO:
    (fa) =>
    (...as) =>
      pipe(
        fa,
        IO.chain((a) => Pointed.of(a)(...as)),
      ),
}

export const fromIO = FromIO.fromIO
export const fromIOK = FIO.fromIOK(FromIO)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)

export const MonadIO: MIO.MonadIO1<URI> = { ...Monad, ...FromIO }

const _void: Mock<void> = () => constVoid
const _undefined: Mock<undefined> = () => constUndefined
const _null: Mock<null> = () => constNull

export const boolean: Mock<boolean> = fromIO(R.randomBool)

export const float =
  (
    min = Number.MIN_SAFE_INTEGER * 1e-6,
    max = Number.MAX_SAFE_INTEGER * 1e-6,
  ): Mock<number> =>
  (...as) =>
    pipe(
      fromIO(R.randomRange(min, Math.max(min + Number.EPSILON, max)))(...as),
      IO.map(
        Or.clamp(N.Ord)(
          min,
          Math.max(min + Number.EPSILON, max - Number.EPSILON),
        ),
      ),
    )

export const integer =
  (
    min = Number.MIN_SAFE_INTEGER * 1e-6,
    max = Number.MAX_SAFE_INTEGER * 1e-6,
  ): Mock<number> =>
  (...as) =>
    pipe(float(min, max)(...as), IO.map(Math.floor))

export const number =
  (
    min = Number.MIN_SAFE_INTEGER * 1e-6,
    max = Number.MAX_SAFE_INTEGER * 1e-6,
  ): Mock<number> =>
  (...as) =>
    pipe(
      union(float(min, max), integer(min, max))(...as),
      IO.map(
        Or.clamp(N.Ord)(
          min,
          Math.max(min + Number.EPSILON, max - Number.EPSILON),
        ),
      ),
    )

export const string: Mock<string> = fromIO(
  () => Math.random().toString(36).split('.')[1],
)

export const literal = <A extends boolean | number | string>(a: A): Mock<A> =>
  of(a)

export const unknown = (depth = 10): Mock<unknown> =>
  recurse(
    (_unknown, _depth) =>
      (_depth < depth
        ? union(
            _undefined,
            _null,
            boolean,
            number(),
            string,
            readonlyArray(_unknown),
            readonlyRecord(string, _unknown),
          )
        : union(_undefined, _null, boolean, number(), string)) as Mock<unknown>,
  )

export const nullable = <A>(M: Mock<A>): Mock<A | undefined> =>
  union(M, _undefined)

export const tuple = _Apply.sequenceT(Apply)

export const struct = _Apply.sequenceS(Apply)

export const partial = <A>(
  Ms: EnforceNonEmptyRecord<{ readonly [K in keyof A]: Mock<A[K]> }>,
): Mock<Partial<Readonly<A>>> =>
  pipe(
    Ms as RR.ReadonlyRecord<string, Mock<unknown>>,
    RR.map(nullable),
    struct,
  ) as any

export function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
  k: Mock<K>,
  l: Mock<L>,
  m: Mock<M>,
  n: Mock<N>,
  o: Mock<O>,
): Mock<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O>

export function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
  k: Mock<K>,
  l: Mock<L>,
  m: Mock<M>,
  n: Mock<N>,
): Mock<A | B | C | D | E | F | G | H | I | J | K | L | M | N>

export function union<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
  k: Mock<K>,
  l: Mock<L>,
  m: Mock<M>,
): Mock<A | B | C | D | E | F | G | H | I | J | K | L | M>

export function union<A, B, C, D, E, F, G, H, I, J, K, L>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
  k: Mock<K>,
  l: Mock<L>,
): Mock<A | B | C | D | E | F | G | H | I | J | K | L>

export function union<A, B, C, D, E, F, G, H, I, J, K>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
  k: Mock<K>,
): Mock<A | B | C | D | E | F | G | H | I | J | K>

export function union<A, B, C, D, E, F, G, H, I, J>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
  j: Mock<J>,
): Mock<A | B | C | D | E | F | G | H | I | J>
export function union<A, B, C, D, E, F, G, H, I>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
  i: Mock<I>,
): Mock<A | B | C | D | E | F | G | H | I>
export function union<A, B, C, D, E, F, G, H>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
  h: Mock<H>,
): Mock<A | B | C | D | E | F | G | H>
export function union<A, B, C, D, E, F, G>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
  g: Mock<G>,
): Mock<A | B | C | D | E | F | G>
export function union<A, B, C, D, E, F>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
  f: Mock<F>,
): Mock<A | B | C | D | E | F>
export function union<A, B, C, D, E>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
  e: Mock<E>,
): Mock<A | B | C | D | E>
export function union<A, B, C, D>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
  d: Mock<D>,
): Mock<A | B | C | D>
export function union<A, B, C>(
  a: Mock<A>,
  b: Mock<B>,
  c: Mock<C>,
): Mock<A | B | C>
export function union<A, B>(a: Mock<A>, b: Mock<B>): Mock<A | B>
export function union(...Ms: RNEA.ReadonlyNonEmptyArray<Mock<unknown>>) {
  return pipe(Ms, R.randomElem, IO.chain(run), fromIO)
}

export const readonlyArray = <A>(
  M: Mock<A>,
  min = 0,
  max = 10,
): Mock<ReadonlyArray<A>> =>
  pipe(
    R.randomInt(Math.max(0, min), Math.max(0, min, max)),
    IO.map((n) => pipe($Y.fromIO(M()), $Y.takeLeft(n), $Y.toReadonlyArray)),
    fromIO,
  )

export const readonlyNonEmptyArray = <A>(
  M: Mock<A>,
  min = 1,
  max = 10,
): Mock<RNEA.ReadonlyNonEmptyArray<A>> =>
  readonlyArray(M, Math.max(1, min), Math.max(1, min, max)) as unknown as Mock<
    RNEA.ReadonlyNonEmptyArray<A>
  >

export const readonlyRecord = <K extends string, T>(
  KM: Mock<K>,
  TM: Mock<T>,
  min = 0,
  max = 10,
): Mock<RR.ReadonlyRecord<K, T>> =>
  pipe(
    readonlyArray(tuple(KM, TM), Math.max(0, min), Math.max(0, min, max))(),
    IO.map(
      (entries) =>
        RR.fromFoldable(
          Se.last<T>(),
          RA.Foldable,
        )(entries) as RR.ReadonlyRecord<K, T>,
    ),
    fromIO,
  )

export { _void as void, _undefined as undefined, _null as null }
