import React, { useState, useEffect } from 'react';
import { useApp, Booking, BookingGuest } from '@/context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { CalendarIcon, ChevronDown, User, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}

const EditBookingDrawer: React.FC<Props> = ({ booking, open, onClose }) => {
  const { bookings, updateBooking, rooms, userRole } = useApp();
  const [roomNumber, setRoomNumber] = useState(booking.roomNumber);
  const [checkIn, setCheckIn] = useState<Date>(new Date(booking.checkIn));
  const [checkOut, setCheckOut] = useState<Date>(new Date(booking.checkOut));
  const [guests, setGuests] = useState<BookingGuest[]>([...booking.guests]);
  const [status, setStatus] = useState<Booking['status']>(booking.status);
  const canEditStatus = userRole === 'owner' || userRole === 'admin';

  const deriveStatus = (start: Date, end: Date): Booking['status'] => {
    const today = startOfDay(new Date());
    if (isBefore(end, today) && !isSameDay(end, today)) {
      return 'completed';
    }
    if (isSameDay(start, today) || isWithinInterval(today, { start, end })) {
      return 'active';
    }
    return 'upcoming';
  };

  useEffect(() => {
    if (!canEditStatus) {
      setStatus(deriveStatus(checkIn, checkOut));
    }
  }, [checkIn, checkOut, canEditStatus]);

  useEffect(() => {
    setRoomNumber(booking.roomNumber);
    setCheckIn(new Date(booking.checkIn));
    setCheckOut(new Date(booking.checkOut));
    setGuests([...booking.guests]);
    setStatus(booking.status);
  }, [booking]);

  const today = startOfDay(new Date());

  const getBookedDates = (room: number) => {
    return bookings
      .filter(b => b.roomNumber === room && b.id !== booking.id && b.status !== 'cancelled' && b.status !== 'completed')
      .map(b => ({ from: new Date(b.checkIn), to: new Date(b.checkOut) }));
  };

  const isDateBooked = (date: Date, room: number) => {
    return getBookedDates(room).some(range =>
      isWithinInterval(date, { start: range.from, end: range.to })
    );
  };

  const hasConflict = () => {
    return getBookedDates(roomNumber).some(range =>
      isWithinInterval(checkIn, { start: range.from, end: range.to }) ||
      isWithinInterval(checkOut, { start: range.from, end: range.to }) ||
      isWithinInterval(range.from, { start: checkIn, end: checkOut })
    );
  };

  const updateGuest = (index: number, field: keyof BookingGuest, value: string) => {
    setGuests(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const handleSave = () => {
    if (isBefore(checkOut, checkIn)) {
      toast.error('Check-out must be after check-in');
      return;
    }
    if (hasConflict()) {
      toast.error('This room is already booked for the selected dates');
      return;
    }
    if (guests.some(g => !g.name.trim())) {
      toast.error('All guest names are required');
      return;
    }

    const computedStatus = !canEditStatus ? deriveStatus(checkIn, checkOut) : status;

    updateBooking(booking.id, {
      roomNumber,
      checkIn,
      checkOut,
      guestName: guests[0].name,
      phone: guests[0].phone || undefined,
      notes: guests[0].notes || undefined,
      guests,
      status: computedStatus,
    });
    toast.success('Booking updated');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">Edit Booking</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Room */}
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Room</Label>
            <Select value={String(roomNumber)} onValueChange={v => setRoomNumber(Number(v))}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.number} value={String(r.number)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
            {canEditStatus ? (
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {status}
              </div>
            )}
            {!canEditStatus && (
              <p className="text-xs text-muted-foreground mt-2">
                Status is derived from check-in/check-out dates for non-admin users.
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check-in</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1.5">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(checkIn, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={d => d && setCheckIn(d)}
                    disabled={(date) => isDateBooked(date, roomNumber)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check-out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1.5">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(checkOut, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={d => d && setCheckOut(d)}
                    disabled={(date) => isBefore(date, checkIn) || isDateBooked(date, roomNumber)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Guests */}
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-3 block">
              Guests ({guests.length})
            </Label>
            <div className="space-y-3">
              {guests.map((guest, i) => (
                <Collapsible key={i} defaultOpen={i === 0}>
                  <div className="bg-secondary/30 rounded-lg border border-border overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Guest {i + 1}</span>
                        {guest.name && <span className="text-xs text-muted-foreground">— {guest.name}</span>}
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Name *</Label>
                          <Input value={guest.name} onChange={e => updateGuest(i, 'name', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <Input value={guest.phone} onChange={e => updateGuest(i, 'phone', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <Textarea value={guest.notes} onChange={e => updateGuest(i, 'notes', e.target.value)} className="mt-1" rows={2} />
                        </div>
                        {guest.idProofUrl && (
                          <div>
                            <Label className="text-xs text-muted-foreground">ID Proof</Label>
                            <div className="mt-1 flex items-center gap-2">
                              {guest.idProofType.includes('pdf') ? (
                                <a href={guest.idProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View PDF</a>
                              ) : (
                                <img src={guest.idProofUrl} alt="ID" className="h-16 rounded border border-border object-cover" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1 warm-gradient border-0" style={{ color: 'hsl(36, 33%, 97%)' }}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditBookingDrawer;
