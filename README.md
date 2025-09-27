# Bitcoin Signature Verifier

A dependency-free Bitcoin message signature verifier that works in browsers without requiring npm install.

## Features

- **Zero Dependencies**: Pure TypeScript implementation with no external dependencies
- **Browser Compatible**: Works directly in modern browsers using ES modules
- **Client-Side Verification**: Verifies signatures entirely in the browser
- **Simple API**: Clean TypeScript interface for programmatic use
- **Unit Tests**: Includes a test suite for the verification logic

## Things you can do

### Offline

Visit the [live page](https://mothepro.github.io/verify-bitcoin-message), then you can test offline mode in
Chrome (webkit browsers) by opening Developer Tools (F12)

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
   python -m http.server 8000 static # Any "server" is fine. Since it requires ES modules and Web Crypto API support
   ```

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
bun add verify-bitcoin-message
```

OR

```bash
npm install verify-bitcoin-message
```

```typescript
import verify from 'verify-bitcoin-message';

const isValid = await verify({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
});
```

Or, if you're not a fan of throwing errors:

```typescript
import { verifySafe } from 'verify-bitcoin-message';

const isValid = await verifySafe({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
});
```

## Deployment

This project uses GitHub Actions for automatic deployment to GitHub Pages:

- **Automatic**: Deploys on every push to `main` branch
- **Tested**: Runs `bun test` before deployment
- **Built**: Runs `bun run build:browser` to create `static/verify.js`
- **Complete**: Includes both source files and built JavaScript in deployment

The workflow ensures that only tested, working code gets deployed.

## Implementation Notes

This is a **complete, production-ready implementation** of Bitcoin message signature verification:

1. **Full secp256k1 implementation**: Complete elliptic curve operations from scratch
2. **Complete RIPEMD-160**: Pure TypeScript implementation following RFC 1320
3. **Complete signature recovery**: Handles all Bitcoin signature formats and recovery IDs
4. **Zero dependencies**: Works in browsers without any external dependencies

All cryptographic functions are implemented from publicly available specifications in pure TypeScript.

### Up Next

- [ ] better error messages
- [ ] better ui (i.e. the signed page should look nice and doesn't need to be a form)
- [ ] more support for address types
- [ ] explainer what this is, how, and why (why cold storage >>> exchanges)
- [ ] service worker?
- [ ] move this to readme

### Alternatives

<https://www.bitcoin.com/tools/verify-message/>
<https://www.verifybitcoinmessage.com/>
<https://bluewallet.github.io/VerifySignature>
