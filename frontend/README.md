# Talk-A-Tive frontend

The frontend is built with React and Vite.

```bash
npm install --legacy-peer-deps
npm start
```

The development server runs at `http://localhost:3000` and proxies `/api` and
Socket.IO traffic to `http://localhost:5000`.

Use `npm run build` to create the production bundle in `dist/`. Optional
runtime overrides belong in `.env.local` as `VITE_API_URL` and
`VITE_SOCKET_URL`.
