import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, isBefore, startOfDay } from 'date-fns';

const INDIA_TIME_ZONE = 'Asia/Kolkata';
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const formatIndianDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(2020, 0, 1, hours, minutes);
  return format(d, 'hh:mm aa');
};

const formatIndianDateTimeLabel = (date: Date, time: string) => {
  return `${formatIndianDate(date)} • ${formatTimeLabel(time)} IST`;
};
import {
  CalendarIcon, Minus, Plus, Check, Users, Baby, PawPrint,
  Bed, Sofa, Tv, Wifi, AirVent, Coffee, UtensilsCrossed, Bath, Refrigerator,
} from 'lucide-react';
import { toast } from 'sonner';

import GuestDetailSection, { type GuestDetail } from '@/components/booking/GuestDetailSection';
import BookingCalendar from '@/components/booking/BookingCalendar';

// rooms now come from context

const amenities = [
  { icon: Bed, label: 'Double Bed' },
  { icon: Sofa, label: 'Sofa Bed' },
  { icon: Bath, label: 'Bathroom' },
  { icon: Tv, label: 'TV' },
  { icon: Refrigerator, label: 'Fridge' },
  { icon: UtensilsCrossed, label: 'Kitchen' },
  { icon: Wifi, label: 'WiFi' },
  { icon: AirVent, label: 'AC' },
  { icon: Coffee, label: 'Coffee Maker' },
];

const emptyGuest = (): GuestDetail => ({ firstName: '', lastName: '', phone: '', notes: '', idProofFile: null });

