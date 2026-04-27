import React, { useState, useMemo } from 'react';
import { useApp, Booking } from '@/context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Users, CalendarIcon, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ROOM_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-[hsl(78, 50%, 61%)]', text: 'text-[hsl(30,10%,15%)]', label: 'Gold' },
  2: { bg: 'bg-[hsl(344, 83%, 73%)]', text: 'text-[hsl(30,10%,15%)]', label: 'Beige' },
  3: { bg: 'bg-[hsl(25, 67%, 62%)]', text: 'text-[hsl(36,33%,97%)]', label: 'Brown' },
  4: { bg: 'bg-[hsl(180, 59%, 37%)]', text: 'text-[hsl(36,33%,97%)]', label: 'Dark' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const BookingCalendar: React.FC = () => {
  const { bookings } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const bookingsInMonth = useMemo(() => {
    return bookings.filter(b => {
      const ci = startOfDay(b.checkIn);
      const co = startOfDay(b.checkOut);
      return ci <= monthEnd && co >= monthStart;
    });
  }, [bookings, monthStart, monthEnd]);

  const getBookingsForDay = (day: Date) => {
    return bookingsInMonth.filter(b => {
      const ci = startOfDay(b.checkIn);
      const co = startOfDay(b.checkOut);
      return day >= ci && day <= co;
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-serif font-medium text-foreground">Booking Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Room Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(ROOM_COLORS).map(([num, color]) => (
          <div key={num} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm {color.bg}`} />
            <span className="text-xs text-muted-foreground">Room {num}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        {WEEKDAYS.map(d => (
          <div key={d} className="bg-secondary/50 text-center py-2 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Empty padding */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card min-h-[80px] md:min-h-[100px]" />
        ))}

        {/* Days */}
        {days.map(day => {
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`bg-card min-h-[80px] md:min-h-[100px] p-1 ${isToday ? 'ring-1 ring-inset ring-primary/50' : ''}`}>
              <span className={`text-xs font-medium block mb-0.5 px-1 ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => {
                  const colors = ROOM_COLORS[b.roomNumber] || ROOM_COLORS[1];
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`w-full text-left px-1 py-0.5 rounded text-[10px] md:text-xs truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <span className="hidden md:inline">{b.guestName} - R{b.roomNumber}</span>
                      <span className="md:hidden">R{b.roomNumber}</span>
                    </button>
                  );
                })}
                {dayBookings.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Agenda View */}
      <div className="mt-6 md:hidden">
        <h3 className="text-sm font-medium text-foreground mb-3">This Month's Bookings</h3>
        {bookingsInMonth.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings this month.</p>
        ) : (
          <div className="space-y-2">
            {bookingsInMonth.map(b => {
              const colors = ROOM_COLORS[b.roomNumber] || ROOM_COLORS[1];
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                    <span className="text-sm font-medium text-foreground">{b.guestName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Room {b.roomNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(b.checkIn, 'MMM d')} — {format(b.checkOut, 'MMM d, yyyy')}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${ROOM_COLORS[selectedBooking.roomNumber]?.bg || 'bg-muted'}`} />
                <span className="text-base font-semibold text-foreground">{selectedBooking.guestName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Room</p>
                  <p className="font-medium text-foreground">Room {selectedBooking.roomNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="font-medium text-foreground capitalize">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Check-in</p>
                  <p className="font-medium text-foreground">{format(selectedBooking.checkIn, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Check-out</p>
                  <p className="font-medium text-foreground">{format(selectedBooking.checkOut, 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Guests</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {selectedBooking.adults} Adult{selectedBooking.adults !== 1 ? 's' : ''}</span>
                  {selectedBooking.children > 0 && <span>{selectedBooking.children} Child{selectedBooking.children !== 1 ? 'ren' : ''}</span>}
                  {selectedBooking.infants > 0 && <span>{selectedBooking.infants} Infant{selectedBooking.infants !== 1 ? 's' : ''}</span>}
                  {selectedBooking.pets > 0 && <span>{selectedBooking.pets} Pet{selectedBooking.pets !== 1 ? 's' : ''}</span>}
                </div>
              </div>

              {selectedBooking.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedBooking.phone}</span>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingCalendar;
