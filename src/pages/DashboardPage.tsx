import React from 'react';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import {
  CalendarCheck, CalendarClock, Users, CheckCircle2,
  BedDouble,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DashboardPage = () => {
  const { bookings } = useApp();

  const upcoming = bookings.filter(b => b.status === 'upcoming');
  const active = bookings.filter(b => b.status === 'active');
  const completed = bookings.filter(b => b.status === 'completed');

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: 'text-primary' },
    { label: 'Upcoming', value: upcoming.length, icon: CalendarClock, color: 'text-warning' },
    { label: 'Active Stays', value: active.length, icon: Users, color: 'text-success' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-muted-foreground' },
  ];

  const roomStatus = [1, 2, 3, 4].map(num => {
    const activeBooking = bookings.find(b => b.roomNumber === num && b.status === 'active');
    return { number: num, occupied: !!activeBooking, guest: activeBooking?.guestName };
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'upcoming': return 'bg-warning/15 text-warning border-warning/20';
      case 'active': return 'bg-success/15 text-success border-success/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
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
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <BedDouble className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{b.guestName}</p>
                      <p className="text-xs text-muted-foreground">Room {b.roomNumber} • {format(new Date(b.checkIn), 'MMM d')} – {format(new Date(b.checkOut), 'MMM d')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room Status */}
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-lg font-serif font-medium text-foreground mb-4">Room Status</h2>
          <div className="space-y-3">
            {roomStatus.map(r => (
              <div key={r.number} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">Room {r.number}</p>
                  {r.guest && <p className="text-xs text-muted-foreground">{r.guest}</p>}
                </div>
                <Badge variant="outline" className={r.occupied ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}>
                  {r.occupied ? 'Occupied' : 'Available'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
