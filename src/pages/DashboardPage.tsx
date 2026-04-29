import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfDay, startOfMonth } from 'date-fns';
import {
  CalendarCheck, CalendarClock, ChevronLeft, ChevronRight, Users, CheckCircle2,
  BedDouble, PieChart as PieChartIcon, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRoomLabel } from '@/lib/utils';
import { Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const STATUS_COLORS = {
  upcoming: '#f59e0b',
  active: '#22c55e',
  completed: '#94a3b8',
  cancelled: '#f43f5e',
};

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
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  const monthlyTrendData = monthDays.map(day => {
    const dayBookings = monthlyBookings.filter(booking => isSameDay(startOfDay(booking.checkIn), day));
    return {
      day: format(day, 'd'),
      Upcoming: dayBookings.filter(booking => booking.liveStatus === 'upcoming').length,
      Active: dayBookings.filter(booking => booking.liveStatus === 'active').length,
      Completed: dayBookings.filter(booking => booking.liveStatus === 'completed').length,
      Cancelled: dayBookings.filter(booking => booking.liveStatus === 'cancelled').length,
    };
  }).filter(item => item.Upcoming || item.Active || item.Completed || item.Cancelled);

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

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-foreground">Monthly Booking Trend</h2>
              <p className="text-xs text-muted-foreground">Bookings created across the days of {format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="text-xs text-muted-foreground">Occupancy rate: <span className="font-medium text-foreground">{occupancyRate}%</span></div>
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
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Upcoming" stackId="a" fill={STATUS_COLORS.upcoming} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Active" stackId="a" fill={STATUS_COLORS.active} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" stackId="a" fill={STATUS_COLORS.completed} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cancelled" stackId="a" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
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
            <p className="text-xs text-muted-foreground">Guest names and room details for {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {monthlyBookingsForDisplay.length} booking{monthlyBookingsForDisplay.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {monthlyBookingsForDisplay.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/60 px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No bookings for this month</p>
            <p className="text-xs text-muted-foreground mt-1">Select another month to see guest names and booking details.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {monthlyBookingsForDisplay.map(booking => (
              <div key={booking.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{booking.guestName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getRoomLabel(rooms, booking.roomNumber)}</p>
                  </div>
                  <Badge variant="outline" className={statusColor(booking.liveStatus)}>
                    {booking.liveStatus}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Check-in: {format(booking.checkIn, 'dd MMM yyyy')}</p>
                  <p>Check-out: {format(booking.checkOut, 'dd MMM yyyy')}</p>
                  <p>Guests: {booking.adults + booking.children + booking.infants}{booking.pets > 0 ? ` + ${booking.pets} pet${booking.pets > 1 ? 's' : ''}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
