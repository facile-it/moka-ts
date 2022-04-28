import { either, option, readonlyArray, readonlyRecord } from 'fp-ts'
import { flow, identity, pipe } from 'fp-ts/function'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'
import * as t from 'io-ts'
import * as tt from 'io-ts-types'
import { Struct } from './struct'

export const numeric = new t.Type(
  'Numeric',
  t.number.is,
  (u, c) =>
    pipe(
      t.number.validate(u, c),
      either.alt(() => tt.NumberFromString.validate(u, c)),
    ),
  t.number.encode,
)

const isLiteral =
  (r: RegExp) =>
  (u: unknown): u is string =>
    t.string.is(u) && r.test(u)

export function literal<V extends number | string>(
  value: V,
  name?: string,
): t.LiteralC<V>
export function literal(regExp: RegExp, name?: string): t.StringC
export function literal(a: number | string | RegExp, name?: string) {
  return a instanceof RegExp
    ? new t.Type(
        name || 'Literal',
        isLiteral(a),
        (u, c) => (isLiteral(a)(u) ? t.success(u) : t.failure(u, c)),
        identity,
      )
    : t.literal(a, name)
}

const isStruct = (u: unknown): u is Struct =>
  'object' === typeof u && null !== u && !Array.isArray(u)

export const struct = new t.Type(
  'struct',
  isStruct,
  (u, c) => (isStruct(u) ? t.success(u) : t.failure(u, c)),
  identity,
)

export const nullable = <C extends t.Mixed>(codec: C, name?: string) =>
  t.union([codec, t.undefined], name)

export const alias = <C extends t.Mixed>(
  name: string,
  codec: C,
): t.Type<t.TypeOf<C>, t.OutputOf<C>, t.InputOf<C>> => ({
  ...codec,
  name,
})

const isStringArray = (
  as: ReadonlyArray<unknown>,
): as is ReadonlyArray<string> => t.string.is(as[0])

export function literalUnion<
  A extends number | string,
  B extends { readonly [K in A]: null },
>(strings: Readonly<[A, A, ...ReadonlyArray<A>]>, name?: string): t.KeyofC<B>
export function literalUnion(
  as: ReadonlyNonEmptyArray<number> | ReadonlyNonEmptyArray<string>,
  name?: string,
) {
  return isStringArray(as)
    ? t.keyof(
        as.reduce((result, string) => ({ ...result, [string]: null }), {}),
        name,
      )
    : t.union(as.map((number) => t.literal(number)) as any, name)
}

export const lax = <P extends t.Props>(props: P, name?: string) =>
  pipe(
    t.partial(props, name),
    (partial) =>
      new t.Type(
        partial.name,
        partial.is,
        flow(
          t.UnknownRecord.validate,
          either.map(readonlyRecord.toReadonlyArray),
          either.map(
            readonlyArray.reduce({}, (result, [key, value]) =>
              pipe(
                partial.props,
                readonlyRecord.lookup(key),
                option.match(
                  () => result, // ({ ...result, [key]: value }),
                  (codec) =>
                    pipe(
                      codec.decode(value),
                      either.match(
                        () => result,
                        (value) => ({ ...result, [key]: value }),
                      ),
                    ),
                ),
              ),
            ),
          ),
          either.chain(t.success),
        ),
        partial.encode,
      ),
  )
