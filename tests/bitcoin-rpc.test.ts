import { test, expect } from "bun:test";
import valid from "./valid.json"
import invalid from "./invalid.json"
import type { Payload } from '../verify';

const RPC_USER = process.env.RPC_USER || "user"
const RPC_PASSWORD = process.env.RPC_PASSWORD || "password"
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8332/"

let count = 0
for (const payload of valid)
  test(
    `valid signature ${++count}`,
    () => expect(rpcVerifySave(payload)).resolves.toBe(true)
  )

count = 0
for (const payload of invalid)
  test(
    `invalid signature ${++count}`,
    () => expect(rpcVerifySave(payload)).resolves.toBe(false)
  )


async function rpcVerifySave({ address, signature, message }: Payload) {
  // curl --user myusername --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "verifymessage", "params": ["1D1ZrZNe3JUo7ZycKEYQQiQAWd9y54F4XX", "signature", "my message"] }' -H 'content-type: text/plain;' http://127.0.0.1:8332/
  const url = new URL(RPC_URL)
  url.username = RPC_USER
  url.password = RPC_PASSWORD

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "1.0",
        id: "curltest",
        method: "verifymessage",
        params: [address, signature, message],
      }),
    })

    const json = await response.json()
    return json.result
  }
