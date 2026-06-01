# Cloudflare Deploy Steps

This repo is set up so you can deploy from the command line without GitHub.

## 1. Install Wrangler

```powershell
npm install
npm install -g wrangler
wrangler login
```

## 2. Build and deploy the frontend to Cloudflare Pages

```powershell
npm run build
npm run deploy:pages
```

The frontend build reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your local `.env` file before `npm run build`, so you do not need GitHub or Cloudflare Pages env vars for this local deploy flow.

## 3. Deploy the ICS API Worker

```powershell
npm run deploy:worker
```

Set these Worker secrets:

```powershell
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## 4. Test the ICS feed

```powershell
curl.exe -i "https://your-domain.example/api/calendar/rooms/all"
```

Per-room example:

```powershell
curl.exe -i "https://your-domain.example/api/calendar/rooms/1"
```

## 5. Add it to Airbnb

Paste the public HTTPS ICS URL into Airbnb's external calendar import field.

Example:

```text
https://your-domain.example/api/calendar/rooms/all
```