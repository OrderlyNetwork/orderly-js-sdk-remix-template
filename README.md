# Template for Orderly SDK v2 based on Remix

## Getting started

1. Clone the code:

```sh
git clone https://github.com/OrderlyNetwork/orderly-js-sdk-remix-template.git
cd orderly-js-sdk-remix-template
```

2. Install the dependencies

```sh
npm install
```

3. Development

Run the dev server:

```shellscript
npm run dev
```

4. Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

5. Create docker image

```sh
docker build -t orderly-js-sdk-remix-template .
```

## Docs

For more information, please visit the following link:

- [Orderly JS SDK](https://github.com/OrderlyNetwork/js-sdk)
- [SDK documentation](https://orderly.network/docs/sdks)


## Prediction routes

The canonical page routes are `/predict` and `/predict/:symbol` with the current
language prefix. SDK navigation still emits legacy `/prediction` hrefs;
the host navigation adapter maps them to `/predict`. Old direct links redirect
to the canonical page while preserving the encoded symbol, query, and hash.
Entries without a language prefix use the existing locale selection.

Orderly SDK dependencies are pinned to `3.3.1`.
