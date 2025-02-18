# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Removed

- Remove `Http` module.
- Remove `Cache` module.
- Remove `Memcached` module.
- Remove `Buffer` module.
- Remove `Stream` module.
- Remove `Memory` module.
- Remove `Redis` module.
- Remove `Storage` module.
- Remove `Axios` module.
- Remove `Fetch` module.
- Remove `Got` module.
- Remove `Flydrive` module.
- Remove `Fs` module.
- Remove `Random` module.
- Remove `Log` module.
- Remove `Void` module.
- Remove `GeneratorL` module.
- Remove `number` module.
- Remove `Console` module.
- Remove `Crypto` module.
- Remove `Binary` module.
- Remove `Date` module.
- Remove `AsyncYield` module.
- Remove `Magma` module.
- Remove `Matrix` module.
- Remove `Option` module.
- Remove `Reader` module.
- Remove `ReaderEither` module.
- Remove `ReaderTask` module.
- Remove `ReaderTaskEither` module.
- Remove `ReadonlyTuple` module.
- Remove `TaskEither` module.
- Remove `Validation` module.
- Remove `Has` module.
- Remove `Aggregate` module.
- Remove `Eq` module.
- Remove `string` module.
- Remove `Error` module.
- Remove `ReadonlyRecord` module.
- Remove `ReadonlyArray` module.
- Remove unused functions from `Yield`, `ReadonlyArray`, `Type`, `function` and `struct` modules.

## [0.1.9](https://github.com/facile-it/fortepiano/compare/v0.1.8...v0.1.9) - 2024-05-14

### Security

- Fix CVE-2022-25883.

## [0.1.8](https://github.com/facile-it/fortepiano/compare/v0.1.7...v0.1.8) - 2023-07-10

### Added

- Complete the list of `Http` errors.

### Security

- Fix CVE-2022-46175.
- Fix CVE-2022-25881.
- Fix CVE-2023-26136.

## [0.1.7](https://github.com/facile-it/fortepiano/compare/v0.1.6...v0.1.7) - 2023-01-02

### Added

- Add `infix` to `string` module.

## [0.1.6](https://github.com/facile-it/fortepiano/compare/v0.1.5...v0.1.6) - 2022-09-30

### Added

- Add `collectWithIndex` function to `ReadonlyRecord` module.

## [0.1.5](https://github.com/facile-it/fortepiano/compare/v0.1.4...v0.1.5) - 2022-09-22

### Added

- Add `prefix` to `string` module.
- Add `suffix` to `string` module.

### Changed

- Changed overloads of `$mock.union` function.

### Fixed

- Update `yarn.lock` in order to fix "typescript (18.x)" and "jest (18.x)" jobs in CI.

## [0.1.4](https://github.com/facile-it/fortepiano/compare/v0.1.3...v0.1.4) - 2022-06-24

### Security

- Fix CVE-2022-33987.

## [0.1.3](https://github.com/facile-it/fortepiano/compare/v0.1.2...v0.1.3) - 2022-05-31

### Added

- Add `AggregateError` inspired from TC39.
- Add `decode` method to `Type` module to help wrapping `io-ts` `Errors` into an `Error` subclass.
- Add unit tests for the `set` function of the `Redis` module.
- Add `Has` module and enhance `ReaderTaskEither` for smart dependencies management (inspired by [Effect-TS](https://www.matechs.com/open-source)):

  ```typescript
  // Foo.ts
  import { TaskEither } from 'fp-ts/TaskEither'
  import { $has, $readerTaskEither } from 'fortepiano'

  export interface Foo {
    bar(a: number): TaskEither<Error, string>
  }

  export const TagFoo = $has.tag<Foo>()

  export const $foo = {
    bar: $readerTaskEither.derivesTaskEither(TagFoo, 'bar'),
  }
  ```

  ```typescript
  // Bar.ts
  import { IOEither } from 'fp-ts/IOEither'
  import { $has, $readerTaskEither } from 'fortepiano'

  export interface Bar {
    (a: string): IOEither<Error, boolean>
  }

  export const TagBar = $has.tag<Bar>()

  export const bar = $readerTaskEither.deriveIOEither(TagBar)
  ```

  ```typescript
  // index.ts
  import { $has } from 'fortepiano'
  import { ioEither, readerTaskEither, taskEither } from 'fp-ts'
  import { pipe } from 'fp-ts/function'
  import { TagBar, bar } from './Bar'
  import { $foo, TagFoo } from './Foo'

  // const a: ReaderTaskEither<Has<Foo> & Has<Bar>, Error, boolean>
  const a = pipe($foo.bar(42), readerTaskEither.chainW(bar))

  // const b: TaskEither<Error, boolean>
  const b = a(
    // Let's mock our dependencies.
    pipe(
      $has.singleton(TagFoo, { bar: () => taskEither.of('foobar') }),
      $has.upsertAt(TagBar, () => ioEither.of(true)),
    ),
  )
  ```

### Changed

- Replace `struct` type with `Struct`.
- Rename `GeneratorL` module to `Yield`.
- Use `cause` property to record wrapped errors (inspired by TC39).

### Deprecated

- Deprecate `struct` (use `Struct` instead).
- Deprecate `GeneratorL` module (use `Yield` instead).

### Fixed

- Decode from Json and then from the given codec in the `get` function of the `Redis` module.

## [0.1.2](https://github.com/facile-it/fortepiano/compare/v0.1.1...v0.1.2) - 2022-04-29

### Added

- Add `LICENSE.md`.
- Add `CONTRIBUTING.md`.
- Add `CHANGELOG.md`.

### Changed

- Relicense as MIT.
- Update `README.md`.

### Deprecated

- Deprecate `$got` (use `$axios` instead).

## [0.1.1](https://github.com/facile-it/fortepiano/compare/v0.1.0...v0.1.1) - 2022-04-26

### Added

- Support [tree shaking](https://webpack.js.org/guides/tree-shaking/) via top-level imports:
  ```typescript
  import { curry } from 'fortepiano/function'
  // ...instead of `import { curry } from 'fortepiano/lib/function'`
  ```

### Deprecated

- Discourage imports from `fortepiano/lib/*` as they break tree shaking.

## [0.1.0](https://github.com/facile-it/fortepiano/releases/tag/v0.1.0) - 2022-04-20

### Added

- First public release of `fortepiano`.
