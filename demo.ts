import validPayloads from './payloads.json'
import verify, { assert, parsePayload } from './verify'

const form = document.getElementById('verifyForm') as HTMLFormElement
const nonAttemptedDisplay = document.querySelectorAll('.no-attempt-display')
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
const jsonStringifySelectAll = document.getElementById(
  'json-stringify-select-all'
) as HTMLButtonElement
const validPayloadsList = document.getElementById('valid-payloads') as HTMLOListElement
const busyElements = document.querySelectorAll('[aria-busy]')
const durationElements = document.querySelectorAll('[data-duration]')

// Nice
addressInput.addEventListener('focus', addressInput.select)
signatureInput.addEventListener('focus', signatureInput.select)
messageInput.addEventListener('paste', ({ clipboardData }) =>
  handleJsonPaste(clipboardData?.getData('text/plain')?.trim())
)
messageInput.addEventListener('paste', ({ clipboardData }) =>
  handleSignedMessagePaste(clipboardData?.getData('text/plain')?.trim())
)
messageInput.addEventListener('paste', ({ clipboardData }) =>
  handleSignedInputsIOMessagePaste(clipboardData?.getData('text/plain')?.trim())
)

const hiddenLimits = document.querySelectorAll('[data-threshold].hidden')
for (const el of hiddenLimits) {
  const limit = parseInt(el.getAttribute('data-threshold') ?? '0')
  if (validPayloads.length >= limit) el.classList.remove('hidden')
}

jsonStringifySelectAll.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(jsonStringifyPre.textContent)
  } catch (err) {
    const range = document.createRange()
    range.selectNodeContents(jsonStringifyPre)
    const sel = getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
})

// Set URL params to the UI Elements
const params = new URLSearchParams(location.search)
addressInput.value = params.get('address')?.trim() ?? ''
messageInput.value = params.get('message')?.trim() ?? ''
signatureInput.value = params.get('signature')?.trim() ?? ''

// Add valid payloads to the list

for (const [index, { address, message, signature }] of validPayloads.entries()) {
  const anchor = document.createElement('a')
  anchor.setAttribute('role', 'button')
  anchor.classList.add('outline', 'contrast', 'message')
  anchor.textContent = message
  // anchor.target = '_blank'
  // anchor.rel = 'noopener noreferrer'
  validPayloadsList.appendChild(anchor)

  // Get all elements that should link to this payload
  const anchors = [
    ...document.querySelectorAll(`[data-href-payload="${index}"]`),
  ] as HTMLAnchorElement[]
  anchors.push(anchor)

  // Set the href to the current URL with the payload params
  const url = new URL(location.href)
  url.searchParams.set('address', address)
  url.searchParams.set('message', message)
  url.searchParams.set('signature', signature)
  for (const a of anchors) a.href = url.toString()

  // Make relative links work offline
  for (const a of anchors) a.addEventListener('click', handlePayloadClick)
}

// Verify if we have a signature in the URL or whenever form is submitted
if (signatureInput.value) verifySignature()
form.addEventListener('submit', e => {
  e.preventDefault()
  return verifySignature()
})

function handlePayloadClick(e: PointerEvent) {
  const url = new URL((e.target as HTMLAnchorElement).href)
  messageInput.value = url.searchParams.get('message') ?? ''
  addressInput.value = url.searchParams.get('address') ?? ''
  signatureInput.value = url.searchParams.get('signature') ?? ''
  verifySignature()
  e.preventDefault()
  return false
}

function handleJsonPaste(maybeJson = '') {
  try {
    const { address, message, signature } = JSON.parse(maybeJson ?? '{}')
    console.log({ address, message, signature })
    if (address && message && signature) {
      addressInput.value = address
      messageInput.value = message
      signatureInput.value = signature
      verifySignature()
    }
  } catch (e) {}
}

