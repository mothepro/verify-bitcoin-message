#!/usr/bin/env bun

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import verify, { assert, type Payload } from './index.ts'
import validPayloads from './tests/valid-payloads.json'

const randomPayload = validPayloads[Math.floor(Math.random() * validPayloads.length)]
const anotherRandomPayload = validPayloads[Math.floor(Math.random() * validPayloads.length)]
const payloadToArgs = ({ address, message, signature }: Payload, full: boolean) => `${full ? '--address ' : '-a'} ${address} ${full ? '--message' : '-m'} "${message}" ${full ? '--signature' : '-s'} "${signature}"`

const cli = yargs(hideBin(process.argv))
  .scriptName('bitcoin-verify')
  .usage('$0 <command> [options]')
  .option('address', {
    alias: 'a',
    describe: 'Bitcoin address that signed the message',
    type: 'string',
    demandOption: true
  })
  .option('message', {
    alias: 'm',
    describe: 'Original message that was signed',
    type: 'string',
    demandOption: true
  })
  .option('signature', {
    alias: 's',
    describe: 'Base64-encoded signature',
    type: 'string',
    demandOption: true
  })
  .option('json', {
    alias: 'j',
    describe: 'Output result as JSON',
    type: 'boolean',
    default: false
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output with timing and other details',
    type: 'boolean',
    default: false
  })
  .example(`$0 ${payloadToArgs(randomPayload, false)}`, 'Verify a valid Bitcoin message signature')
  .example(`$0 --json ${payloadToArgs(anotherRandomPayload, true)}`, 'Verification with JSON output')
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .strict()

let valid = false
let duration = 0
let error: string | undefined
const { address, message, signature, json, verbose }  = await cli.parse()

if (verbose) {
  console.debug('Verifying Bitcoin message signature...')
  console.debug(`Address: ${address}`)
  console.debug(`Message: ${message}`)
  console.debug(`Signature: ${signature}`)
  console.debug()
}

try {
  const startTime = performance.now() ?? Date.now()
  valid = await verify({ address, message, signature })
  const endTime = performance.now() ?? Date.now()
  duration = endTime - startTime
  assert(valid, '❌ Signature is invalid')
  if (!json) {
    if (verbose) console.debug(`Verification completed in ${duration}ms`)
    console.log('✅ Signature is valid')
  }
} catch (e) {
  valid = false
  error = e instanceof Error ? e.message : String(e)
  if (!json) console.error(e)
} finally {
  if (json)
    console.log({
      valid,
      address,
      message,
      signature,
      duration,
      error
    })
  process.exit(valid ? 0 : 1) // Exit with appropriate code
}

