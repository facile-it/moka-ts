import { pipe } from 'fp-ts/function'
import { Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as S from 'fp-ts/struct'
import { curry } from './function'
import * as $t from './Type'

export type Struct = object

export type PartialDeep<A> = A extends { readonly [x: string]: unknown }
  ? Partial<{ readonly [K in keyof A]: PartialDeep<A[K]> }>
  : A

type IntersectionDeep<A, B> = A extends { readonly [x: string]: unknown }
  ? A & {
      readonly [K in keyof B]: IntersectionDeep<
        K extends keyof A ? A[K] : unknown,
        B[K]
      >
    }
  : B

export const toReadonlyArray = <A extends Struct>(
  a: A,
): ReadonlyArray<Readonly<[keyof A, A[keyof A]]>> => RR.toReadonlyArray(a)

export const filterDeep =
  <A extends Struct>(f: Predicate<unknown /*ValuesDeep<A>*/>) =>
  (a: A): PartialDeep<A> =>
    pipe(
      a,
      toReadonlyArray,
      RA.filter(([_, value]) => (f as Predicate<A[keyof A]>)(value)),
      RA.map(([key, value]) =>
        $t.struct.is(value)
          ? ([
              key,
              pipe(
                value,
                filterDeep(
                  f as Predicate<unknown /*ValuesDeep<typeof value>*/>,
                ),
              ),
            ] as const)
          : ([key, value] as const),
      ),
      RA.reduce({} as PartialDeep<A>, (b, [key, value]) => ({
        ...b,
        [key]: value,
      })),
    )

export const patch =
  <A extends Struct, B extends PartialDeep<A> & Struct>(b: B) =>
  (a: A): IntersectionDeep<A, B> =>
    pipe(
      b,
      toReadonlyArray,
      RA.map(([key, b]) =>
        $t.struct.is(b)
          ? ([key, patch(b)(a[key as keyof A] as A[keyof A] & Struct)] as const)
          : ([key, b] as const),
      ),
      RA.reduce({} as IntersectionDeep<A, B>, (ab, [key, b]) => ({
        ...ab,
        [key]: b,
      })),
      curry(S.getAssignSemigroup<IntersectionDeep<A, B>>().concat)(
        a as IntersectionDeep<A, B>,
      ),
    )
