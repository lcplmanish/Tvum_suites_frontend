const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatIcsTimestamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatDateTime(dateString, timeString = '00:00') {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

function escapeIcs(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function normalizePathname(pathname) {
  const clean = pathname.replace(/\/+/g, '/');
  if (clean.endsWith('.ics')) {
    return clean.slice(0, -4);
  }
  return clean;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function buildIcs({ title, description, events }) {
  const now = new Date();
  const dtstamp = formatIcsTimestamp(now);

  let output = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TVUM Suites//Calendar Feed//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:${escapeIcs(title)}\r\nX-WR-CALDESC:${escapeIcs(description)}\r\nX-WR-TIMEZONE:Asia/Kolkata\r\nDTSTAMP:${dtstamp}\r\n`;

  for (const event of events) {
    output += `BEGIN:VEVENT\r\nUID:${event.uid}\r\nDTSTAMP:${event.dtstamp}\r\nDTSTART:${event.dtstart}\r\nDTEND:${event.dtend}\r\nSUMMARY:${escapeIcs(event.summary)}\r\nDESCRIPTION:${escapeIcs(event.description)}\r\nLOCATION:${escapeIcs(event.location)}\r\nSTATUS:${event.status}\r\nSEQUENCE:0\r\nEND:VEVENT\r\n`;
  }

  output += 'END:VCALENDAR';
  return output;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function getSupabaseData(env, roomNumber) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: 'application/json',
  };

  const rooms = await fetchJson(`${env.SUPABASE_URL}/rest/v1/rooms?select=number,name&order=number.asc`, headers);

  let bookingsUrl = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,room_number,guest_name,check_in,check_out,check_in_time,check_out_time,notes,status,adults,children,infants,phone&order=check_in.asc`;
  if (roomNumber && roomNumber !== 'all') {
    bookingsUrl += `&room_number=eq.${encodeURIComponent(roomNumber)}`;
  }
  bookingsUrl += '&status=neq.cancelled';

  const bookings = await fetchJson(bookingsUrl, headers);

  const events = bookings.map((booking) => {
    const room = rooms.find((item) => Number(item.number) === Number(booking.room_number)) || {
      name: `Room ${booking.room_number}`,
    };

    const checkInTime = booking.check_in_time || '14:00';
    const checkOutTime = booking.check_out_time || '11:00';

    return {
      uid: `booking-${booking.id}@tvum-suites.local`,
      dtstamp: formatIcsTimestamp(new Date()),
      dtstart: formatIcsTimestamp(formatDateTime(booking.check_in, checkInTime)),
      dtend: formatIcsTimestamp(formatDateTime(booking.check_out, checkOutTime)),
      summary: `${room.name} - ${booking.guest_name || 'Reservation'}`,
      description: [
        `Guest: ${booking.guest_name || 'N/A'}`,
        `Phone: ${booking.phone || 'N/A'}`,
        `Adults: ${booking.adults || 0}`,
        `Children: ${booking.children || 0}`,
        `Infants: ${booking.infants || 0}`,
        `Notes: ${booking.notes || ''}`,
      ].join('\n'),
      location: room.name,
      status: booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
    };
  });

  const title = roomNumber && roomNumber !== 'all' ? `TVUM Suites - Room ${roomNumber}` : 'TVUM Suites - All Rooms';
  const description = 'Generated booking calendar for TVUM Suites';

  return buildIcs({ title, description, events });
}

async function proxyAirbnbIcal(request) {
  const url = new URL(request.url);
  const icalUrl = url.searchParams.get('url');

  if (!icalUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(icalUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/calendar, text/plain, */*',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Airbnb returned ${response.status}` }), {
        status: response.status,
        headers: jsonHeaders,
      });
    }

    const icalData = await response.text();
    return new Response(icalData, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Request timeout'
      : `Failed to fetch from Airbnb: ${error instanceof Error ? error.message : 'Unknown error'}`;

    return new Response(JSON.stringify({ error: message }), {
      status: error instanceof Error && error.name === 'AbortError' ? 504 : 500,
      headers: jsonHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request);
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const pathname = normalizePathname(url.pathname);

    if (pathname === '/health') {
      return withCors(new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: jsonHeaders }), request);
    }

    if (pathname === '/api/airbnb/ical') {
      return withCors(await proxyAirbnbIcal(request), request);
    }

    if (pathname.startsWith('/api/calendar/rooms/')) {
      const roomSegment = pathname.replace('/api/calendar/rooms/', '') || 'all';
      try {
        const ics = await getSupabaseData(env, roomSegment);
        return withCors(
          new Response(ics, {
            status: 200,
            headers: {
              'Content-Type': 'text/calendar; charset=utf-8',
              'Content-Disposition': `attachment; filename="tvum-calendar-${roomSegment}.ics"`,
            },
          }),
          request
        );
      } catch (error) {
        return withCors(
          new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate calendar' }), {
            status: 500,
            headers: jsonHeaders,
          }),
          request
        );
      }
    }

    return withCors(new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders }), request);
  },
};