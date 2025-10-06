# Bitcoin Signature Verifier

![dependency-free](https://img.shields.io/badge/dependencies-none-success)

A dependency-free Bitcoin message signature verifier that works in browsers and as a lightweight CLI.

## Publish

1. [Add messages to `payloads.json`](/edit/main/payloads.json)
2. Open a pull request

Github Actions will automatically verify the messages and comment the proof on the PR.

## Features

- **Zero Dependencies**: Pure TypeScript implementation with no external dependencies
- **Browser Compatible**: Works directly in modern browsers using ES modules
- **Client-Side Verification**: Verifies signatures entirely in the browser
- **Simple API**: Clean TypeScript interface for programmatic use
- **Unit Tests**: Includes a test suite for the verification logic

## Things you can do

### Offline

First visit the page by [Serving Locally](#serve-locally) or using our [GitHub Pages demo](https://mothepro.github.io/verify-bitcoin-message).

Then you can test offline mode in Chrome (webkit browsers) by opening Developer Tools (F12)

- Network
- Change "No Throttling" -> "Offline"

### Clone the repository

   Download [Bun](https://bun.sh), JS runtime

   ```bash
   git clone https://github.com/mothepro/verify-bitcoin-message
   cd verify-bitcoin-message
   bun install
   bun test
   ```

### Serve locally

   ```bash
   bun run build:browser
   python -m http.server 8000 static # Any "server" is fine, doesn't have to be python
   ```

   Unfortunately, opening the html file directly from the file system will not work.
   The browser's [built-in `crypto` libraries](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) are [not available](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) when running from the file system.

### CDN

   ```html
   <script type="module">
     import verify, { verifySafe } from 'https://unpkg.com/verify-bitcoin-message';
   </script>
   ```

### Command Line Interface

```bash
npx verify-bitcoin-message --json \
   --address 1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV \
   --message "This is an example of a signed message." \
   --signature "H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk="
```

### Programmatic Use

```bash
bun add verify-bitcoin-message # OR npm install verify-bitcoin-message
```

```typescript
import verify, { verifySafe } from 'verify-bitcoin-message';

await verify({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
})

// If you're not a fan of throwing errors:
const isValid = await verifySafe({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
})
```

## Deployment

This project uses GitHub Actions for automatic deployment:

### Production Deployment (GitHub Pages)

- **Automatic**: Deploys on every push to `main` branch
- **Tested**: Runs `bun test` before deployment
- **Built**: Runs `bun run build:browser` to create `verify.js`
- **Complete**: Includes both source files and built JavaScript in deployment

### PR Output Comments

- **Automatic**: Runs TypeScript code for every pull request
- **Immediate**: Executes `bun run verify.ts` and captures all output
- **Commented**: GitHub bot automatically comments on PRs with the complete output
- **Updated**: Output comment updates automatically when new commits are pushed to the PR
- **Transparent**: Shows both successful runs and error messages

#### Output System Features

- ✅ **Automatic execution** on PR open/update
- 📝 **Complete output capture** (stdout and stderr)
- 🤖 **Bot comments** with formatted output
- 🔄 **Live updates** with each commit
- 🐛 **Error visibility** for debugging

The workflow provides immediate feedback to contributors and reviewers by running the verification code and showing the results.

## Implementation Notes

This is a **complete, production-ready implementation** of Bitcoin message signature verification:

1. **Full secp256k1 implementation**: Complete elliptic curve operations from scratch
2. **Complete RIPEMD-160**: Pure TypeScript implementation following RFC 1320
3. **Complete signature recovery**: Handles all Bitcoin signature formats and recovery IDs
4. **Zero dependencies**: Works in browsers without any external dependencies

All cryptographic functions are implemented from publicly available specifications in pure TypeScript.

### Up Next

- [ ] My idea to prevent fake screenshots
- [ ] better error messages
- [ ] better ui (i.e. the signed page should look nice and doesn't need to be a form)
- [ ] more support for address types
- [ ] explainer what this is, how, and why (why cold storage >>> exchanges)
- [ ] service worker?
- [ ] allow invalid messages in prs?

### Alternatives

<https://www.bitcoin.com/tools/verify-message/>
<https://www.verifybitcoinmessage.com/>
<https://bluewallet.github.io/VerifySignature>
