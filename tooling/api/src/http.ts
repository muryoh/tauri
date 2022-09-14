// Copyright 2019-2022 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

/**
 * Access the HTTP client written in Rust.
 *
 * This package is also accessible with `window.__TAURI__.http` when [`build.withGlobalTauri`](https://tauri.app/v1/api/config/#buildconfig.withglobaltauri) in `tauri.conf.json` is set to `true`.
 *
 * The APIs must be allowlisted on `tauri.conf.json`:
 * ```json
 * {
 *   "tauri": {
 *     "allowlist": {
 *       "http": {
 *         "all": true, // enable all http APIs
 *         "request": true // enable HTTP request API
 *       }
 *     }
 *   }
 * }
 * ```
 * It is recommended to allowlist only the APIs you use for optimal bundle size and security.
 *
 * ## Security
 *
 * This API has a scope configuration that forces you to restrict the URLs and paths that can be accessed using glob patterns.
 *
 * For instance, this scope configuration only allows making HTTP requests to the GitHub API for the `tauri-apps` organization:
 * ```json
 * {
 *   "tauri": {
 *     "allowlist": {
 *       "http": {
 *         "scope": ["https://api.github.com/repos/tauri-apps/*"]
 *       }
 *     }
 *   }
 * }
 * ```
 * Trying to execute any API with a URL not configured on the scope results in a promise rejection due to denied access.
 *
 * @module
 */

import { invokeTauriCommand } from './helpers/tauri'

/**
 * Fetch a resource from the network. It returns a `Promise` that resolves to the
 * `Response` to that `Request`, whether it is successful or not.
 *
 * @example
 * ```typescript
 * const response = await fetch("http://my.json.host/data.json");
 * console.log(response.status);  // e.g. 200
 * console.log(response.statusText); // e.g. "OK"
 * const jsonData = await response.json();
 * ```
 */
async function fetch(
  input: URL | Request | string,
  init?: RequestInit
): Promise<Response> {
  let req = new Request(input, init)
  let buffer = await req.arrayBuffer()
  let reqData = buffer.byteLength ? Array.from(new Uint8Array(buffer)) : null

  type FetchResponse = {
    status: number
    statusText: string
    headers: [[string, string]]
    data: number[]
    url: string
  }

  const { data, status, statusText, headers, url } =
    await invokeTauriCommand<FetchResponse>({
      __tauriModule: 'Http',
      message: {
        cmd: 'fetch',
        method: req.method,
        url: req.url,
        headers: Array.from(req.headers.entries()),
        data: reqData
      }
    })

  const res = new Response(Uint8Array.from(data), {
    headers,
    status,
    statusText
  })

  Object.defineProperty(res, 'url', { value: url })

  return res
}

export { fetch }
