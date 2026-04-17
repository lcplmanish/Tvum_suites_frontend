import React, { useState } from 'react';
import {
  Bed, Sofa, Bath, Tv, Refrigerator, UtensilsCrossed, Wifi, AirVent, Coffee, Lamp, BedDouble, Pencil,
} from 'lucide-react';
import { useApp, Room } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import EditRoomDialog from '@/components/rooms/EditRoomDialog';

const amenities = [
  { icon: Bed, label: '1 Double Bed' },
  { icon: Sofa, label: '1 Sofa Cum Bed' },
  { icon: BedDouble, label: '1 Extra Bed' },
  { icon: Bath, label: 'Attached Bathroom' },
  { icon: Tv, label: 'TV' },
  { icon: Refrigerator, label: 'Fridge' },
  { icon: UtensilsCrossed, label: 'Mini Kitchen' },
  { icon: Wifi, label: 'Free WiFi' },
  { icon: AirVent, label: 'AC' },
  { icon: Coffee, label: 'Coffee Maker' },
  { icon: Lamp, label: 'Table' },
];

const RoomsPage = () => {
  const { rooms, userRole } = useApp();
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  return (
    <div className="max-w-6xl mx-auto slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">Rooms</h1>
        <p className="text-muted-foreground mt-1">All 4 tvum apartments and their amenities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map(room => (
          <div key={room.number} className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <img src={room.imageUrl} alt={room.name} className="w-full h-48 object-cover" loading="lazy" width={800} height={600} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-semibold text-foreground">{room.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">₹{room.price}<span className="text-xs text-muted-foreground font-normal">/night</span></span>
                  {userRole === 'owner' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRoom(room)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              {/* <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {amenities.map(a => (
                  <div key={a.label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-secondary/50">
                    <a.icon className="w-5 h-5 text-primary" />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{a.label}</span>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {editRoom && (
        <EditRoomDialog room={editRoom} open={!!editRoom} onClose={() => setEditRoom(null)} />
      )}
    </div>
  );
};

export default RoomsPage;
