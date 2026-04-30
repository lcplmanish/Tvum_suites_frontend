import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, User } from 'lucide-react';
import IDProofUpload from './IDProofUpload';
import PhoneInput from './PhoneInput';

export interface GuestDetail {
  firstName: string;
  lastName: string;
  phone: string;
  notes: string;
  idProofFile: File | null;
}

interface GuestDetailSectionProps {
  index: number;
  guest: GuestDetail;
  onChange: (guest: GuestDetail) => void;
}

const GuestDetailSection: React.FC<GuestDetailSectionProps> = ({ index, guest, onChange }) => {
  const [open, setOpen] = React.useState(index === 0);

  const update = (field: keyof GuestDetail, value: string | File | null) => {
    onChange({ ...guest, [field]: value });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-xl border border-border overflow-hidden transition-all" style={{ boxShadow: 'var(--shadow-card)' }}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-foreground">Guest {index + 1}</span>
              {(guest.firstName || guest.lastName) && (
                <span className="text-xs text-muted-foreground ml-2">— {`${guest.firstName} ${guest.lastName}`.trim()}</span>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">First name *</Label>
                <Input value={guest.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First name" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Surname *</Label>
                <Input value={guest.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Surname" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone *</Label>
              <div className="mt-1.5">
                <PhoneInput value={guest.phone} onChange={v => update('phone', v)} />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Notes (optional)</Label>
              <Textarea value={guest.notes} onChange={e => update('notes', e.target.value)} placeholder="Special requests..." className="mt-1.5" rows={2} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Identity Proof</Label>
              <IDProofUpload file={guest.idProofFile} onChange={f => update('idProofFile', f)} />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default GuestDetailSection;
