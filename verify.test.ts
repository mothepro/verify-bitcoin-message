import { expect, test } from 'bun:test'
import payloads from './payloads.json'
import verify from './verify'

for (const { address, message, signature } of payloads) {
  test(`${address} signed "${message}"`, () =>
    expect(verify({ address, signature, message })).resolves.toBe(true))

  test(`${address} did not sign with whitespace padding`, () =>
    expect(verify({ address, signature, message: ` ${message}` })).rejects.toBeTruthy())

  test(`${address} did not sign with extra characters`, () =>
    expect(verify({ address, signature, message: `${message}.` })).rejects.toBeTruthy())

  test(`${address} did not sign with missing prefix`, () =>
    expect(verify({ address, signature, message: message.substring(1) })).rejects.toBeTruthy())

  test(`${address} did not sign with missing suffix`, () =>
    expect(
      verify({ address, signature, message: message.substring(0, message.length - 1) })
    ).rejects.toBeTruthy())

  test(`${address} did not sign something else`, () =>
    expect(
      verify({
        address,
        signature,
        message: message.substring(Math.floor(Math.random() * message.length)),
      })
    ).rejects.toBeTruthy())
}
