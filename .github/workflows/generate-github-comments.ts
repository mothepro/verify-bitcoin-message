import { homepage } from '../../package.json'
import payloads from '../../payloads.json'

/** Generate GitHub Markdown comments for verified messages */

const escapeMarkdown = (str: string) => str.replace(/[\\`*_{}[\]()#+-.!>]/g, '\\$&')

for (const { address, message, signature } of payloads) {
  console.log('---')
  console.log()
  
  for (const line of message.split('\n')) console.log(`> ${escapeMarkdown(line)}`)
  console.log()

  const proof = new URL(homepage)
  proof.searchParams.set('address', address)
  proof.searchParams.set('message', message)
  proof.searchParams.set('signature', signature)
  console.log(`[signed](${proof}) by [\\\`${address}\\\`](https://mempool.space/address/${address})`)
  console.log()
}
