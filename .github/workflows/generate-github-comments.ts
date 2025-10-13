import { homepage } from '../../package.json'
import payloads from '../../payloads.json'

/** Generate GitHub Markdown comments for verified messages */

const proof = new URL(homepage)
const mempool = new URL(`https://mempool.space`)

// https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#about-secondary-rate-limits

// TODO: move this logic to the yml so it can be tested easier
// and properly skip the signatures.

const data = []
for (const { address, message, signature } of payloads) {
  mempool.pathname = `address/${address}`
  proof.searchParams.set('address', address)
  proof.searchParams.set('message', message)
  proof.searchParams.set('signature', signature)
  data.push({
    address,
    message,
    signature,
    mempool,
    proof,
  })
}

console.log(JSON.stringify(data))
