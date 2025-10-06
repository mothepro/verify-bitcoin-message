import { homepage } from '../../package.json'
import payloads from '../../payloads.json'

/** Generate GitHub Markdown comments for verified messages */

// https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#about-secondary-rate-limits
const limit = 75 // instead I should concat all the rest into the last comment

const escapeMarkdown = (str: string) => str.replace(/[\\`*_{}[\]()#+-.!>]/g, '\\$&')

for (const { address, message, signature } of payloads.slice(0, limit)) {
  for (const line of message.split('\n')) console.log(`> ${escapeMarkdown(line)}`)
  console.log()

  const proof = new URL(homepage)
  proof.searchParams.set('address', address)
  proof.searchParams.set('message', message)
  proof.searchParams.set('signature', signature)
  console.log(`[signed](${proof}) by [\\\`${address}\\\`](https://mempool.space/address/${address})`)
  console.log()
  console.log()
  console.log()
}