function handleSignedMessagePaste(maybeSignedMessage = '') {
  const prefix = '-----BEGIN BITCOIN SIGNED MESSAGE-----'
  const signaturePrefix = '-----BEGIN BITCOIN SIGNATURE-----'
  const suffix = '-----END BITCOIN SIGNATURE-----'
  try {
    assert(maybeSignedMessage, 'Not a signed message')
    for (const line of [prefix, signaturePrefix, suffix]) {
      assert(maybeSignedMessage.includes(line), 'Not a signed message')
    }
    const mStart = prefix.length + maybeSignedMessage.indexOf(prefix)
    const mEnd = maybeSignedMessage.indexOf(signaturePrefix)
    const message = maybeSignedMessage.slice(mStart, mEnd).trim()

    const sStart = signaturePrefix.length + maybeSignedMessage.indexOf(signaturePrefix)
    const sEnd = maybeSignedMessage.indexOf(suffix)
    const addressAndSignature = maybeSignedMessage.slice(sStart, sEnd).trim()
    const [address, signature] = addressAndSignature.split('\n').map(line => line.trim())

    addressInput.value = address
    messageInput.value = message
    signatureInput.value = signature
    verifySignature()
  } catch (e) {}
}

// https://brainwalletx.github.io/#sign
function handleSignedInputsIOMessagePaste(maybeSignedMessage = '') {
  const prefix = '-----BEGIN BITCOIN SIGNED MESSAGE-----'
  const signaturePrefix = '-----BEGIN SIGNATURE-----'
  const suffix = '-----END BITCOIN SIGNED MESSAGE-----'
  try {
    assert(maybeSignedMessage, 'Not a signed message')
    for (const line of [prefix, signaturePrefix, suffix]) {
      assert(maybeSignedMessage.includes(line), 'Not a signed message')
    }
    const mStart = prefix.length + maybeSignedMessage.indexOf(prefix)
    const mEnd = maybeSignedMessage.indexOf(signaturePrefix)
    const message = maybeSignedMessage.slice(mStart, mEnd).trim()

    const sStart = signaturePrefix.length + maybeSignedMessage.indexOf(signaturePrefix)
    const sEnd = maybeSignedMessage.indexOf(suffix)
    const addressAndSignature = maybeSignedMessage.slice(sStart, sEnd).trim()
    const [address, signature] = addressAndSignature.split('\n').map(line => line.trim())

    addressInput.value = address
    messageInput.value = message
    signatureInput.value = signature
    verifySignature()
  } catch (e) {}
}

for (const key of [
  'verify-attempted-display',
  'verified-display',
  'error-display',
  'verify-completed-display',
]) {
  document.body.classList.add(`${key}-false`)
  document.body.classList.remove(`${key}-true`)
}

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

  for (const key of [
    'verify-attempted-display',
    'verified-display',
    'error-display',
    'verify-completed-display',
  ]) {
    document.body.classList.add(`${key}-false`)
    document.body.classList.remove(`${key}-true`)
  }

  document.body.classList.add('verify-attempted-display-true')
  document.body.classList.remove('verify-attempted-display-false')
  nonAttemptedDisplay.forEach(e => e.classList.add('hidden'))
  attemptedDisplay.forEach(e => e.classList.remove('hidden'))
  verifiedDisplay.forEach(e => e.classList.add('hidden'))
  errorDisplay.forEach(e => e.classList.add('hidden'))
  busyElements.forEach(e => e.setAttribute('aria-busy', 'true'))
  errorReason.textContent = ''
  verifiedAddressLink.textContent = ''
  verifiedMessageContent.textContent = ''
  verifiedAddressLink.href = 'https://mempool.space/address/'
  const startTime = performance.now() ?? Date.now()
  let endTime: number | undefined
  try {
    const isValid = await verify({ message: bytes, address, signature })
    assert(isValid, 'Signature is invalid')
    endTime = performance.now() ?? Date.now()

    document.body.classList.add('verified-display-true')
    document.body.classList.remove('verified-display-false')
    verifiedAddressLink.textContent = address
    verifiedAddressLink.href += address
    verifiedMessageContent.textContent = utf8
    verifiedDisplay.forEach(e => e.classList.remove('hidden'))
  } catch (error: unknown) {
    document.body.classList.add('error-display-true')
    document.body.classList.remove('error-display-false')
    errorReason.textContent = error instanceof Error ? error.message : String(error)
    errorDisplay.forEach(e => e.classList.remove('hidden'))
  } finally {
    if (!endTime) endTime = performance.now() ?? Date.now()
    const durationMs = endTime - startTime

    document.body.classList.add('verify-completed-display-true')
    document.body.classList.remove('verify-completed-display-false')
    completedDisplay.forEach(e => e.classList.remove('hidden'))
    busyElements.forEach(e => e.setAttribute('aria-busy', 'false'))
    durationElements.forEach(e => (e.textContent = `${durationMs.toFixed(2)}ms`))

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
