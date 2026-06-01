// Backend server for Airbnb iCal proxy
// This solves CORS issues by fetching from Airbnb server-side

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
// Enable CORS for frontend
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://192.168.3.130:8080'  // Network IP address
];

// Add production domain if specified
if (process.env.PRODUCTION_DOMAIN) {
  corsOrigins.push(`https://${process.env.PRODUCTION_DOMAIN}`);
  corsOrigins.push(`https://www.${process.env.PRODUCTION_DOMAIN}`);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json());

/**
 * Proxy endpoint for Airbnb iCal
 * GET /api/airbnb/ical?url=<ICAL_URL>
 * 
 * Usage from frontend:
 * fetch('http://localhost:3001/api/airbnb/ical?url=' + encodeURIComponent(icalUrl))
 */
app.get('/api/airbnb/ical', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    console.log(`[PROXY] Fetching from Airbnb: ${url.substring(0, 80)}...`);

    // Fetch from Airbnb (server-side, no CORS issues)
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[PROXY] Airbnb returned ${response.status}`);
        return res.status(response.status).json({ 
          error: `Airbnb returned ${response.status}` 
        });
      }

      const icalData = await response.text();
      console.log(`[PROXY] Successfully fetched ${icalData.length} bytes from Airbnb`);

      // Return as calendar file
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
      res.send(icalData);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[PROXY] Request timeout (10s)');
        return res.status(504).json({ error: 'Request timeout' });
      }
      
      console.error('[PROXY] Fetch error:', fetchError.message);
      throw fetchError;
    }
  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    res.status(500).json({ error: `Failed to fetch from Airbnb: ${error.message}` });
  }
});

/**
 * Serve generated ICS calendar for a specific room or for all rooms
 * GET /api/calendar/rooms/:roomNumber
 * GET /api/calendar/all
 * Requires environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
app.get('/api/calendar/rooms/:roomNumber?', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase URL or service role key not configured on server' });
    }

    const roomNumber = req.params.roomNumber;
    const fetchOptions = {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    };

    // Helper: format YYYY-MM-DD and time string to ICS UTC datetime
    const formatDateToIcs = (dateStr, timeStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
      const pad = (n) => String(n).padStart(2, '0');
      return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
    };

    // Fetch rooms (used for labels)
    const roomsResp = await fetch(`${supabaseUrl}/rest/v1/rooms?select=number,name`, fetchOptions);
    if (!roomsResp.ok) throw new Error('Failed to fetch rooms');
    const rooms = await roomsResp.json();

    // Build bookings query
    let bookingsUrl = `${supabaseUrl}/rest/v1/bookings?select=*,room_number,guest_name,check_in,check_out,check_in_time,check_out_time,notes,status,adults,children,infants,phone,created_at&order=check_in.asc`;
    if (roomNumber && roomNumber !== 'all') {
      bookingsUrl += `&room_number=eq.${encodeURIComponent(roomNumber)}`;
    }
    bookingsUrl += `&status=neq.cancelled`;

    const bookingsResp = await fetch(bookingsUrl, fetchOptions);
    if (!bookingsResp.ok) throw new Error('Failed to fetch bookings');
    const bookings = await bookingsResp.json();

    // Map bookings to VEVENTs
    const events = bookings.map(b => {
      const room = rooms.find(r => r.number === b.room_number) || { name: `Room ${b.room_number}` };
      const inTime = b.check_in_time || '14:00';
      const outTime = b.check_out_time || '11:00';
      const dtstart = formatDateToIcs(b.check_in, inTime);
      const dtend = formatDateToIcs(b.check_out, outTime);
      const uid = `booking-${b.id}@tvum-suites.local`;
      const dtstamp = formatDateToIcs((new Date()).toISOString().slice(0,10), '00:00');

      const description = [`Guest: ${b.guest_name || 'N/A'}`, `Phone: ${b.phone || 'N/A'}`, `Adults: ${b.adults || 0}`, `Children: ${b.children || 0}`, `Infants: ${b.infants || 0}`, `Notes: ${b.notes || ''}`].join('\n');

      return {
        uid,
        dtstamp,
        dtstart,
        dtend,
        summary: `${room.name} - ${b.guest_name || 'Reservation'}`,
        description: description.replace(/\r?\n/g, '\\n'),
        location: room.name,
        status: (b.status === 'cancelled') ? 'CANCELLED' : 'CONFIRMED',
      };
    });

    // Build ICS
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const title = roomNumber && roomNumber !== 'all' ? `TVUM Suites - Room ${roomNumber}` : 'TVUM Suites - All Rooms';
    const description = title + ' - generated calendar of bookings';

    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TVUM Suites//Room Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:${title}\r\nX-WR-CALDESC:${description}\r\nX-WR-TIMEZONE:Asia/Kolkata\r\nDTSTAMP:${dtstamp}\r\n`;

    events.forEach(e => {
      ics += `BEGIN:VEVENT\r\nUID:${e.uid}\r\nDTSTAMP:${e.dtstamp}\r\nDTSTART:${e.dtstart}\r\nDTEND:${e.dtend}\r\nSUMMARY:${e.summary}\r\nDESCRIPTION:${e.description}\r\nLOCATION:${e.location}\r\nSTATUS:${e.status}\r\nSEQUENCE:0\r\nEND:VEVENT\r\n`;
    });

    ics += `END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tvum-calendar-${roomNumber || 'all'}.ics"`);
    res.send(ics);
  } catch (err) {
    console.error('[CALENDAR] Error generating ICS:', err.message);
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Airbnb proxy running on http://localhost:${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/airbnb/ical?url=<ICAL_URL>`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});
