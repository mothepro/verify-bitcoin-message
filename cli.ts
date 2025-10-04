#!/usr/bin/env bun

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import validPayloads from './tests/valid-payloads.json'
import verify, { assert, parsePayload } from './verify.ts'

const cli = yargs(hideBin(process.argv))
  .scriptName('verify-bitcoin-message')
  .option('address', {
    alias: 'a',
    describe: 'Bitcoin address that signed the message',
    type: 'string',
    demandOption: true,
  })
  .option('message', {
    alias: 'm',
    describe: 'Original message that was signed',
    type: 'string',
    demandOption: true,
  })
  .option('signature', {
    alias: 's',
    describe: 'Base64-encoded signature',
    type: 'string',
    demandOption: true,
  })
  .option('json', {
    alias: 'j',
    describe: 'Output result as JSON',
    type: 'boolean',
    default: false,
  })
  .option('hex', {
    alias: 'h',
    describe: 'Interpret message as hex-encoded binary string',
    type: 'boolean',
    default: undefined,
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output with timing and other details',
    type: 'boolean',
    default: false,
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .strict()

const randomPayload = validPayloads[Math.floor(Math.random() * validPayloads.length)]
cli.example(
  [
    '$0',
    '--address',
    randomPayload.address,
    '--message',
    `"${randomPayload.message}"`,
    '--signature',
    `"${randomPayload.signature}"`,
  ].join(' '),
  'Verify a valid Bitcoin message signature'
)

const anotherRandomPayload = validPayloads[Math.floor(Math.random() * validPayloads.length)]
cli.example(
  [
    '$0',
    '--json',
    '-a',
    anotherRandomPayload.address,
    '-m',
    `"${anotherRandomPayload.message}"`,
    '-s',
    `"${anotherRandomPayload.signature}"`,
  ].join(' '),
  'Verification with JSON output'
)

let valid = false
let error: string | undefined
const { json, verbose, hex, ...payload } = await cli.parse()
const { address, signature, message: { bytes, utf8 } } = parsePayload(payload)

if (verbose)
  console.debug('Verifying Bitcoin message signature...', {
    address,
    signature,
    message: utf8,
  })

const startTime = performance.now() ?? Date.now()

try {
  valid = await verify({ address, message: bytes, signature })
  assert(valid, '❌ Signature is invalid')
  if (!json) console.log('✅ Signature is valid')
} catch (e) {
  console.error(e)
  error = e instanceof Error ? e.message : String(e)
}

const endTime = performance.now() ?? Date.now()
const durationMs = endTime - startTime
if (verbose) console.debug(`Completed in ${durationMs.toFixed(2)}ms`)

if (json)
  console.log(JSON.stringify({
    valid,
    address,
    message: utf8,
    signature,
    durationMs,
    error,
  }, null, 2))

const exitCode = valid ? 0 : 1
process.exit(exitCode)
