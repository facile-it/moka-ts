import { constTrue, pipe, tupled } from 'fp-ts/function'
import * as N from 'fp-ts/number'
import * as RA from 'fp-ts/ReadonlyArray'
import {
  ap,
  Applicative,
  Apply,
  apS,
  boolean,
  chain,
  Chain,
  Do,
  float,
  FromIO,
  Functor,
  integer,
  literal,
  map,
  Mock,
  Monad,
  null as _null,
  nullable,
  number,
  of,
  partial,
  Pointed,
  readonlyArray,
  readonlyNonEmptyArray,
  readonlyRecord,
  string,
  struct,
  tuple,
  undefined as _undefined,
  union,
  unknown,
} from '.'
import { curry } from './utils/function'

describe('Mock', () => {
  describe('undefined', () => {
    it('should return undefined', () => {
      expect(_undefined()()).toBeUndefined()
    })
  })

  describe('null', () => {
    it('should return null', () => {
      expect(_null()()).toBeNull()
    })
  })

  describe('boolean', () => {
    it('should return a random boolean', () => {
      expect(typeof boolean()()).toBe('boolean')
    })
    it('should allow returning a custom boolean', () => {
      for (let i = 0; i < 10; i++) {
        expect(boolean(true)()).toBe(true)
      }
    })
  })

  describe('float', () => {
    it('should return a random float', () => {
      const x = float()()()

      expect(Math.floor(x)).not.toBe(x)
    })
    it("shouldn't allow returning an out-of-bounds custom float", () => {
      expect(float(0, 1)(-42)()).toBeGreaterThanOrEqual(0)
      expect(float(0, 1)(42)()).toBeLessThan(1)
    })
  })

  describe('integer', () => {
    it('should return a random integer', () => {
      const x = integer()()()

      expect(Math.floor(x)).toBe(x)
    })
    it("shouldn't allow returning a custom float", () => {
      expect(integer()(3.14)()).toBe(3)
    })
    it("shouldn't allow returning an out-of-bounds custom integer", () => {
      expect(integer(0, 1)(-42)()).toBeGreaterThanOrEqual(0)
      expect(integer(0, 1)(42)()).toBeLessThan(1)
    })
  })

  describe('number', () => {
    it('should return a random number', () => {
      expect(typeof number()()()).toBe('number')
    })
    it('should allow setting bottom boundary', () => {
      for (let i = 0; i < 10; i++) {
        expect(number(Math.pow(2, 16), -Infinity)()()).toBeGreaterThanOrEqual(
          Math.pow(2, 16),
        )
      }
    })
    it('should allow setting top boundary', () => {
      for (let i = 0; i < 10; i++) {
        expect(number(undefined, -Math.pow(2, 16))()()).toBeLessThan(
          -Math.pow(2, 16),
        )
      }
    })
    it('should allow setting bottom and top boundaries', () => {
      for (let i = 0; i < 10; i++) {
        const x = number(-2, 2)()()

        expect(x).toBeGreaterThanOrEqual(-2)
        expect(x).toBeLessThan(2)
      }
    })
    it('should allow returning a custom number', () => {
      expect(number()(1138)()).toBe(1138)
    })
    it('should allow returning one of many custom numbers', () => {
      for (let i = 0; i < 10; i++) {
        expect(
          [1138, 1337].indexOf(number()(1138, 1337)()),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it("shouldn't allow returning an out-of-bounds custom number", () => {
      expect(number(0, 1)(-42)()).toBeGreaterThanOrEqual(0)
      expect(number(0, 1)(42)()).toBeLessThan(1)
    })
  })

  describe('string', () => {
    it('should return a random string', () => {
      expect(typeof string()()).toBe('string')
    })
    it('should allow returning a custom string', () => {
      expect(string('foo')()).toBe('foo')
    })
    it('should allow returning one of many custom strings', () => {
      for (let i = 0; i < 10; i++) {
        expect(
          ['foo', 'bar'].indexOf(string('foo', 'bar')()),
        ).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('literal', () => {
    it('should return the provided value', () => {
      expect(literal(true)()()).toBe(true)
      expect(literal(1138)()()).toBe(1138)
      expect(literal('foo')()()).toBe('foo')
    })
    it('should allow returning a custom value', () => {
      expect(literal<42 | 1138>(1138)(42)()).toBe(42)
      expect(literal<'foo' | 'bar'>('foo')('bar')()).toBe('bar')
    })
  })

  describe('unknown', () => {
    it('should return a random value of any type', () => {
      for (let i = 0; i < 10; i++) {
        const x = unknown()()()

        expect(
          ['undefined', 'boolean', 'number', 'string', 'object'].indexOf(
            typeof x,
          ),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should allow returning a custom value', () => {
      const a = unknown()(true)()
      const b = unknown()(1138)()
      const c = unknown()('foo')()
      const d = unknown()([1138])()
      const e = unknown()({ foo: 1138 })()

      expect(a).toBe(true)
      expect(b).toBe(1138)
      expect(c).toBe('foo')
      expect(d).toStrictEqual([1138])
      expect((e as any).foo).toBe(1138)
    })
  })

  describe('nullable', () => {
    it('should make a mock nullable', () => {
      const M = nullable(number())

      for (let i = 0; i < 10; i++) {
        expect(
          ['undefined', 'number'].indexOf(typeof M()()),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should allow returning undefined', () => {
      const M = nullable(number())

      expect(M(undefined)()).toBeUndefined()
    })
  })

  describe('tuple', () => {
    const M = tuple(boolean, number(), string)

    it('should return a random tuple with a defined shape', () => {
      const x = M()()

      expect(typeof x[0]).toBe('boolean')
      expect(typeof x[1]).toBe('number')
      expect(typeof x[2]).toBe('string')
    })
    it('should allow returning a custom tuple', () => {
      const x = M([true, 1138, 'foo'])()

      expect(x[0]).toBe(true)
      expect(x[1]).toBe(1138)
      expect(x[2]).toBe('foo')
    })
  })

  describe('struct', () => {
    const M = struct({
      a: boolean,
      b: number(),
      c: string,
    })
    const deepM = struct({
      a: boolean,
      b: struct({
        c: number(),
        d: struct({
          e: string,
          f: struct({
            g: readonlyArray(unknown()),
            h: _undefined,
          }),
        }),
      }),
    })

    it('should return a random struct with a defined shape', () => {
      const x = M()()

      expect(typeof x.a).toBe('boolean')
      expect(typeof x.b).toBe('number')
      expect(typeof x.c).toBe('string')
    })
    it('should allow overwriting part of the random struct', () => {
      const x = M({ b: 1138 })()

      expect(typeof x.a).toBe('boolean')
      expect(x.b).toBe(1138)
      expect(typeof x.c).toBe('string')
    })
    it('should allow overwriting deep parts of the random struct', () => {
      const x = deepM({ b: { c: 1138, d: { f: { g: [1138] } } } })()

      expect(typeof x.a).toBe('boolean')
      expect(x.b.c).toBe(1138)
      expect(typeof x.b.d.e).toBe('string')
      expect(x.b.d.f.g).toStrictEqual([1138])
      expect(x.b.d.f.h).toBeUndefined()
    })
    it('should ignore undefined values', () => {
      const x = M({ a: undefined, b: 1138 })()

      expect(typeof x.a).toBe('boolean')
      expect(x.b).toBe(1138)
      expect(typeof x.c).toBe('string')
    })
    it('should ignore deep undefined values', () => {
      const x = deepM({ b: { c: 1138, d: undefined } })()

      expect(typeof x.a).toBe('boolean')
      expect(x.b.c).toBe(1138)
      expect(typeof x.b.d.e).toBe('string')
      expect(x.b.d.f.g instanceof Array).toBe(true)
      expect(x.b.d.f.h).toBeUndefined()
    })
  })

  describe('partial', () => {
    it('should return a random partial struct with a defined shape', () => {
      const M = partial({
        a: boolean,
        b: number(),
        c: string,
      })

      for (let i = 0; i < 10; i++) {
        const x = M()()

        expect(
          ['undefined', 'boolean'].indexOf(typeof x.a),
        ).toBeGreaterThanOrEqual(0)
        expect(
          ['undefined', 'number'].indexOf(typeof x.b),
        ).toBeGreaterThanOrEqual(0)
        expect(
          ['undefined', 'string'].indexOf(typeof x.c),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should allow overwriting part of the random partial struct', () => {
      const M = partial({
        a: boolean,
        b: number(),
        c: string,
      })

      for (let i = 0; i < 10; i++) {
        const x = M({ b: 1138 })()

        expect(
          ['undefined', 'boolean'].indexOf(typeof x.a),
        ).toBeGreaterThanOrEqual(0)
        expect(x.b).toBe(1138)
        expect(
          ['undefined', 'string'].indexOf(typeof x.c),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should ignore undefined values', () => {
      const M = partial({
        a: boolean,
        b: number(),
        c: string,
      })

      for (let i = 0; i < 10; i++) {
        const x = M({ a: undefined, b: 1138 })()

        expect(
          ['undefined', 'boolean'].indexOf(typeof x.a),
        ).toBeGreaterThanOrEqual(0)
        expect(x.b).toBe(1138)
        expect(
          ['undefined', 'string'].indexOf(typeof x.c),
        ).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('union', () => {
    const M = union(
      boolean,
      number(),
      string,
      boolean,
      number(),
      string,
      boolean,
      number(),
      string,
      boolean,
      number(),
      string,
      boolean,
      number(),
      string,
    )

    it('should return a random value of one of the specified types', () => {
      for (let i = 0; i < 10; i++) {
        const x = M()()

        expect(
          ['boolean', 'number', 'string'].indexOf(typeof x),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should allow returning a custom value', () => {
      const a = M(true)()
      const b = M(1138)()
      const c = M('foo')()

      expect(a).toBe(true)
      expect(b).toBe(1138)
      expect(c).toBe('foo')
    })
    it('should allow overwriting part of a struct', () => {
      const x = union(
        struct({ a: boolean, b: number(), c: string }),
        struct({ a: boolean, b: number(), c: string }),
      )({ b: 1138 })()

      expect(typeof x.a).toBe('boolean')
      expect(x.b).toBe(1138)
      expect(typeof x.c).toBe('string')
    })
  })

  describe('readonlyArray', () => {
    it('should return a random array', () => {
      const xs = readonlyArray(number())()()

      expect(xs.reduce((acc, x) => acc && 'number' === typeof x, true)).toBe(
        true,
      )
    })
    it('should return an array with random elements', () => {
      const xs = readonlyArray(number(), 2)()()

      expect(
        pipe(
          xs,
          RA.matchLeft(constTrue, (head, tail) =>
            pipe(tail, RA.every(curry(N.Eq.equals)(head))),
          ),
        ),
      ).toBe(false)
    })
    it('should allow returning a custom array', () => {
      const xs = readonlyArray(number())([1138, 1337])()

      expect(xs).toStrictEqual([1138, 1337])
    })
    it('should allow returning one of many custom arrays', () => {
      for (let i = 0; i < 10; i++) {
        const xs = readonlyArray(number())([1138, 1337], [138, 337])()

        expect(
          ['1138,1337', '138,337'].indexOf(xs.join(',')),
        ).toBeGreaterThanOrEqual(0)
      }
    })
    it('should allow returning an empty array', () => {
      const xs = readonlyArray(number(), -Infinity, -Infinity)()()

      expect(xs).toHaveLength(0)
    })
    it('should allow boundaries on array size', () => {
      const xs = readonlyArray(number(), 3, 5)()()

      expect(xs.length).toBeGreaterThanOrEqual(3)
      expect(xs.length).toBeLessThanOrEqual(5)
    })
  })

  describe('readonlyNonEmptyArray', () => {
    it("shouldn't allow returning an empty array", () => {
      const xs = readonlyNonEmptyArray(number(), -Infinity, -Infinity)()()

      expect(xs).toHaveLength(1)
    })
  })

  describe('readonlyRecord', () => {
    it('should return a random record', () => {
      const xs = readonlyRecord(string, number())()()

      expect(
        Object.values(xs).reduce(
          (acc, x) => acc && 'number' === typeof x,
          true,
        ),
      ).toBe(true)
    })
    it('should return a record with random elements', () => {
      const xs = readonlyRecord(string, number(), 2)()()

      expect(
        pipe(
          Object.values(xs),
          RA.matchLeft(constTrue, (head, tail) =>
            pipe(tail, RA.every(curry(N.Eq.equals)(head))),
          ),
        ),
      ).toBe(false)
    })
    it('should allow returning a custom record', () => {
      const xs = readonlyRecord(string, number())({ foo: 1138, bar: 1337 })()

      expect(xs.foo).toStrictEqual(1138)
      expect(xs.bar).toStrictEqual(1337)
    })
    it('should allow returning one of many custom records', () => {
      for (let i = 0; i < 10; i++) {
        const xs = readonlyRecord(string, number())(
          { foo: 1138, bar: 1337 },
          { mad: 138, max: 337 },
        )()

        expect(
          (1138 === xs.foo && 1337 === xs.bar) ||
            (138 === xs.mad && 337 === xs.max),
        ).toBe(true)
      }
    })
    it('should ignore undefined values', () => {
      const xs = readonlyRecord(
        string,
        number(),
      )({ foo: 1138, bar: undefined })()

      expect(xs.foo).toStrictEqual(1138)
      expect('bar' in xs).toBe(false)
    })
    it('should allow returning an empty record', () => {
      const xs = readonlyRecord(string, number(), -Infinity, -Infinity)()()

      expect(Object.values(xs)).toHaveLength(0)
    })
    it('should allow boundaries on record size', () => {
      const xs = readonlyRecord(string, number(), 3, 5)()()

      expect(Object.values(xs).length).toBeGreaterThanOrEqual(3)
      expect(Object.values(xs).length).toBeLessThanOrEqual(5)
    })
  })

  describe('Functor', () => {
    const fa = of(42)
    const ab = (a: number) => a + 1
    const bc = (a: number) => a / 2

    it('identity', () => {
      expect(Functor.map(fa, (a) => a)()()).toBe(fa()())
    })
    it('composition', () => {
      expect(Functor.map(fa, (a) => bc(ab(a)))()()).toBe(
        Functor.map(Functor.map(fa, ab), bc)()(),
      )
    })

    describe('map', () => {
      const firstName = union(of('Mario'), of('Luigi'))
      const lastName = of('Mario')
      const fullName = <A extends string, B extends string>(
        firstName: A,
        lastName: B,
      ): `${A} ${B}` => `${firstName} ${lastName}` as `${A} ${B}`

      it('should transform Mock value using a given function', () => {
        expect(typeof Functor.map(number(), (a) => a.toString())()()).toBe(
          'string',
        )
        expect(
          Functor.map(readonlyNonEmptyArray(unknown()), (as) => as.length)()(),
        ).toBeGreaterThan(0)
        expect(
          ['Mario Mario', 'Luigi Mario'].indexOf(
            pipe(tuple(firstName, lastName), map(tupled(fullName)))()(),
          ),
        ).toBeGreaterThanOrEqual(0)
      })
      it('should allow returning a custom value', () => {
        expect(
          Functor.map(
            readonlyNonEmptyArray(unknown()),
            (as) => as.length,
          )(1138)(),
        ).toBe(1138)
        expect(
          Functor.map(readonlyNonEmptyArray(unknown()), (as) => as.length)()(),
        ).toBeGreaterThan(0)
        expect(
          pipe(
            tuple(firstName, lastName),
            map(tupled(fullName)),
          )('Franco Franchi')(),
        ).toBe('Franco Franchi')
      })
    })
  })

  describe('Pointed', () => {
    describe('of', () => {
      it('should return the provided value', () => {
        expect(Pointed.of(true)()()).toBe(true)
        expect(Pointed.of(1138)()()).toBe(1138)
        expect(Pointed.of('foo')()()).toBe('foo')
      })
      it('should allow returning a custom value', () => {
        expect(Pointed.of(true)(false)()).toBe(false)
        expect(Pointed.of(1138)(42)()).toBe(42)
        expect(Pointed.of('foo')('bar')()).toBe('bar')
      })
    })
  })

  describe('Apply', () => {
    const fa = of(42)
    const ab = (a: number) => a + 1
    const bc = (a: number) => a / 2

    it('associative composition', () => {
      expect(
        Apply.ap(
          Apply.ap(
            Apply.map(
              of(bc),
              (bc) => (ab: (a: number) => number) => (a) => bc(ab(a)),
            ),
            of(ab),
          ),
          fa,
        )()(),
      ).toBe(Apply.ap(of(bc), Apply.ap(of(ab), fa))()())
    })

    describe('ap', () => {
      const M: Mock<(a: number) => string> = () => () => (a) => a.toString()
      const fullName = (firstName: string, lastName: string): string =>
        `${firstName} ${lastName}`

      it('should apply a mocked function to Mock value', () => {
        expect(typeof Apply.ap(M, number())()()).toBe('string')
        expect(
          /^\w+ \w+$/.test(pipe(string, map(curry(fullName)), ap(string))()()),
        ).toBe(true)
      })
      it('should allow returning a custom value', () => {
        expect(Apply.ap(M, number())('foo')()).toBe('foo')
        expect(
          pipe(string, map(curry(fullName)), ap(string))('Jonathan')(),
        ).toBe('Jonathan')
      })
    })
  })

  describe('Applicative', () => {
    const a = 42
    const fa = of(a)
    const ab = (a: number) => a + 1

    it('identity', () => {
      expect(
        Applicative.ap(
          Applicative.of((a) => a),
          fa,
        )()(),
      ).toBe(fa()())
    })
    it('homomorphism', () => {
      expect(Applicative.ap(Applicative.of(ab), Applicative.of(a))()()).toBe(
        Applicative.of(ab(a))()(),
      )
    })
    it('interchange', () => {
      expect(Applicative.ap(Applicative.of(ab), Applicative.of(a))()()).toBe(
        Applicative.ap(
          Applicative.of((ab: (a: number) => number) => ab(a)),
          Applicative.of(ab),
        )()(),
      )
    })
  })

  describe('Chain', () => {
    const fa = of(42)
    const afb = (a: number) => of(a + 1)
    const bfc = (a: number) => of(a / 2)

    it('associativity', () => {
      expect(Chain.chain(Chain.chain(fa, afb), bfc)()()).toBe(
        Chain.chain(fa, (a) => Chain.chain(afb(a), bfc))()(),
      )
    })

    describe('chain', () => {
      const M = pipe(
        Do,
        apS('first', union(of('Vincent'), of('Esmeralda'), of('Marcellus'))),
        apS('last', union(of('Vega'), of('Villalobos'), of('Wallace'))),
        chain(({ first, last }) =>
          struct({
            id: string,
            firstName: of(first),
            lastName: of(last),
            email: of(`${first}.${last}@pulp.com`.toLowerCase()),
          }),
        ),
      )

      it('should transform Mock value and chain the result', () => {
        const x = M()()

        expect(x.email).toBe(
          `${x.firstName}.${x.lastName}@pulp.com`.toLowerCase(),
        )
      })
      it('should allow overwriting part of a struct', () => {
        const x = M({ lastName: 'Wolf' })()

        expect(x.lastName).toBe('Wolf')
        expect(x.email).toMatch(
          /(Vincent|Esmeralda|Marcellus)\.(Vega|Villalobos|Wallace)@pulp\.com/i,
        )
      })
    })
  })

  describe('Monad', () => {
    const a = 42
    const fa = of(a)
    const f = (a: number) => of(a + 1)

    it('left identity', () => {
      expect(Monad.chain(of(a), f)()()).toBe(f(a)()())
    })
    it('right identity', () => {
      expect(Monad.chain(fa, of)()()).toBe(fa()())
    })
  })

  describe('FromIO', () => {
    describe('fromIO', () => {
      it('should wrap an IO into a Mock', () => {
        expect(typeof FromIO.fromIO(() => Math.random())()()).toBe('number')
      })
      it('should allow returning a custom value', () => {
        expect(FromIO.fromIO(() => Math.random())(1138)()).toBe(1138)
      })
    })
  })
})
