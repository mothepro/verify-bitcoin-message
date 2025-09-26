import { expect, test } from "bun:test";
import verify from '../rpc';
import invalid from "./invalid-payloads.json";
import valid from "./valid-payloads.json";

let count = 0
for (const payload of valid)
  test(
    `rpc valid ${++count}`,
    () => expect(verify(payload)).resolves.toBe(true)
  )

count = 0
for (const payload of invalid)
  test(
    `rpc invalid ${++count}`,
    () => expect(verify(payload)).resolves.toBe(false)
  )
