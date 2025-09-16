import { test, expect } from "bun:test";
import {verifySafe} from '../verify';
import valid from "./valid.json"
import invalid from "./invalid.json"

let count = 0
for (const payload of valid)
  test(
    `valid signature ${++count}`,
    () => expect(verifySafe(payload)).toBe(true)
  )

count = 0
for (const payload of invalid)
  test(
    `invalid signature ${++count}`,
    () => expect(verifySafe(payload)).toBe(false)
  )
