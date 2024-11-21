# inquisition.observer

Connects to a local Bitcoin signet node and displays a list of all transactions
that use one of the soft forks activated in Bitcoin Inquisition.

## Running

You will need [Node.js](https://nodejs.org) and
[Yarn](https://classic.yarnpkg.com).

Install dependencies:

```
yarn
```

Create a .env file with your environment variables:

```properties
DATABASE_URL=local.db
BITCOIN_RPC_AUTH=user:password
BITCOIN_RPC_HOST=http://127.0.0.1:38332
BITCOIN_ZMQ_PUB_HASHBLOCK=tcp://127.0.0.1:38334
```

Run a local dev server:

```
yarn dev
```

Build for production:

```
yarn build
```
