import * as Ei from 'fp-ts/Either'
import { constUndefined, pipe } from 'fp-ts/function'
import * as J from 'fp-ts/Json'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as Se from 'fp-ts/Semigroup'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import * as $Er from '../Error'
import * as $H from '../Http'
import * as $St from '../string'

const request = (
  _fetch: typeof fetch,
  method: $H.HttpMethod,
  url: string,
  options: $H.HttpOptions = {},
) =>
  TE.tryCatch(
    () =>
      _fetch(
        pipe(
          options.query,
          O.fromNullable,
          O.map(RR.map((value) => value.toString())),
          O.map((query) => new URLSearchParams(query)),
          O.map((params) => params.toString()),
          O.filter(NonEmptyString.is),
          O.match(
            () => url,
            (queryString) => `${url}?${queryString}`,
          ),
        ),
        {
          // eslint-disable-next-line no-nested-ternary
          body: options.json
            ? pipe(options.body, J.stringify, Ei.getOrElseW(constUndefined))
            : t.record(t.string, t.unknown).is(options.body)
            ? pipe(
                options.body,
                O.fromNullable,
                O.map(
                  RR.reduceWithIndex(new FormData(), (name, form, value) => {
                    if (t.union([t.boolean, t.number, t.string]).is(value)) {
                      form.append(name, value.toString())
                    }

                    return form
                  }),
                ),
                O.getOrElseW(constUndefined),
              )
            : undefined,
          headers: {
            ...options.headers,
            ...(options.json ? { 'Content-Type': 'application/json' } : null),
          },
          method,
        },
      ).then((response) =>
        (response.ok && options.json ? response.json() : response.text()).then(
          (body) => {
            const _response = {
              url: response.url,
              status: response.status,
              headers: pipe(
                [...response.headers.entries()],
                RR.fromFoldable(Se.last<string>(), RA.Foldable),
              ),
              body,
            }

            if (!response.ok) {
              const error = new Error(response.statusText)

              throw {
                name: error.name,
                message: error.message,
                stack: error.stack,
                response: _response,
              }
            }

            return _response
          },
        ),
      ),
    $Er.fromUnknown(
      Error(`Cannot make HTTP request "${$St.uppercase(method)} ${url}"`),
    ),
  )

export const $fetch = (_fetch: typeof fetch): $H.HttpClient => ({
  delete: (url, options) => request(_fetch, 'delete', url, options),
  get: (url, options) => request(_fetch, 'get', url, options),
  patch: (url, options) => request(_fetch, 'patch', url, options),
  post: (url, options) => request(_fetch, 'post', url, options),
  put: (url, options) => request(_fetch, 'put', url, options),
})
