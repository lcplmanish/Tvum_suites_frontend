import React, { useState, useMemo } from 'react';
import { useApp, Booking } from '@/context/AppContext';
import { format } from 'date-fns';
import { Search, Eye, Pencil, Trash2, FileText, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EditBookingDrawer from '@/components/guest/EditBookingDrawer';
import { toast } from 'sonner';
import { canAccess } from '@/lib/permissions';
import type { AppRole } from '@/lib/permissions';

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const GuestInfoPage = () => {
  const { bookings, deleteBooking, userRole } = useApp();
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('');
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewGuestsBooking, setViewGuestsBooking] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.guestName.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.guests.some(g => g.name.toLowerCase().includes(q) || g.phone.toLowerCase().includes(q));
      const matchRoom = roomFilter === 'all' || b.roomNumber === Number(roomFilter);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchRoom && matchStatus;
    });
  }, [bookings, search, roomFilter, statusFilter]);

  const handleViewId = (url: string, type: string) => {
    if (type.includes('pdf')) {
      window.open(url, '_blank');
    } else {
      setPreviewUrl(url);
      setPreviewType(type);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteBooking(deleteId);
      toast.success('Booking deleted successfully');
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">Guest Info</h1>
        <p className="text-muted-foreground mt-1">View and manage all bookings and guest details.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roomFilter} onValueChange={setRoomFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            <SelectItem value="1">Room 1</SelectItem>
            <SelectItem value="2">Room 2</SelectItem>
            <SelectItem value="3">Room 3</SelectItem>
            <SelectItem value="4">Room 4</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>ID Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(b => {
                  const primary = b.guests[0];
                  const hasId = b.guests.some(g => g.idProofUrl);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.guestName}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setViewGuestsBooking(b)}
                        >
                          <Users className="w-3.5 h-3.5" /> {b.guests.length}
                        </Button>
                      </TableCell>
                      <TableCell>Room {b.roomNumber}</TableCell>
                      <TableCell>{format(new Date(b.checkIn), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(b.checkOut), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-sm">{primary?.phone || '—'}</TableCell>
                      <TableCell>
                        {hasId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              const g = b.guests.find(g => g.idProofUrl);
                              if (g) handleViewId(g.idProofUrl, g.idProofType);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[b.status]}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canAccess(userRole, 'edit_guest') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => setEditBooking(b)}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                          )}
                          {canAccess(userRole, 'delete_booking') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(b.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View All Guests Modal */}
      <Dialog open={!!viewGuestsBooking} onOpenChange={() => setViewGuestsBooking(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              All Guests — {viewGuestsBooking?.guestName} (Room {viewGuestsBooking?.roomNumber})
            </DialogTitle>
          </DialogHeader>
          {viewGuestsBooking && (
            <div className="space-y-4">
              {viewGuestsBooking.guests.map((g, i) => (
                <div key={i} className="rounded-lg border border-border p-4 bg-background">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Guest {i + 1}</p>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{g.name || '—'}</span></p>
                    <p><span className="text-muted-foreground">Phone:</span> {g.phone || '—'}</p>
                    <p><span className="text-muted-foreground">Notes:</span> {g.notes || '—'}</p>
                    <div className="pt-1">
                      <span className="text-muted-foreground">ID Proof: </span>
                      {g.idProofUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs gap-1 px-2"
                          onClick={() => handleViewId(g.idProofUrl, g.idProofType)}
                        >
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ID Proof Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Identity Proof</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center">
              {previewType.includes('pdf') ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Open PDF</a>
                </div>
              ) : (
                <img src={previewUrl} alt="ID Proof" className="max-h-[60vh] rounded-lg object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the booking. Room dates will become available again. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Booking Drawer */}
      {editBooking && (
        <EditBookingDrawer
          booking={editBooking}
          open={!!editBooking}
          onClose={() => setEditBooking(null)}
        />
      )}
    </div>
  );
};

export default GuestInfoPage;
