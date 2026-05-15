import * as React from 'react';
import { PantryItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { differenceInDays } from 'date-fns';
import { LayoutGrid, Refrigerator, Archive, Utensils } from 'lucide-react';

export function PantryMapView({ items }: { items: PantryItem[] }) {
  const knownLocations = [
    { name: 'Main Shelf', icon: <LayoutGrid className="w-5 h-5 text-primary" />, description: 'Grains, oils, and dry goods' },
    { name: 'Refrigerator', icon: <Refrigerator className="w-5 h-5 text-primary" />, description: 'Dairy, fresh produce, and drinks' },
    { name: 'Spices Rack', icon: <Utensils className="w-5 h-5 text-primary" />, description: 'Seasonings, herbs, and oils' },
    { name: 'Dry Storage', icon: <Archive className="w-5 h-5 text-primary" />, description: 'Canned goods and overflow' },
  ];

  const customLocationNames = Array.from(new Set(items.map(item => item.location))).filter(Boolean);
  const customLocations = customLocationNames
    .filter(name => !knownLocations.find(l => l.name === name))
    .map(name => ({
      name,
      icon: <LayoutGrid className="w-5 h-5 text-primary" />,
      description: 'Custom added location',
    }));

  const locations = [...knownLocations, ...customLocations];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {locations.map((loc) => (
          <Card key={loc.name} className="bg-card/50 backdrop-blur-sm border-primary/10 transition-all hover:border-primary/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {loc.icon}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">{loc.name}</CardTitle>
                  <p className="text-[10px] text-muted-foreground">{loc.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{items.filter(i => i.location === loc.name).length}</span>
                <span className="text-xs text-muted-foreground font-medium">Items</span>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1">
                {items.filter(i => i.location === loc.name).slice(0, 10).map((item, idx) => (
                   <div 
                     key={idx} 
                     className={`w-2 h-2 rounded-[2px] ${differenceInDays(new Date(item.expiryDate), new Date()) < 3 ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-primary/40'}`}
                     title={item.name}
                   />
                ))}
                {items.filter(i => i.location === loc.name).length > 10 && (
                  <span className="text-[8px] font-bold opacity-30">+{items.filter(i => i.location === loc.name).length - 10}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {locations.map((loc) => (
          <Card key={`${loc.name}-detail`} className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                {loc.icon}
                {loc.name} Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y">
                 {items.filter(i => i.location === loc.name).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">No items in this section</div>
                 ) : (
                    items.filter(i => i.location === loc.name).map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div className="flex flex-col">
                           <span className="font-bold text-sm tracking-tight">{item.name}</span>
                           <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-black opacity-30">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-mono opacity-60">{item.quantity} {item.unit}</span>
                           <Badge variant="outline" className={`text-[9px] ${differenceInDays(new Date(item.expiryDate), new Date()) < 3 ? 'text-destructive border-destructive/20' : 'text-primary border-primary/20'}`}>
                             {differenceInDays(new Date(item.expiryDate), new Date()) < 0 ? 'Expired' : `Exp in ${differenceInDays(new Date(item.expiryDate), new Date())}d`}
                           </Badge>
                        </div>
                      </div>
                    ))
                 )}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
