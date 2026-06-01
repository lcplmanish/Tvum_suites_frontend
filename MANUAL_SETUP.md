# Manual Setup Instructions

Since automatic installation has restrictions, please follow these manual steps:

## Step 1: Open Terminal

Open a PowerShell or Command Prompt in your project folder:

```
cd c:\Users\C2\Downloads\management\Tvum_suites_frontend
```

## Step 2: Install Dependencies

Run this command to install express and cors:

```bash
npm install express cors
```

This will add the packages to your `package.json` and `node_modules/`.

## Step 3: Verify Installation

Check that packages were installed:

```bash
npm ls express cors
```

## Step 4: Start Backend Server

In the **same folder**, run:

```bash
node server.js
```

You should see:
```
Airbnb proxy running on http://localhost:3001
Endpoint: http://localhost:3001/api/airbnb/ical?url=<ICAL_URL>
```

## Step 5: Start Frontend (in NEW terminal)

In a **new terminal window**, run:

```bash
npm run dev
```

The app will start on `http://localhost:5173`

## Step 6: Add Your Airbnb URL

Edit `src/lib/airbnb-config.ts` and replace this line:

```typescript
icalUrl: 'https://www.airbnb.com/calendar/ical/YOUR_LISTING_ID.ics?t=YOUR_TOKEN&locale=en-IN',
```

With your actual Airbnb iCal URL from step 1 of the main guide.

## Step 7: Log In

Go to `http://localhost:5173` and log in.

Auto-sync will happen automatically! ✅

---

## ✅ Both Servers Running

When working correctly, you should have:
- **Terminal 1:** Backend proxy running on port 3001
- **Terminal 2:** Frontend running on port 5173

Both need to be running for auto-sync to work!
