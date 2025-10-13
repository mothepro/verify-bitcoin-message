# Verify Bitcoin Message

[![free and open source](https://img.shields.io/badge/source-open-success")](https://github.com/mothepro/verify-bitcoin-message) [![External Dependencies](https://img.shields.io/badge/dependencies-None-success")](https://npmgraph.js.org/?q=verify-bitcoin-message) [![Offline First](https://img.shields.io/badge/Internet-Not_Required-success")](https://github.com/mothepro/verify-bitcoin-message?tab=readme-ov-file#offline) [![Bundle Size](https://img.shields.io/badge/Bundle_Size-14kb-success")](https://app.unpkg.com/verify-bitcoin-message/)

> A dependency-free Bitcoin message verifier that works in browsers and as a lightweight CLI.

Translations would be an incredible contribution now :)

## Published Messages

Any messages, from around the globe, can be added via [Pull Requests](../../pulls?q=is%3Apr+is%3Aopen+-is%3Adraft).

The verification process automatically hides invalid messages.

<!-- *Each fork is like its own "[community](../../forks)".* -->

## Things you can do

### Offline

First visit the page by [Serving Locally](#serve-locally) or using our [GitHub Pages demo](https://mothepro.github.io/verify-bitcoin-message).

If you're on mobile, just turn on airplane mode.

On desktop you can test offline mode in Chrome (webkit browsers) by opening Developer Tools (F12) > `Network` tab > Change `No Throttling` to `Offline`

### Clone the repository

   Download [Bun](https://bun.sh), JS runtime

   ```bash
   git clone https://github.com/mothepro/verify-bitcoin-message
   cd verify-bitcoin-message
   bun install # Tests will be run automatically after installation
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

### Up Next

- [ ] My idea to prevent fake screenshots :lightbulb:
- [ ] more support for address types
- [ ] explainer why cold storage >>> exchanges (you can use this)
- [ ] service worker? for full PWA
- [ ] **better example message**
- [ ] allow markdown in message? :eyes:
- [ ] wrap github gpg signatue with one of these
  - then we could have a nicer message in action with a verified signature, kinda like a blue checkmark on twitter

### Web Alternatives

- [Bitcoin.com](https://www.bitcoin.com/tools/verify-message/)
  ![Closed Source](https://img.shields.io/badge/source-closed-red)

- [Verify Bitcoin Message](https://www.verifybitcoinmessage.com/)
  ![Closed Source](https://img.shields.io/badge/source-closed-red)

- [BlueWallet's VerifySignature](https://bluewallet.github.io/VerifySignature?a=&m=&s=)
  ![Open Source](https://img.shields.io/badge/source-Open-success)
  ![Offline First](https://img.shields.io/badge/Internet-Not_Required-success)
  [![68 Dependencies](https://img.shields.io/badge/dependencies-68-yellow)](https://npmgraph.js.org/?q=bitcoinjs-message)
