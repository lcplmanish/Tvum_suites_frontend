import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const LaundryPage = () => {
  const { laundryRecords, addLaundryRecord, updateLaundryRecord, userRole } = useApp();

  // Add Given Form
  const [dateGiven, setDateGiven] = useState('');
  const [bedsheetsGiven, setBedsheetsGiven] = useState('0');
  const [pillowCoversGiven, setPillowCoversGiven] = useState('0');
  const [towelsGiven, setTowelsGiven] = useState('0');
  const [blanketsGiven, setBlanketsGiven] = useState('0');

  // Update Taken Form
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [dateTaken, setDateTaken] = useState('');
  const [bedsheetsTaken, setBedsheetsTaken] = useState('0');
  const [pillowCoversTaken, setPillowCoversTaken] = useState('0');
  const [towelsTaken, setTowelsTaken] = useState('0');
  const [blanketsTaken, setBlanketsTaken] = useState('0');

  const totalBedsheetMissing = laundryRecords.reduce(
    (sum, record) => sum + Math.max(0, record.bedsheets_given - (record.bedsheets_taken || 0)),
    0
  );
  const totalPillowMissing = laundryRecords.reduce(
    (sum, record) => sum + Math.max(0, record.pillow_covers_given - (record.pillow_covers_taken || 0)),
    0
  );
  const totalTowelMissing = laundryRecords.reduce(
    (sum, record) => sum + Math.max(0, record.towels_given - (record.towels_taken || 0)),
    0
  );
  const totalBlanketMissing = laundryRecords.reduce(
    (sum, record) => sum + Math.max(0, record.blankets_given - (record.blankets_taken || 0)),
    0
  );

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
      blankets_given: Number(blanketsGiven),
    });

    toast.success('Laundry record added successfully.');
    setDateGiven('');
    setBedsheetsGiven('0');
    setPillowCoversGiven('0');
    setTowelsGiven('0');
    setBlanketsGiven('0');
  };

  const handleUpdateTakenRecord = async () => {
    if (!selectedRecordId || !dateTaken) {
      toast.error('Please select a record and fill in the date taken.');
      return;
    }

    await updateLaundryRecord(selectedRecordId, {
      date_taken: dateTaken,
      bedsheets_taken: Number(bedsheetsTaken),
      pillow_covers_taken: Number(pillowCoversTaken),
      towels_taken: Number(towelsTaken),
      blankets_taken: Number(blanketsTaken),
    });

    toast.success('Laundry record updated successfully.');
    setSelectedRecordId(null);
    setDateTaken('');
    setBedsheetsTaken('0');
    setPillowCoversTaken('0');
    setTowelsTaken('0');
    setBlanketsTaken('0');
  };

  const handleSelectRecord = (record: any) => {
    setSelectedRecordId(record.id);
    setDateTaken(record.date_taken || '');
    setBedsheetsTaken(record.bedsheets_taken?.toString() || '0');
    setPillowCoversTaken(record.pillow_covers_taken?.toString() || '0');
    setTowelsTaken(record.towels_taken?.toString() || '0');
    setBlanketsTaken(record.blankets_taken?.toString() || '0');
  };

  const pendingRecords = laundryRecords.filter(record => !record.date_taken);

  return (
    <div className="max-w-6xl mx-auto slide-up space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Laundry</h1>
          <p className="text-muted-foreground mt-1">Track laundry dispatch and return dates plus bedding quantities.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Role: <span className="font-medium capitalize">{userRole}</span>
        </div>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add">Add Given Record</TabsTrigger>
          <TabsTrigger value="update">Update Taken Record</TabsTrigger>
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
                <Label htmlFor="blankets-given">Blankets Given</Label>
                <Input id="blankets-given" type="number" min="0" value={blanketsGiven} onChange={e => setBlanketsGiven(e.target.value)} />
              </div>
            </div>
            <Button className="mt-6" onClick={handleAddGivenRecord}>Add Given Record</Button>
          </div>
        </TabsContent>

        <TabsContent value="update" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Update Laundry Taken Record</h2>
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
                      {record.date_given} - Bedsheets: {record.bedsheets_given}, Pillows: {record.pillow_covers_given}, Towels: {record.towels_given}, Blankets: {record.blankets_given}
                    </option>
                  ))}
                </select>
              </div>
              {selectedRecordId && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-taken">Date Taken</Label>
                    <Input id="date-taken" type="date" value={dateTaken} onChange={e => setDateTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedsheets-taken">Bedsheets Taken</Label>
                    <Input id="bedsheets-taken" type="number" min="0" value={bedsheetsTaken} onChange={e => setBedsheetsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pillow-taken">Pillow Covers Taken</Label>
                    <Input id="pillow-taken" type="number" min="0" value={pillowCoversTaken} onChange={e => setPillowCoversTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="towels-taken">Towels Taken</Label>
                    <Input id="towels-taken" type="number" min="0" value={towelsTaken} onChange={e => setTowelsTaken(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blankets-taken">Blankets Taken</Label>
                    <Input id="blankets-taken" type="number" min="0" value={blanketsTaken} onChange={e => setBlanketsTaken(e.target.value)} />
                  </div>
                </div>
              )}
              <Button className="mt-6" onClick={handleUpdateTakenRecord} disabled={!selectedRecordId}>Update Taken Record</Button>
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
              <span>Total Bedsheets Missing</span>
              <span>{totalBedsheetMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Pillow Covers Missing</span>
              <span>{totalPillowMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Towels Missing</span>
              <span>{totalTowelMissing}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Blankets Missing</span>
              <span>{totalBlanketMissing}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Given</TableHead>
                <TableHead>Date Taken</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bedsheets (G/T/M)</TableHead>
                <TableHead>Pillow Covers (G/T/M)</TableHead>
                <TableHead>Towels (G/T/M)</TableHead>
                <TableHead>Blankets (G/T/M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laundryRecords.map(record => {
                const bedsheetsMissing = Math.max(0, record.bedsheets_given - (record.bedsheets_taken || 0));
                const pillowsMissing = Math.max(0, record.pillow_covers_given - (record.pillow_covers_taken || 0));
                const towelsMissing = Math.max(0, record.towels_given - (record.towels_taken || 0));
                const blanketsMissing = Math.max(0, record.blankets_given - (record.blankets_taken || 0));
                const isPending = !record.date_taken;

                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.date_given}</TableCell>
                    <TableCell>{record.date_taken || 'Pending'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {isPending ? 'Pending' : 'Complete'}
                      </span>
                    </TableCell>
                    <TableCell>{record.bedsheets_given} / {record.bedsheets_taken || 0} / {bedsheetsMissing}</TableCell>
                    <TableCell>{record.pillow_covers_given} / {record.pillow_covers_taken || 0} / {pillowsMissing}</TableCell>
                    <TableCell>{record.towels_given} / {record.towels_taken || 0} / {towelsMissing}</TableCell>
                    <TableCell>{record.blankets_given} / {record.blankets_taken || 0} / {blanketsMissing}</TableCell>
                  </TableRow>
                );
              })}
              {laundryRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
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
