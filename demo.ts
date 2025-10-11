import validPayloads from './payloads.json'
import verify, { assert, parsePayload } from './verify'

const form = document.getElementById('verifyForm') as HTMLFormElement
const heroDiv = document.getElementById('hero') as HTMLDivElement
const attemptedDisplay = document.querySelectorAll('.verify-attempted-display')
const verifiedDisplay = document.querySelectorAll('.verified-display')
const errorDisplay = document.querySelectorAll('.error-display')
const completedDisplay = document.querySelectorAll('.verify-completed-display')
const errorReason = document.getElementById('error-reason') as HTMLDivElement
const verifiedAddressLink = document.getElementById('verified-address-link') as HTMLAnchorElement
const verifiedMessageContent = document.getElementById('verified-message-content') as HTMLPreElement
const verifyDialog = document.getElementById('verify-dialog') as HTMLDialogElement
const addressInput = document.getElementById('address') as HTMLInputElement
const messageInput = document.getElementById('message') as HTMLTextAreaElement
const signatureInput = document.getElementById('signature') as HTMLInputElement
const blueWalletLink = document.getElementById('blue-wallet-link') as HTMLAnchorElement
const jsonStringifyPre = document.getElementById('json-stringify') as HTMLPreElement
const validPayloadsList = document.getElementById('valid-payloads') as HTMLOListElement

// Nice
addressInput.addEventListener('focus', addressInput.select)
signatureInput.addEventListener('focus', signatureInput.select)
messageInput.addEventListener('paste', ({ clipboardData }) => {
  const maybeJson = clipboardData?.getData('text/plain')
  try {
    console.log({ maybeJson })
    const { address, message, signature } = JSON.parse(maybeJson ?? '{}')
    console.log({ address, message, signature })
    if (address && message && signature) {
      addressInput.value = address
      messageInput.value = message
      signatureInput.value = signature
      verifySignature()
    }
  } catch (e) {}
})

//

// Set URL params to the UI Elements
const params = new URLSearchParams(location.search)
addressInput.value = params.get('address')?.trim() ?? ''
messageInput.value = params.get('message')?.trim() ?? ''
signatureInput.value = params.get('signature')?.trim() ?? ''

// Add valid payloads to the list

for (const [index, { address, message, signature }] of validPayloads.entries()) {
  const anchor = document.createElement('a')
  anchor.textContent = message
  // anchor.target = '_blank'
  // anchor.rel = 'noopener noreferrer'

  // Add to the list
  const li = document.createElement('li')
  li.appendChild(anchor)
  validPayloadsList.appendChild(li)

  // Get all elements that should link to this payload
  const anchors = [...document.querySelectorAll(`[data-payload="${index}"]`)] as HTMLAnchorElement[]
  anchors.push(anchor)

  // Set the href to the current URL with the payload params
  const url = new URL(location.href)
  url.searchParams.set('address', address)
  url.searchParams.set('message', message)
  url.searchParams.set('signature', signature)
  for (const a of anchors) a.href = url.toString()
}

// Verify if we have a signature in the URL or whenever form is submitted
if (signatureInput.value) verifySignature()
form.addEventListener('submit', e => {
  e.preventDefault()
  return verifySignature()
})

async function verifySignature() {
  const data = new FormData(form)
  const payload = {
    message: String(data.get('message')).trim(),
    address: String(data.get('address')).trim(),
    signature: String(data.get('signature')).trim(),
  }
  const {
    address,
    signature,
    message: { bytes, utf8, hex },
  } = parsePayload(payload)

  heroDiv.classList.add('hidden')
  attemptedDisplay.forEach(e => e.classList.remove('hidden'))
  verifiedDisplay.forEach(e => e.classList.add('hidden'))
  errorDisplay.forEach(e => e.classList.add('hidden'))
  document.querySelectorAll('[aria-busy]').forEach(e => e.setAttribute('aria-busy', 'true'))
  errorReason.textContent = ''
  verifiedAddressLink.textContent = ''
  verifiedMessageContent.textContent = ''
  verifiedAddressLink.href = 'https://mempool.space/address/'
  try {
    const isValid = await verify({ message: bytes, address, signature })
    assert(isValid, 'Signature is invalid')

    verifiedAddressLink.textContent = address
    verifiedAddressLink.href += address
    verifiedMessageContent.textContent = utf8
    verifiedDisplay.forEach(e => e.classList.remove('hidden'))
  } catch (error: unknown) {
    errorReason.textContent = error instanceof Error ? error.message : String(error)
    errorDisplay.forEach(e => e.classList.remove('hidden'))
  } finally {
    completedDisplay.forEach(e => e.classList.remove('hidden'))
    document.querySelectorAll('[aria-busy]').forEach(e => e.setAttribute('aria-busy', 'false'))

    verifyDialog.close()
    jsonStringifyPre.textContent = JSON.stringify({ address, signature, message: utf8 }, null, 2)

    // Update BlueWallet link
    const blueUrl = new URL(blueWalletLink.href)
    blueUrl.searchParams.set('a', address)
    blueUrl.searchParams.set('m', utf8)
    blueUrl.searchParams.set('s', signature)
    blueWalletLink.href = blueUrl.toString()

    // Update the URL with the current values
    const url = new URL(location.href)
    url.searchParams.set('address', address)
    url.searchParams.set('message', utf8)
    url.searchParams.set('signature', signature)
    if (hex) url.searchParams.set('isHex', 'on')

    // TODO update the "Other ways to verify"

    history.pushState('', '@mothepro', url.toString())
  }
}
