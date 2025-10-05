import { expect, test } from 'bun:test'
import payloads from './payloads.json'
import verify from './rpc'

let count = 0
for (const payload of payloads)
  test(`rpc valid ${++count}`, () => expect(verify(payload)).resolves.toBe(true))

count = 0
for (const payload of payloads)
  test(`rpc invalid ${++count}`, () => expect(verify(payload)).resolves.toBe(false))
