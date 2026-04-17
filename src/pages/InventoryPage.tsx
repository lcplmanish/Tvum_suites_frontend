import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Minus, Plus, Package, UtensilsCrossed } from 'lucide-react';

const InventoryPage = () => {
  const { inventory, updateInventory } = useApp();
  const [search, setSearch] = useState('');

  const pantry = inventory.filter(i => i.category === 'pantry' && i.name.toLowerCase().includes(search.toLowerCase()));
  const cutlery = inventory.filter(i => i.category === 'cutlery' && i.name.toLowerCase().includes(search.toLowerCase()));

  const Section = ({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: typeof inventory }) => (
    <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-serif font-medium text-foreground">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground text-sm">{item.name}</span>
              {item.quantity <= item.minStock && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Low
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateInventory(item.id, Math.max(0, item.quantity - 1))}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateInventory(item.id, item.quantity + 1)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">Inventory</h1>
        <p className="text-muted-foreground mt-1">Track pantry and cutlery supplies.</p>
      </div>
      <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="mb-6 max-w-sm" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Pantry" icon={Package} items={pantry} />
        <Section title="Cutlery" icon={UtensilsCrossed} items={cutlery} />
      </div>
    </div>
  );
};

export default InventoryPage;
