#!/usr/bin/env bun

import validPayloads from '../tests/valid-payloads.json'

interface Payload {
  address: string
  message: string
  signature: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

console.log(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitcoin Message Signature Test Cases</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f5f5f5;
        }

        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }

        .stats {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }

        tr:hover {
            background-color: #f8f9fa;
        }

        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }

        .verify-link {
            background: #007bff;
            color: white;
            padding: 6px 12px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.6em;
            transition: background-color 0.2s;
            margin-right: 10px;
        }

        .verify-link:hover {
            background: #0056b3;
        }

        .verify-message {
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 90%
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }

        .footer a {
            color: #007bff;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .container {
                padding: 20px;
            }

            table {
                font-size: 0.9em;
            }

            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Bitcoin Message Signature Test Cases</h1>
        <p class="subtitle">Valid signatures for testing Bitcoin message verification</p>

        <div class="stats">
            <strong>${validPayloads.length}</strong> test cases available
        </div>

        <ol>
            ${validPayloads
              .map(
                ({ address, message, signature }: Payload) => `
            <li>
                <a
                    href="https://mempool.space/address/${escapeHtml(address)}"
                    target="_blank"
                    class="verify-link"
                    rel="noopener noreferrer">
                    🌐
                </a>
                <a
                    href="./?${new URLSearchParams({ address, message, signature })}"
                    class="verify-message">
                    ${escapeHtml(message)}
                </a>
            </li>`
              )
              .join('')}
        </ol>

        <div class="footer">
            <p>
                Generated from <code>tests/valid-payloads.json</code> •
                <a href="index.html">Back to Verifier</a>
            </p>
        </div>
    </div>
</body>
</html>`)
// console.debug(`✅ Generated HTML with ${validPayloads.length} test cases`)
// console.debug(`📄 Saved to: ${outputPath}`)
