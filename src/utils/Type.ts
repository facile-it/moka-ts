import { identity } from 'fp-ts/function'
import * as t from 'io-ts'
import * as $S from './struct'

const isStruct = (u: unknown): u is $S.Struct =>
  'object' === typeof u && null !== u && !Array.isArray(u)

export const struct = new t.Type(
  'struct',
  isStruct,
  (u, c) => (isStruct(u) ? t.success(u) : t.failure(u, c)),
  identity,
)
