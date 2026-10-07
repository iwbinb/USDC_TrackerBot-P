# USDC_TrackerBot

Track native USDC payments, balances, and cross-chain progress in Telegram.

[Open the Bot](https://t.me/USDC_TrackerBot)

## Basic features

- Follow a public EVM address across multiple networks, with one entry per address.
- Add or remove a monitored network and apply the change immediately.
- View confirmed balances and choose a minimum amount for payment alerts.
- Receive concise incoming and outgoing payment notifications in English or Chinese.

Supported networks: **Arc, Ethereum, Base, Arbitrum, Optimism, Polygon PoS, Avalanche C-Chain, and Monad**. The Bot tracks official native USDC.

## Public code

This repository contains a small, offline core library with fictional examples. It does not run the hosted Bot or verify transactions on a network.

| Module | Function |
| --- | --- |
| `src/amounts.js` | Parse, format, and scale amounts with exact integer arithmetic |
| `src/watches.js` | Group networks under one address and manage monitoring slots |
| `src/balances.js` | Sum confirmed balances with different decimal precision |
| `src/notifications.js` | Filter payment alerts and format compact bilingual messages |

Amounts use `BigInt` or integer strings, never floating-point numbers. Balance inputs provide their own decimal precision. Unconfirmed balances stay unknown and make the result partial. Notification formatting uses plain text.

## Run locally

Requires **Node.js 22 or later**. No dependencies need to be installed.

```sh
npm test
npm run demo
```

The demo uses fictional wallet data and makes no network requests.
