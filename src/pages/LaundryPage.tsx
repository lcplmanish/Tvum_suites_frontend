import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getRoleLabel } from '@/lib/permissions';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateDisplay = (dateString: string | undefined): string => {
  if (!dateString) return 'Pending';
  return format(parseISO(dateString), 'dd/MM/yyyy');
};

const LaundryPage = () => {
  const { laundryRecords, addLaundryRecord, updateLaundryRecord, userRole } = useApp();

  // Add Given Form
  const [dateGiven, setDateGiven] = useState('');
  const [bedsheetsGiven, setBedsheetsGiven] = useState('0');
  const [pillowCoversGiven, setPillowCoversGiven] = useState('0');
  const [towelsGiven, setTowelsGiven] = useState('0');
  const [handTowelsGiven, setHandTowelsGiven] = useState('0');
  const [kitchenTowelsGiven, setKitchenTowelsGiven] = useState('0');
  const [blanketsGiven, setBlanketsGiven] = useState('0');

  // Update Received Form
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [dateTaken, setDateTaken] = useState('');
  const [bedsheetsTaken, setBedsheetsTaken] = useState('0');
  const [pillowCoversTaken, setPillowCoversTaken] = useState('0');
  const [towelsTaken, setTowelsTaken] = useState('0');
  const [handTowelsTaken, setHandTowelsTaken] = useState('0');
  const [kitchenTowelsTaken, setKitchenTowelsTaken] = useState('0');
  const [blanketsTaken, setBlanketsTaken] = useState('0');

  // Calendar View
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const sortedLaundryRecords = [...laundryRecords].sort((a, b) => a.date_given.localeCompare(b.date_given));

  const laundrySummary = sortedLaundryRecords.reduce(
    (acc, record) => {
      const bedsheetsTaken = record.bedsheets_taken || 0;
      const pillowsTaken = record.pillow_covers_taken || 0;
      const towelsTaken = record.towels_taken || 0;
      const handTowelsTaken = record.hand_towels_taken || 0;
      const kitchenTowelsTaken = record.kitchen_towels_taken || 0;
      const blanketsTaken = record.blankets_taken || 0;

      const bedsheetsDiff = record.bedsheets_given - bedsheetsTaken;
      const pillowsDiff = record.pillow_covers_given - pillowsTaken;
      const towelsDiff = record.towels_given - towelsTaken;
      const handTowelsDiff = record.hand_towels_given - handTowelsTaken;
      const kitchenTowelsDiff = record.kitchen_towels_given - kitchenTowelsTaken;
      const blanketsDiff = record.blankets_given - blanketsTaken;

      if (acc.bedsheetsBalance > 0 && bedsheetsDiff < 0) {
        acc.bedsheetsFilled = true;
      }
      if (acc.pillowBalance > 0 && pillowsDiff < 0) {
        acc.pillowFilled = true;
      }
      if (acc.towelsBalance > 0 && towelsDiff < 0) {
        acc.towelsFilled = true;
      }
      if (acc.handTowelsBalance > 0 && handTowelsDiff < 0) {
        acc.handTowelsFilled = true;
      }
      if (acc.kitchenTowelsBalance > 0 && kitchenTowelsDiff < 0) {
        acc.kitchenTowelsFilled = true;
      }
      if (acc.blanketBalance > 0 && blanketsDiff < 0) {
        acc.blanketsFilled = true;
      }

      acc.bedsheetsBalance += bedsheetsDiff;
      acc.pillowBalance += pillowsDiff;
      acc.towelsBalance += towelsDiff;
      acc.handTowelsBalance += handTowelsDiff;
      acc.kitchenTowelsBalance += kitchenTowelsDiff;
      acc.blanketBalance += blanketsDiff;

      return acc;
    },
    {
      bedsheetsBalance: 0,
      pillowBalance: 0,
      towelsBalance: 0,
      handTowelsBalance: 0,
      kitchenTowelsBalance: 0,
      blanketBalance: 0,
      bedsheetsFilled: false,
      pillowFilled: false,
      towelsFilled: false,
      handTowelsFilled: false,
      kitchenTowelsFilled: false,
      blanketsFilled: false,
    }
  );

  const totalBedsheetMissing = Math.max(0, laundrySummary.bedsheetsBalance);
  const totalPillowMissing = Math.max(0, laundrySummary.pillowBalance);
  const totalTowelMissing = Math.max(0, laundrySummary.towelsBalance);
  const totalHandTowelMissing = Math.max(0, laundrySummary.handTowelsBalance);
  const totalKitchenTowelMissing = Math.max(0, laundrySummary.kitchenTowelsBalance);
  const totalBlanketMissing = Math.max(0, laundrySummary.blanketBalance);
  const previousMissingFilled =
    laundrySummary.bedsheetsFilled ||
    laundrySummary.pillowFilled ||
    laundrySummary.towelsFilled ||
    laundrySummary.handTowelsFilled ||
    laundrySummary.kitchenTowelsFilled ||
    laundrySummary.blanketsFilled;

  const laundryRecordsByDay = useMemo(() => {
    const map = new Map<string, typeof laundryRecords[number][]>();
    sortedLaundryRecords.forEach(record => {
      const dayKey = record.date_given;
      const current = map.get(dayKey) ?? [];
      map.set(dayKey, [...current, record]);
    });
    return map;
  }, [sortedLaundryRecords]);

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const currentMonthRecords = sortedLaundryRecords.filter(record => {
    const recordDate = parseISO(record.date_given);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  const monthTotals = currentMonthRecords.reduce(
    (acc, r) => {
      acc.bedsheetsGiven += r.bedsheets_given;
      acc.bedsheetsTaken += r.bedsheets_taken || 0;
      acc.pillowsGiven += r.pillow_covers_given;
      acc.pillowsTaken += r.pillow_covers_taken || 0;
      acc.towelsGiven += r.towels_given;
      acc.towelsTaken += r.towels_taken || 0;
      acc.handTowelsGiven += r.hand_towels_given;
      acc.handTowelsTaken += r.hand_towels_taken || 0;
      acc.kitchenTowelsGiven += r.kitchen_towels_given;
      acc.kitchenTowelsTaken += r.kitchen_towels_taken || 0;
      acc.blanketsGiven += r.blankets_given;
      acc.blanketsTaken += r.blankets_taken || 0;
      return acc;
    },
    {
      bedsheetsGiven: 0,
      bedsheetsTaken: 0,
      pillowsGiven: 0,
      pillowsTaken: 0,
      towelsGiven: 0,
      towelsTaken: 0,
      handTowelsGiven: 0,
      handTowelsTaken: 0,
      kitchenTowelsGiven: 0,
      kitchenTowelsTaken: 0,
      blanketsGiven: 0,
      blanketsTaken: 0,
    }
  );

  const selectedDayRecords = selectedDay
    ? laundryRecordsByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? []
    : [];

  const handleAddGivenRecord = async () => {
    if (!dateGiven) {
      toast.error('Please fill in the date given.');
      return;
    }

    await addLaundryRecord({
      date_given: dateGiven,
      bedsheets_given: Number(bedsheetsGiven),
      pillow_covers_given: Number(pillowCoversGiven),
      towels_given: Number(towelsGiven),
      hand_towels_given: Number(handTowelsGiven),
      kitchen_towels_given: Number(kitchenTowelsGiven),
      blankets_given: Number(blanketsGiven),
    });

    toast.success('Laundry record added successfully.');
    setDateGiven('');
    setBedsheetsGiven('0');
    setPillowCoversGiven('0');
    setTowelsGiven('0');
    setHandTowelsGiven('0');
    setKitchenTowelsGiven('0');
    setBlanketsGiven('0');
  };

  const handleUpdateTakenRecord = async () => {
    if (!selectedRecordId || !dateTaken) {
      toast.error('Please select a record and fill in the date received.');
      return;
    }

    await updateLaundryRecord(selectedRecordId, {
      date_taken: dateTaken,
      bedsheets_taken: Number(bedsheetsTaken),
      pillow_covers_taken: Number(pillowCoversTaken),
      towels_taken: Number(towelsTaken),
      hand_towels_taken: Number(handTowelsTaken),
      kitchen_towels_taken: Number(kitchenTowelsTaken),
      blankets_taken: Number(blanketsTaken),
    });

    toast.success('Laundry record updated successfully.');
    setSelectedRecordId(null);
    setDateTaken('');
    setBedsheetsTaken('0');
    setPillowCoversTaken('0');
    setTowelsTaken('0');
    setHandTowelsTaken('0');
    setKitchenTowelsTaken('0');
    setBlanketsTaken('0');
  };

  const handleSelectRecord = (record: any) => {
    setSelectedRecordId(record.id);
    setDateTaken(record.date_taken || '');
    setBedsheetsTaken(record.bedsheets_taken?.toString() || '0');
    setPillowCoversTaken(record.pillow_covers_taken?.toString() || '0');
    setTowelsTaken(record.towels_taken?.toString() || '0');
    setHandTowelsTaken(record.hand_towels_taken?.toString() || '0');
    setKitchenTowelsTaken(record.kitchen_towels_taken?.toString() || '0');
    setBlanketsTaken(record.blankets_taken?.toString() || '0');
  };

  const pendingRecords = sortedLaundryRecords.filter(record => !record.date_taken);

  return (
    <div className="max-w-6xl mx-auto slide-up space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Laundry</h1>
          <p className="text-muted-foreground mt-1">Track laundry dispatch and return dates plus bedding quantities.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Role: <span className="font-medium">{getRoleLabel(userRole)}</span>
        </div>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add">Add Given Record</TabsTrigger>
          <TabsTrigger value="update">Update Received Record</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Add Laundry Given Record</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date-given">Date Given</Label>
                <Input id="date-given" type="date" value={dateGiven} onChange={e => setDateGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedsheets-given">Bedsheets Given</Label>
                <Input id="bedsheets-given" type="number" min="0" value={bedsheetsGiven} onChange={e => setBedsheetsGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pillow-given">Pillow Covers Given</Label>
                <Input id="pillow-given" type="number" min="0" value={pillowCoversGiven} onChange={e => setPillowCoversGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="towels-given">Towels Given</Label>
                <Input id="towels-given" type="number" min="0" value={towelsGiven} onChange={e => setTowelsGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hand-towels-given">Hand Towels Given</Label>
                <Input id="hand-towels-given" type="number" min="0" value={handTowelsGiven} onChange={e => setHandTowelsGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kitchen-towels-given">Kitchen Towels Given</Label>
                <Input id="kitchen-towels-given" type="number" min="0" value={kitchenTowelsGiven} onChange={e => setKitchenTowelsGiven(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blankets-given">Blankets Given</Label>
                <Input id="blankets-given" type="number" min="0" value={blanketsGiven} onChange={e => setBlanketsGiven(e.target.value)} />
              </div>
            </div>
            <Button className="mt-6" onClick={handleAddGivenRecord}>Add Given Record</Button>
          </div>
        </TabsContent>

        <TabsContent value="update" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Update Laundry Received Record</h2>
            <div className="space-y-4">
              <div>
                <Label>Select Pending Record</Label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedRecordId || ''}
                  onChange={e => {
                    const record = pendingRecords.find(r => r.id === e.target.value);
                    if (record) handleSelectRecord(record);
                  }}
                >
                  <option value="">Select a record...</option>
                  {pendingRecords.map(record => (
                    <option key={record.id} value={record.id}>
                      {formatDateDisplay(record.date_given)} - Bedsheets: {record.bedsheets_given}, Pillows: {record.pillow_covers_given}, Towels: {record.towels_given}, Hand Towels: {record.hand_towels_given}, Kitchen Towels: {record.kitchen_towels_given}, Blankets: {record.blankets_given}
                    </option>
                  ))}
                </select>
              </div>
              {selectedRecordId && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-taken">Date Received</Label>
                    <Input id="date-taken" type="date" value={dateTaken} onChange={e => setDateTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedsheets-taken">Bedsheets Received</Label>
                    <Input id="bedsheets-taken" type="number" min="0" value={bedsheetsTaken} onChange={e => setBedsheetsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pillow-taken">Pillow Covers Received</Label>
                    <Input id="pillow-taken" type="number" min="0" value={pillowCoversTaken} onChange={e => setPillowCoversTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="towels-taken">Towels Received</Label>
                    <Input id="towels-taken" type="number" min="0" value={towelsTaken} onChange={e => setTowelsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hand-towels-taken">Hand Towels Received</Label>
                    <Input id="hand-towels-taken" type="number" min="0" value={handTowelsTaken} onChange={e => setHandTowelsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kitchen-towels-taken">Kitchen Towels Received</Label>
                    <Input id="kitchen-towels-taken" type="number" min="0" value={kitchenTowelsTaken} onChange={e => setKitchenTowelsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blankets-taken">Blankets Received</Label>
                    <Input id="blankets-taken" type="number" min="0" value={blanketsTaken} onChange={e => setBlanketsTaken(e.target.value)} />
                  </div>
                </div>
              )}
              <Button className="mt-6" onClick={handleUpdateTakenRecord} disabled={!selectedRecordId}>Update Received Record</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Records</span>
              <span>{laundryRecords.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pending Records</span>
              <span>{pendingRecords.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Bedsheets Awaited</span>
              <span>{totalBedsheetMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Pillow Covers Awaited</span>
              <span>{totalPillowMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Towels Awaited</span>
              <span>{totalTowelMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Hand Towels Awaited</span>
              <span>{totalHandTowelMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Kitchen Towels Awaited</span>
              <span>{totalKitchenTowelMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Blankets Awaited</span>
              <span>{totalBlanketMissing}</span>
            </div>
            {previousMissingFilled && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Excess received quantity has filled previous missing items.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm mt-4">
        <h2 className="text-xl font-semibold text-foreground mb-4">Month Totals</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Records This Month</span>
            <span>{currentMonthRecords.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Pending This Month</span>
            <span>{currentMonthRecords.filter(r => !r.date_taken).length}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Bedsheets (G/R/M)</span>
            <span>{monthTotals.bedsheetsGiven} / {monthTotals.bedsheetsTaken} / {Math.max(0, monthTotals.bedsheetsGiven - monthTotals.bedsheetsTaken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Pillow Covers (G/R/M)</span>
            <span>{monthTotals.pillowsGiven} / {monthTotals.pillowsTaken} / {Math.max(0, monthTotals.pillowsGiven - monthTotals.pillowsTaken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Towels (G/R/M)</span>
            <span>{monthTotals.towelsGiven} / {monthTotals.towelsTaken} / {Math.max(0, monthTotals.towelsGiven - monthTotals.towelsTaken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Hand Towels (G/R/M)</span>
            <span>{monthTotals.handTowelsGiven} / {monthTotals.handTowelsTaken} / {Math.max(0, monthTotals.handTowelsGiven - monthTotals.handTowelsTaken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Kitchen Towels (G/R/M)</span>
            <span>{monthTotals.kitchenTowelsGiven} / {monthTotals.kitchenTowelsTaken} / {Math.max(0, monthTotals.kitchenTowelsGiven - monthTotals.kitchenTowelsTaken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Blankets (G/R/M)</span>
            <span>{monthTotals.blanketsGiven} / {monthTotals.blanketsTaken} / {Math.max(0, monthTotals.blanketsGiven - monthTotals.blanketsTaken)}</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Laundry Calendar</h2>
            <p className="text-sm text-muted-foreground mt-1">Browse monthly laundry records by date.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">{format(calendarMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-100" />
            <span>Pending records</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-100" />
            <span>Complete records</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-100" />
            <span>Mixed day</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {WEEKDAYS.map(day => (
            <div key={day} className="bg-secondary/50 text-center py-2 text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {Array.from({ length: startPadding }).map((_, index) => (
            <div key={`pad-${index}`} className="bg-card min-h-[88px] md:min-h-[100px]" />
          ))}

          {daysInMonth.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const recordsForDay = laundryRecordsByDay.get(dayKey) ?? [];
            const pendingCount = recordsForDay.filter(record => !record.date_taken).length;
            const completeCount = recordsForDay.length - pendingCount;
            const dayStatus = recordsForDay.length === 0
              ? 'none'
              : pendingCount > 0 && completeCount > 0
                ? 'mixed'
                : pendingCount > 0
                  ? 'pending'
                  : 'complete';
            const statusClass =
              dayStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : dayStatus === 'complete'
                  ? 'bg-green-100 text-green-800'
                  : dayStatus === 'mixed'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-transparent text-muted-foreground';
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`text-left bg-card min-h-[88px] md:min-h-[100px] p-2 transition hover:bg-secondary/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{format(day, 'd')}</span>
                  {recordsForDay.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {recordsForDay.length}
                    </span>
                  )}
                </div>
                {recordsForDay.length > 0 ? (
                  <div className="space-y-1 text-[11px] leading-tight">
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${statusClass}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${dayStatus === 'pending' ? 'bg-yellow-500' : dayStatus === 'complete' ? 'bg-green-500' : dayStatus === 'mixed' ? 'bg-slate-500' : 'bg-transparent'}`} />
                      <span>{dayStatus === 'pending' ? 'Pending' : dayStatus === 'complete' ? 'Complete' : 'Mixed'}</span>
                    </div>
                    <div className="text-muted-foreground">G: {recordsForDay.reduce((sum, record) => sum + record.bedsheets_given, 0)} / T: {recordsForDay.reduce((sum, record) => sum + (record.bedsheets_taken || 0), 0)}</div>
                    <div className="text-muted-foreground">Pending: {pendingCount}</div>
                    <div className="text-muted-foreground">Done: {completeCount}</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">No records</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Month totals</p>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              <div className="flex justify-between"><span>Records this month</span><span>{currentMonthRecords.length}</span></div>
              <div className="flex justify-between"><span>Pending</span><span>{currentMonthRecords.filter(record => !record.date_taken).length}</span></div>
              <div className="flex justify-between"><span>Completed</span><span>{currentMonthRecords.filter(record => record.date_taken).length}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground">{selectedDay ? format(selectedDay, 'dd/MM/yyyy') : 'Select a date'}</h3>
            {selectedDay ? (
              selectedDayRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-3">No laundry records on this day.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {selectedDayRecords.map(record => (
                    <div key={record.id} className="rounded-xl border border-border bg-secondary/50 p-3">
                      <p className="text-sm font-semibold text-foreground">Record #{record.id}</p>
                      <p className="text-xs text-muted-foreground">Given: {formatDateDisplay(record.date_given)}</p>
                      <p className="text-xs text-muted-foreground">Received: {formatDateDisplay(record.date_taken)}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                        <div>Bedsheets {record.bedsheets_given}/{record.bedsheets_taken || 0}</div>
                        <div>Pillows {record.pillow_covers_given}/{record.pillow_covers_taken || 0}</div>
                        <div>Towels {record.towels_given}/{record.towels_taken || 0}</div>
                        <div>Hand Towels {record.hand_towels_given}/{record.hand_towels_taken || 0}</div>
                        <div>Kitchen Towels {record.kitchen_towels_given}/{record.kitchen_towels_taken || 0}</div>
                        <div>Blankets {record.blankets_given}/{record.blankets_taken || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Click a day above to view laundry records for that date.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Given</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bedsheets (G/R/M)</TableHead>
                <TableHead>Pillow Covers (G/R/M)</TableHead>
                <TableHead>Towels (G/R/M)</TableHead>
                <TableHead>Hand Towels (G/R/M)</TableHead>
                <TableHead>Kitchen Towels (G/R/M)</TableHead>
                <TableHead>Blankets (G/R/M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLaundryRecords.map(record => {
                const bedsheetsMissing = Math.max(0, record.bedsheets_given - (record.bedsheets_taken || 0));
                const pillowsMissing = Math.max(0, record.pillow_covers_given - (record.pillow_covers_taken || 0));
                const towelsMissing = Math.max(0, record.towels_given - (record.towels_taken || 0));
                const handTowelsMissing = Math.max(0, record.hand_towels_given - (record.hand_towels_taken || 0));
                const kitchenTowelsMissing = Math.max(0, record.kitchen_towels_given - (record.kitchen_towels_taken || 0));
                const blanketsMissing = Math.max(0, record.blankets_given - (record.blankets_taken || 0));
                const isPending = !record.date_taken;

                return (
                  <TableRow key={record.id}>
                    <TableCell>{formatDateDisplay(record.date_given)}</TableCell>
                    <TableCell>{formatDateDisplay(record.date_taken)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {isPending ? 'Pending' : 'Complete'}
                      </span>
                    </TableCell>
                    <TableCell>{record.bedsheets_given} / {record.bedsheets_taken || 0} / {bedsheetsMissing}</TableCell>
                    <TableCell>{record.pillow_covers_given} / {record.pillow_covers_taken || 0} / {pillowsMissing}</TableCell>
                    <TableCell>{record.towels_given} / {record.towels_taken || 0} / {towelsMissing}</TableCell>
                    <TableCell>{record.hand_towels_given} / {record.hand_towels_taken || 0} / {handTowelsMissing}</TableCell>
                    <TableCell>{record.kitchen_towels_given} / {record.kitchen_towels_taken || 0} / {kitchenTowelsMissing}</TableCell>
                    <TableCell>{record.blankets_given} / {record.blankets_taken || 0} / {blanketsMissing}</TableCell>
                  </TableRow>
                );
              })}
              {laundryRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-6">
                    No laundry records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LaundryPage;
