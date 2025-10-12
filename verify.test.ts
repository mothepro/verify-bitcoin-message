import { expect, test } from 'bun:test'
import payloads from './payloads.json'
import verify from './verify'

test(`Test payloads available`, () => expect(payloads.length).not.toBeArrayOfSize(0))

for (const { address, message, signature } of payloads) {
  test(`${address} signed "${message}"`, () =>
    expect(verify({ address, signature, message })).resolves.toBe(true))

  // TODO add more!!
  // Any mutation should always fail
  const tamperAttempts = new Map([
    [
      `${address} did not sign with whitespace padding`,
      { address, signature, message: ` ${message}` },
    ],
    [
      `${address} did not sign with extra characters`,
      { address, signature, message: `${message}.` },
    ],
    [
      `${address} did not sign with missing prefix`,
      { address, signature, message: message.substring(1) },
    ],
    [
      `${address} did not sign with missing suffix`,
      { address, signature, message: message.substring(0, message.length - 1) },
    ],
    [
      `${address} did not sign a substring`,
      {
        address,
        signature,
        message: message.substring(1 + Math.floor(Math.random() * message.length)),
      },
    ],
  ])

  for (const [title, payload] of tamperAttempts)
    test(title, () => expect(verify(payload)).rejects.toBeTruthy())
}
