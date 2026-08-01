# Talk-A-Tive frontend

The frontend is built with React 18, Vite, Chakra UI, and Socket.IO Client. Use
Node.js 22 to match the repository and deployment runtime.

```bash
npm install --legacy-peer-deps
npm start
```

The development server runs at `http://localhost:3000` and proxies `/api` and
Socket.IO traffic to `http://localhost:5000`.

Use `npm run build` to create the production bundle in `dist/`. The root
Express server serves this directory in a same-origin deployment.

Optional build-time overrides belong in `.env.local`:

```dotenv
VITE_API_URL=https://api.example.com
VITE_SOCKET_URL=https://api.example.com
```

Leave both unset when the frontend and API share an origin. Never put backend
secrets in a Vite environment variable because `VITE_*` values are included in
the browser bundle.
