import { expect, test } from "bun:test";
import { verifySafe } from '../verify';
import invalid from "./invalid.json";
import valid from "./valid.json";

let count = 0
for (const payload of valid)
  test(
    `js valid ${++count}`,
    async () => expect(await verifySafe(payload)).toBe(true)
  )

count = 0
for (const payload of invalid)
  test(
    `js invalid ${++count}`,
    async () => expect(await verifySafe(payload)).toBe(false)
  )
