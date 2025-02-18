<p align="center">
<img src="./logo.png" width=150px" height="auto"/>
</p>

# fortepiano [ˌfɔrteˈpjaːno]

_Playing actual music over `fp-ts` notes_ 🎶

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/facile-it/fortepiano/main)](https://github.com/facile-it/fortepiano/actions)
[![Codecov](https://img.shields.io/codecov/c/gh/facile-it/fortepiano)](https://app.codecov.io/gh/facile-it/fortepiano)
[![GitHub](https://img.shields.io/github/license/facile-it/fortepiano)](LICENSE.md)
[![npm](https://img.shields.io/npm/v/fortepiano)](https://www.npmjs.com/package/fortepiano)

## Description

Fortepiano is a mocking library for TypeScript. It promotes immutability, composability and purity, making it ideal for projects that embrace functional programming principles.

## Getting Started

### Installation

To install the stable version:

```bash
npm install fortepiano
```

or using yarn:

```bash
yarn add fortepiano
```

### Usage

Fortepiano uses a functional API to create and configure mocks, encouraging pure function usage and immutable mock objects.

Here's an example:

```typescript
import { $mock } from 'fortepiano'

interface User {
  firstName: string
  lastName: string
}

export const UserMock = (): $mock.Mock<User> =>
  $mock.struct({
    firstName: $mock.string,
    lastName: $mock.string,
  })

console.log(UserMock()()()) // Output: { firstName: 'randomString', lastName: 'randomString' }
```

## Contributing

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for details.

## Authors

- [Davide Caruso](https://github.com/davidecaruso)
- [Pier Roberto Lucisano](https://github.com/pierroberto)
- [Alberto Villa](https://github.com/xzhayon)

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
