import React, { useState } from 'react';
import { useApp, Room } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  room: Room;
  open: boolean;
  onClose: () => void;
}

const EditRoomDialog: React.FC<Props> = ({ room, open, onClose }) => {
  const { updateRoom } = useApp();
  const [name, setName] = useState(room.name);
  const [price, setPrice] = useState(room.price);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Room name is required');
      return;
    }
    if (price <= 0) {
      toast.error('Price must be positive');
      return;
    }
    const imageUrl = imagePreview || room.imageUrl;
    updateRoom(room.number, { name: name.trim(), price, imageUrl });
    toast.success('Room updated');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Room {room.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Room Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Price per Night ($)</Label>
            <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1.5" min={1} />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Room Image</Label>
            <div className="relative">
              <img
                src={imagePreview || room.imageUrl}
                alt={room.name}
                className="w-full h-40 object-cover rounded-lg border border-border"
              />
              <label className="absolute bottom-2 right-2 cursor-pointer">
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
                <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-background transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Change
                </div>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="warm-gradient border-0" style={{ color: 'hsl(36, 33%, 97%)' }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoomDialog;