const BookingPage = () => {
  const { bookings, addBooking, rooms } = useApp();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [bookingSource, setBookingSource] = useState<'Airbnb' | 'others'>('Airbnb');
  const [otherSource, setOtherSource] = useState('');
  const [checkInSlot, setCheckInSlot] = useState('14:00');
  const [checkOutSlot, setCheckOutSlot] = useState('11:00');
  const [guestDetails, setGuestDetails] = useState<GuestDetail[]>([emptyGuest()]);

  const totalGuests = adults + children + infants;

  // Sync guest detail forms with total guest count
  useEffect(() => {
    setGuestDetails(prev => {
      if (prev.length === totalGuests) return prev;
      if (prev.length < totalGuests) {
        return [...prev, ...Array.from({ length: totalGuests - prev.length }, emptyGuest)];
      }
      return prev.slice(0, totalGuests);
    });
  }, [totalGuests]);

  const today = startOfDay(new Date());

  const getBookedDates = (roomNumber: number) => {
    return bookings
      .filter(b => b.roomNumber === roomNumber && b.status !== 'cancelled' && b.status !== 'completed')
      .map(b => ({ from: startOfDay(new Date(b.checkIn)), to: startOfDay(new Date(b.checkOut)) }));
  };

  const isDateBooked = (date: Date, roomNumber: number) => {
    return getBookedDates(roomNumber).some(range => date >= range.from && date <= range.to);
  };

  const isRoomAvailable = (roomNumber: number) => {
    if (!checkIn || !checkOut) return true;
    const newStart = startOfDay(checkIn);
    const newEnd = startOfDay(checkOut);

    return !getBookedDates(roomNumber).some(range => {
      return newStart <= range.to && newEnd >= range.from;
    });
  };

  const updateGuest = (index: number, guest: GuestDetail) => {
    setGuestDetails(prev => prev.map((g, i) => i === index ? guest : g));
  };

  const handleConfirm = () => {
    if (!selectedRoom || !checkIn || !checkOut) {
      toast.error('Please select a room and dates');
      return;
    }
    if (isBefore(checkOut, checkIn)) {
      toast.error('Check-out must be after check-in');
      return;
    }
    // Validate all guest names
    const emptyNames = guestDetails.some(g => !g.firstName.trim() || !g.lastName.trim());
    if (emptyNames) {
      toast.error('Please fill in all guest names');
      return;
    }

    if (bookingSource === 'others' && !otherSource.trim()) {
      toast.error('Please enter the booking source');
      return;
    }

    // Require phone for all guests
    const missingPhone = guestDetails.some(g => !g.phone.trim());
    if (missingPhone) {
      toast.error('Please fill in phone for all guests');
      return;
    }

    const bookingSourceValue = bookingSource === 'others' ? otherSource.trim() : bookingSource;

    // Build guests array (files stored as object URLs for now — will use storage with backend)
    const guests = guestDetails.map(g => ({
      name: `${g.firstName.trim()} ${g.lastName.trim()}`.trim(),
      phone: g.phone.trim(),
      notes: g.notes.trim(),
      idProofUrl: g.idProofFile ? URL.createObjectURL(g.idProofFile) : '',
      idProofType: g.idProofFile?.type ?? '',
    }));

    addBooking({
      roomNumber: selectedRoom,
      checkIn,
      checkOut,
      checkInTime: checkInSlot,
      checkOutTime: checkOutSlot,
      guestName: guests[0].name,
      phone: guests[0].phone || undefined,
      notes: guests[0].notes || undefined,
      adults,
      children,
      infants,
      pets,
      guests,
      bookingSource: bookingSourceValue,
    });
    toast.success('Booking confirmed!', { description: `${guests[0].name} • Room ${selectedRoom}` });
    // Reset
    setSelectedRoom(null);
    setCheckIn(undefined);
    setCheckOut(undefined);
    setAdults(1);
    setChildren(0);
    setInfants(0);
    setPets(0);
    setBookingSource('Airbnb');
    setOtherSource('');
    setCheckInSlot('14:00');
    setCheckOutSlot('11:00');
    setGuestDetails([emptyGuest()]);
  };

  const Counter = ({ label, icon: Icon, value, onChange, min = 0 }: {
    label: string; icon: React.ElementType; value: number; onChange: (v: number) => void; min?: number;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => onChange(value + 1)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const nights = checkIn && checkOut ? Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)) : 0;
  const roomPrice = selectedRoom ? rooms.find(r => r.number === selectedRoom)?.price ?? 0 : 0;

  const canConfirm = selectedRoom && checkIn && checkOut && guestDetails.every(g => g.firstName.trim() && g.lastName.trim() && g.phone.trim()) && (bookingSource === 'Airbnb' || otherSource.trim());

  return (
    <div className="max-w-5xl mx-auto slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">New Booking</h1>
        <p className="text-muted-foreground mt-1">Select a room and fill in the details to create a new reservation.</p>
      </div>

      {/* Room Selection */}
      <section className="mb-8">
        <h2 className="text-lg font-serif font-medium text-foreground mb-4">Select Room</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map(room => {
            const available = isRoomAvailable(room.number);
            const selected = selectedRoom === room.number;
            return (
              <div
                key={room.number}
                onClick={() => available && setSelectedRoom(room.number)}
                className={cn(
                  'room-card bg-card border-border',
                  selected && 'selected',
                  !available && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="relative">
                  <img src={room.imageUrl} alt={room.name} className="w-full h-36 object-cover" loading="lazy" width={800} height={600} />
                  {selected && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full warm-gradient flex items-center justify-center">
                      <Check className="w-4 h-4" style={{ color: 'hsl(36, 33%, 97%)' }} />
                    </div>
                  )}
                  {!available && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                      <span className="text-sm font-semibold" style={{ color: 'hsl(36, 33%, 97%)' }}>Booked</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm">{room.name}</h3>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {amenities.slice(0, 4).map(a => (
                      <a.icon key={a.label} className="w-3.5 h-3.5 text-muted-foreground" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">+{amenities.length - 4}</span>
                  </div>
                  <p className="text-primary font-bold mt-2">₹{room.price}<span className="text-xs text-muted-foreground font-normal"> /night</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Dates + Guests Count */}
        <div className="space-y-6">
          {/* Date Selection */}
          <section className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-lg font-serif font-medium text-foreground mb-4">Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal mt-1.5', !checkIn && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => isBefore(date, today) || (selectedRoom ? isDateBooked(date, selectedRoom) : false)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check-out</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal mt-1.5', !checkOut && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) => isBefore(date, checkIn || today) || (selectedRoom ? isDateBooked(date, selectedRoom) : false)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {nights > 0 && (
              <p className="text-sm text-muted-foreground mt-3">{nights} night{nights > 1 ? 's' : ''}</p>
            )}
          </section>

          <section className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-lg font-serif font-medium text-foreground mb-4">Expected Check-in / Check-out</h2>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected check-in</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {checkIn ? formatIndianDate(checkIn) : 'Select check-in date'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Time slot</Label>
                  <select
                    className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    value={checkInSlot}
                    onChange={e => setCheckInSlot(e.target.value)}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{formatTimeLabel(slot)}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">Selected slot: {checkIn ? formatIndianDateTimeLabel(checkIn, checkInSlot) : 'Select check-in date'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected check-out</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {checkOut ? formatIndianDate(checkOut) : 'Select check-out date'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Time slot</Label>
                  <select
                    className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    value={checkOutSlot}
                    onChange={e => setCheckOutSlot(e.target.value)}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{formatTimeLabel(slot)}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">Selected slot: {checkOut ? formatIndianDateTimeLabel(checkOut, checkOutSlot) : 'Select check-out date'}</p>
              </div>
            </div>
          </section>

          {/* Guest Count */}
          <section className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-lg font-serif font-medium text-foreground mb-2">Guests</h2>
            <div className="divide-y divide-border">
              <Counter label="Adults" icon={Users} value={adults} onChange={setAdults} min={1} />
              <Counter label="Children" icon={Users} value={children} onChange={setChildren} />
              <Counter label="Infants" icon={Baby} value={infants} onChange={setInfants} />
              <Counter label="Pets" icon={PawPrint} value={pets} onChange={setPets} />
            </div>
          </section>

          {/* Booking Source */}
          <section className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-lg font-serif font-medium text-foreground mb-4">Booking Source</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Source</Label>
                <select
                  className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  value={bookingSource}
                  onChange={e => setBookingSource(e.target.value as 'Airbnb' | 'others')}
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="others">Others</option>
                </select>
              </div>
              {bookingSource === 'others' && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Other source *</Label>
                  <Input
                    value={otherSource}
                    onChange={e => setOtherSource(e.target.value)}
                    placeholder="Enter source name"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Summary + Confirm */}
        <div className="space-y-6">
          {/* Summary */}
          {selectedRoom && nights > 0 && (
            <section className="bg-card rounded-xl p-6 border border-border slide-up" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="text-lg font-serif font-medium text-foreground mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">Tvum Suite {selectedRoom}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{nights} night{nights > 1 ? 's' : ''} × ₹{roomPrice}</span><span className="font-medium">₹ {nights * roomPrice}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span className="font-medium">{totalGuests} guest{totalGuests > 1 ? 's' : ''}{pets > 0 ? ` + ${pets} pet${pets > 1 ? 's' : ''}` : ''}</span></div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">₹ {nights * roomPrice}</span>
                </div>
              </div>
            </section>
          )}

          {/* Calendar View */}
          <section className="mt-6">
            <BookingCalendar />
          </section>
        </div>
      </div>

      {/* Guest Details Section */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-serif font-medium text-foreground">Guest Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalGuests} guest{totalGuests > 1 ? 's' : ''} — phone is required for each guest
          </p>
        </div>
        <div className="space-y-3">
          {guestDetails.map((guest, i) => (
            <GuestDetailSection
              key={i}
              index={i}
              guest={guest}
              onChange={(g) => updateGuest(i, g)}
            />
          ))}
        </div>
      </section>
      <div className="mt-6 lg:mt-8">
        <Button
          onClick={handleConfirm}
          className="w-full warm-gradient border-0 h-12 text-base font-semibold shadow-lg hover:opacity-90 transition-opacity"
          style={{ color: 'hsl(36, 33%, 97%)' }}
          disabled={!canConfirm}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
};

export default BookingPage;
