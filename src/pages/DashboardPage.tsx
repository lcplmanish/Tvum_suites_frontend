import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { differenceInCalendarDays, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';
import {
  CalendarCheck, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Users, CheckCircle2,
  BedDouble, PieChart as PieChartIcon, Sparkles, Hotel,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRoomLabel } from '@/lib/utils';
import { Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_COLORS = {
  upcoming: '#f59e0b',
  active: '#22c55e',
  completed: '#94a3b8',
  cancelled: '#f43f5e',
};

const BOOKING_SEGMENT_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#65a30d', '#0f766e', '#10b981', '#84cc16'];

const getLiveBookingStatus = (booking: { status: string; checkIn: Date; checkOut: Date }) => {
  if (booking.status === 'cancelled') return 'cancelled';

  const today = startOfDay(new Date()).getTime();
  const checkIn = startOfDay(booking.checkIn).getTime();
  const checkOut = startOfDay(booking.checkOut).getTime();

  if (today < checkIn) return 'upcoming';
  if (today > checkOut) return 'completed';
  return 'active';
};

const DashboardPage = () => {
  const { bookings, rooms } = useApp();
  const [selectedMonth, setSelectedMonth] = React.useState(() => new Date());
  const [expandedRooms, setExpandedRooms] = React.useState<number[]>([]);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const liveBookings = useMemo(
    () => bookings.map(booking => ({ ...booking, liveStatus: getLiveBookingStatus(booking) })),
    [bookings]
  );

  const monthlyBookings = liveBookings.filter(booking => {
    const checkIn = startOfDay(booking.checkIn);
    const checkOut = startOfDay(booking.checkOut);
    return checkIn <= monthEnd && checkOut >= monthStart;
  });
  const monthlyBookingsForDisplay = [...monthlyBookings].sort(
    (a, b) => a.checkIn.getTime() - b.checkIn.getTime() || a.createdAt.getTime() - b.createdAt.getTime()
  );
  const monthlyBookingsByRoom = rooms.map(room => {
    const roomBookings = monthlyBookingsForDisplay.filter(booking => booking.roomNumber === room.number);

    return {
      roomNumber: room.number,
      roomLabel: getRoomLabel(rooms, room.number),
      bookings: roomBookings,
    };
  }).filter(entry => entry.bookings.length > 0);

  const toggleRoom = (roomNumber: number) => {
    setExpandedRooms(prev => (
      prev.includes(roomNumber)
        ? prev.filter(number => number !== roomNumber)
        : [...prev, roomNumber]
    ));
  };

  const upcoming = liveBookings.filter(b => b.liveStatus === 'upcoming');
  const active = liveBookings.filter(b => b.liveStatus === 'active');
  const completed = liveBookings.filter(b => b.liveStatus === 'completed');
  const cancelled = liveBookings.filter(b => b.liveStatus === 'cancelled');

  const stats = [
    { label: 'Total Bookings', value: liveBookings.length, icon: CalendarCheck, color: 'text-primary' },
    { label: 'Upcoming', value: upcoming.length, icon: CalendarClock, color: 'text-warning' },
    { label: 'Active Stays', value: active.length, icon: Users, color: 'text-success' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-muted-foreground' },
  ];

  const monthlyStatusChartData = [
    { name: 'Upcoming', value: monthlyBookings.filter(booking => booking.liveStatus === 'upcoming').length, color: STATUS_COLORS.upcoming },
    { name: 'Active', value: monthlyBookings.filter(booking => booking.liveStatus === 'active').length, color: STATUS_COLORS.active },
    { name: 'Completed', value: monthlyBookings.filter(booking => booking.liveStatus === 'completed').length, color: STATUS_COLORS.completed },
    { name: 'Cancelled', value: monthlyBookings.filter(booking => booking.liveStatus === 'cancelled').length, color: STATUS_COLORS.cancelled },
  ].filter(item => item.value > 0);

  const monthlyTrendData = rooms.map(room => {
    const roomBookings = monthlyBookings.filter(booking => booking.roomNumber === room.number);
    const bookingDetails = roomBookings.map(booking => {
      const clippedStart = booking.checkIn > monthStart ? booking.checkIn : monthStart;
      const clippedEnd = booking.checkOut < monthEnd ? booking.checkOut : monthEnd;
      const daysInRange = Math.max(0, differenceInCalendarDays(startOfDay(clippedEnd), startOfDay(clippedStart)) + 1);

      return {
        id: booking.id,
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestsCount: booking.adults + booking.children + booking.infants,
        daysInRange,
      };
    }).sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

    const bookingSegments = bookingDetails.reduce((acc, booking, index) => {
      acc[`booking_${index + 1}`] = booking.daysInRange;
      return acc;
    }, {} as Record<string, number>);

    return {
      room: getRoomLabel(rooms, room.number),
      totalDays: bookingDetails.reduce((sum, booking) => sum + booking.daysInRange, 0),
      bookings: bookingDetails,
      ...bookingSegments,
    };
  }).filter(item => item.totalDays > 0);

  const maxBookingsPerSuite = monthlyTrendData.reduce((max, suite) => Math.max(max, suite.bookings.length), 0);
  const bookingSegmentKeys = Array.from({ length: maxBookingsPerSuite }, (_, index) => `booking_${index + 1}`);

  const roomStatus = rooms.map(room => {
    const liveActiveBooking = liveBookings.find(b => b.roomNumber === room.number && b.liveStatus === 'active');
    const liveUpcomingBooking = liveBookings.find(b => b.roomNumber === room.number && b.liveStatus === 'upcoming');
    return {
      number: room.number,
      occupied: !!liveActiveBooking,
      guest: liveActiveBooking?.guestName,
      nextGuest: liveUpcomingBooking?.guestName,
    };
  });

  const occupancyRate = rooms.length === 0 ? 0 : Math.round((roomStatus.filter(room => room.occupied).length / rooms.length) * 100);

  const statusColor = (s: string) => {
    switch (s) {
      case 'upcoming': return 'bg-warning/15 text-warning border-warning/20';
      case 'active': return 'bg-success/15 text-success border-success/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleMonthChange = (value: string) => {
    if (!value) return;
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const selectedMonthValue = format(selectedMonth, 'yyyy-MM');
  const totalSuiteNights = monthlyTrendData.reduce((sum, suite) => sum + suite.totalDays, 0);
  const averageSuiteNights = monthlyTrendData.length ? (totalSuiteNights / monthlyTrendData.length).toFixed(1) : '0.0';
  const topSuiteByDays = monthlyTrendData.length
    ? [...monthlyTrendData].sort((a, b) => b.totalDays - a.totalDays)[0]
    : null;

  const SuiteTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="max-w-[320px] rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.room}</p>
        <p className="text-xs text-muted-foreground mb-2">No. of Days: {data.totalDays}</p>
        <div className="space-y-2">
          {data.bookings.map((booking: any, index: number) => (
            <div key={booking.id} className="rounded-md border border-border bg-background p-2">
              <p className="text-xs font-medium text-foreground">Booking {index + 1}: {booking.guestName}</p>
              <p className="text-[11px] text-muted-foreground">Check-in: {format(booking.checkIn, 'dd MMM yyyy')}</p>
              <p className="text-[11px] text-muted-foreground">Check-out: {format(booking.checkOut, 'dd MMM yyyy')}</p>
              <p className="text-[11px] text-muted-foreground">No. of Guests: {booking.guestsCount}</p>
              <p className="text-[11px] text-muted-foreground">No. of Days: {booking.daysInRange}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Tvum apartments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="stat-card bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-lg font-serif font-medium text-foreground mb-4">Upcoming & Active</h2>
          {[...active, ...upcoming].length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming bookings.</p>
          ) : (
            <div className="space-y-3">
              {[...active, ...upcoming].map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg warm-gradient flex items-center justify-center text-white shadow-sm">
                      <BedDouble className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{b.guestName}</p>
                      <p className="text-xs text-muted-foreground">{getRoomLabel(rooms, b.roomNumber)} • {format(new Date(b.checkIn), 'MMM d')} – {format(new Date(b.checkOut), 'MMM d')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColor(b.liveStatus)}>{b.liveStatus}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Booking Status */}
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-serif font-medium text-foreground">Monthly Booking Status</h2>
              <p className="text-xs text-muted-foreground">{format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary/50"
                onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-secondary/50"
                onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Select month</span>
              <input
                type="month"
                value={selectedMonthValue}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>
          <div className="h-60">
            {monthlyStatusChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-background/60">
                <Sparkles className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No booking data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Bookings will appear here once guest info is added.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {monthlyStatusChartData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-lg font-serif font-medium text-foreground mb-4">Room Status</h2>
          <div className="space-y-3">
            {roomStatus.map(r => (
              <div key={r.number} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">{getRoomLabel(rooms, r.number)}</p>
                  {r.guest && <p className="text-xs text-muted-foreground">Current: {r.guest}</p>}
                  {!r.guest && r.nextGuest && <p className="text-xs text-muted-foreground">Next: {r.nextGuest}</p>}
                </div>
                <Badge variant="outline" className={r.occupied ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}>
                  {r.occupied ? 'Occupied' : 'Available'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="relative lg:col-span-2 overflow-hidden bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-green-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-foreground">Monthly Booking Trend</h2>
              <p className="text-xs text-muted-foreground">Suites on X-axis and No. of Days on Y-axis for {format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="text-xs text-muted-foreground">Occupancy rate: <span className="font-medium text-foreground">{occupancyRate}%</span></div>
          </div>

          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-muted-foreground">Top Suite</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Hotel className="h-3.5 w-3.5 text-primary" />
                {topSuiteByDays ? topSuiteByDays.room : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-muted-foreground">Total Suite Nights</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{totalSuiteNights}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-muted-foreground">Avg Nights / Suite</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{averageSuiteNights}</p>
            </div>
          </div>

          <div className="h-72">
            {monthlyTrendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-background/60">
                <Sparkles className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No monthly trend yet</p>
                <p className="text-xs text-muted-foreground mt-1">The graph will populate as bookings appear in this month.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 14, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148,163,184,0.22)" />
                  <XAxis dataKey="room" tick={{ fontSize: 12 }} interval={0} height={44} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(34,197,94,0.08)' }} content={<SuiteTooltip />} />
                  <Legend />
                  {bookingSegmentKeys.map((key, index) => (
                    <Bar
                      key={key}
                      name={`Booking ${index + 1}`}
                      dataKey={key}
                      stackId="suiteBookings"
                      fill={BOOKING_SEGMENT_COLORS[index % BOOKING_SEGMENT_COLORS.length]}
                      barSize={30}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-muted-foreground">Month bookings</p>
              <p className="text-lg font-semibold text-foreground mt-1">{monthlyBookings.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-muted-foreground">Active now</p>
              <p className="text-lg font-semibold text-foreground mt-1">{active.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-muted-foreground">Upcoming</p>
              <p className="text-lg font-semibold text-foreground mt-1">{upcoming.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold text-foreground mt-1">{completed.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-serif font-medium text-foreground">Monthly Bookings</h2>
            <p className="text-xs text-muted-foreground">Suite-wise booking details for {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {monthlyBookingsForDisplay.length} booking{monthlyBookingsForDisplay.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {monthlyBookingsByRoom.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/60 px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No bookings for this month</p>
            <p className="text-xs text-muted-foreground mt-1">Select another month to see suite-wise booking details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Suite (Room)</TableHead>
                  <TableHead>Booking Details</TableHead>
                  <TableHead className="w-[120px] text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyBookingsByRoom.map(entry => (
                  <TableRow key={entry.roomNumber}>
                    <TableCell className="font-medium align-top whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleRoom(entry.roomNumber)}
                        className="flex items-center gap-2 text-left text-foreground hover:text-primary transition-colors"
                        aria-expanded={expandedRooms.includes(entry.roomNumber)}
                      >
                        {expandedRooms.includes(entry.roomNumber) ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        )}
                        <span>{entry.roomLabel}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      {expandedRooms.includes(entry.roomNumber) ? (
                        <div className="space-y-3">
                          {entry.bookings.map(booking => (
                            <div key={booking.id} className="rounded-lg border border-border bg-background p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{booking.guestName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{getRoomLabel(rooms, booking.roomNumber)}</p>
                                </div>
                                <Badge variant="outline" className={statusColor(booking.liveStatus)}>
                                  {booking.liveStatus}
                                </Badge>
                              </div>

                              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                <p>Check-in: {format(booking.checkIn, 'dd MMM yyyy')}</p>
                                <p>Check-out: {format(booking.checkOut, 'dd MMM yyyy')}</p>
                                <p>Guests: {booking.adults + booking.children + booking.infants}{booking.pets > 0 ? ` + ${booking.pets} pet${booking.pets > 1 ? 's' : ''}` : ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{entry.bookings.length} booking{entry.bookings.length !== 1 ? 's' : ''} hidden</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {entry.bookings.length}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
