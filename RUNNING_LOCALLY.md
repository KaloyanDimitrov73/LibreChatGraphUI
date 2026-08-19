# Running LibreChatGraphUI locally

This is a fork of [LibreChat](https://github.com/danny-avila/LibreChat) that adds
a graph-view panel (`api/server/routes/graph.js`, `api/server/services/GraphService.js`,
`client/src/components/Graph/*`) on top of the standard LibreChat app. Everything
below is the same as running upstream LibreChat, plus notes specific to the graph
feature.

There are two ways to run it: **Docker Compose** (closest to production, uses
whatever image is configured — good for just trying the app) and **manual local
dev** (runs your actual source files with hot reload — what you want if you're
editing the graph code). Pick one.

---

## Option A — Docker Compose (quickest, less useful for editing code)

### Prerequisites
- Docker Desktop (or Docker Engine + the Compose plugin)
- Git

### Steps

```bash
git clone https://github.com/KaloyanDimitrov73/LibreChatGraphUI.git
cd LibreChatGraphUI
cp .env.example .env
docker compose up -d
```

Open **http://localhost:3080**.

> **Note:** the default `docker-compose.yml` at the repo root pulls a prebuilt
> `registry.librechat.ai/danny-avila/librechat-dev:latest` image for the `api`
> service — it does **not** build from your local `api/`/`client/` source. That
> means changes made directly to files in this checkout (including the graph
> panel changes) won't show up through this path unless you also build a local
> image. If you're actively changing code — e.g. the graph feature — use
> **Option B** instead, since that's what actually runs your edited files.
>
> If you do want Docker to build from source, add a
> `docker-compose.override.yml` that replaces the `api` service's `image:` line
> with a `build: .` pointing at the repo's `Dockerfile`, then run
> `docker compose up -d --build`.

To stop:
```bash
docker compose down
```

---

## Option B — Manual local dev (recommended while working on the graph code)

This runs the Express API and the Vite dev server directly from source with
hot reload, so edits to files like `GraphPanel.tsx` or `GraphService.js` are
reflected immediately.

### Prerequisites
- **Node.js 24.16.0** (matches this repo's `.nvmrc` and `Dockerfile`). If you use
  [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install
  nvm use
  ```
- **npm 11.13.0** (pinned via `packageManager` in `package.json`; a recent npm
  will generally work, but match this version if you hit install issues)
- **MongoDB** running locally — either:
  - Docker: `docker run -d -p 27017:27017 --name librechat-mongo mongo:8.0.20`, or
  - a native MongoDB install (`mongod` running on the default port `27017`)
- **Meilisearch** (optional, but the app expects it if `SEARCH=true` in `.env`,
  which is the default). Easiest via Docker:
  ```bash
  docker run -d -p 7700:7700 --name librechat-meili \
    getmeili/meilisearch:v1.12.3 \
    meilisearch --master-key=DrhYf7zENyR6AlUCKmnz0eYASOQdl6zxH7s7MKFSfFCt
  ```
  (Match `MEILI_MASTER_KEY` to whatever is in your `.env`.) If you don't need
  search, set `SEARCH=false` in `.env` instead of running this.

### 1. Clone and install

```bash
git clone https://github.com/KaloyanDimitrov73/LibreChatGraphUI.git
cd LibreChatGraphUI
npm install
```

This installs across the npm workspaces (`api`, `client`, `packages/*`) defined
in the root `package.json`.

### 2. Configure environment

```bash
cp .env.example .env
```

The example file already ships with working default values for local dev
(`MONGO_URI`, `CREDS_KEY`/`CREDS_IV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`MEILI_MASTER_KEY`, etc.), so you don't strictly need to change anything to
get the app running. At minimum, confirm these match your setup:

```env
HOST=localhost
PORT=3080
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080
```

If you want to chat with a real model, add at least one provider API key
(e.g. `OPENAI_API_KEY=...` or `ANTHROPIC_API_KEY=...`) further down in `.env` —
this isn't required just to load the UI and view the graph panel, only to get
actual chat responses.

### Graph-feature-specific env (optional)

The graph panel works out of the box against the local in-memory demo graph in
`api/server/services/GraphService.js` — no extra configuration needed. If you
want `RetrievalService` to call a real external retrieval backend instead of
the local fallback, set:

```env
RETRIEVAL_API_URL=http://localhost:8000
```

Leave this unset to keep using the local demo graph (recommended unless you
have a real retrieval backend running separately, e.g. something like the
HubLink/SciGraphChat backend).

### 3. Build the shared packages

The client depends on a few workspace packages that need to be built first:

```bash
npm run build:data-provider
npm run build:data-schemas
npm run build:api
npm run build:client-package
```

(Or run `npm run build:packages` to do all four in one command.)

### 4. Start the backend

In one terminal:

```bash
npm run backend:dev
```

This runs `api/server/index.js` with `nodemon` under `NODE_ENV=development`,
restarting on file changes. It connects to MongoDB using `MONGO_URI` from
`.env` and serves the API on `PORT` (default `3080`).

### 5. Start the frontend

In a second terminal:

```bash
npm run frontend:dev
```

This starts the Vite dev server for `client/` (default **http://localhost:3090**
or similar — Vite will print the actual port). Requests to `/api/*` and
`/oauth/*` are proxied to the backend (`http://localhost:3080` by default, per
`client/vite.config.ts`), so the graph panel's `fetch('/api/graph/...')` calls
reach the Express server automatically — no CORS setup needed.

### 6. Open the app

Go to whatever URL the Vite dev server printed in step 5 (check that terminal's
output). Register/log in, start a conversation, ask something, then click
**"View Graph"** under a response to open the graph panel.

### Stopping

Ctrl+C in both terminals. If you started MongoDB/Meilisearch via `docker run`,
stop those containers too:

```bash
docker stop librechat-mongo librechat-meili
```

---

## Troubleshooting

- **`Please define the MONGO_URI environment variable`** — `.env` wasn't
  copied/loaded, or MongoDB isn't reachable at the URI in `.env`. Confirm
  Mongo is running (`docker ps` or `mongosh` should connect) and that you're
  running `backend:dev` from the repo root (so it picks up the root `.env`).
- **Client loads but every request 404s / graph panel never loads data** —
  make sure both the backend (`backend:dev`) *and* frontend (`frontend:dev`)
  are running at the same time, in separate terminals. The graph panel talks
  to the backend through the Vite proxy, so the backend has to be up.
- **`Load Neighbors` does nothing** — this was a real bug in earlier versions
  of this fork (RetrievalService.getNeighbors had no local fallback and
  silently swallowed the error). If you've pulled the latest graph service
  changes described in this conversation, it now falls back to the local demo
  graph automatically whenever `RETRIEVAL_API_URL` is unset — no action
  needed.
- **Graph node text is unreadable in dark mode** — also fixed in the same
  changes (`GraphPanel.css` now uses the app's `--text-primary` theme token
  instead of the browser default text color).
- **`npm install` fails on a workspace package** — delete `node_modules` and
  any `package-lock.json` conflicts, then retry; also confirm you're on Node
  24.x, since older Node versions can fail on some workspace dependencies.
