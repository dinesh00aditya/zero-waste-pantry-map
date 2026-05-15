import { useState } from 'react';
import { PantryItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Search, Trash2, Edit2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import { differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { AddItemModal } from './AddItemModal';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

export function PantryDashboard({ items }: { items: PantryItem[] }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pantry', id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `pantry/${id}`);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const getExpiryStatus = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (days < 3) return { label: 'Expiring Soon', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
    return { label: `In ${days} days`, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  };

  const totalValue = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return (
    <div className="space-y-8 py-8" id="pantry">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Inventory Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalValue.toLocaleString()}</div>
            <p className="text-xs text-primary/60 mt-1">+ ₹{Math.floor(totalValue * 0.05)} this week</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Critical Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {items.filter(i => differenceInDays(new Date(i.expiryDate), new Date()) < 3).length}
            </div>
            <p className="text-xs text-destructive/60 mt-1">Items requiring immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Pantry Visual Map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pantry Visual Map</CardTitle>
          <Badge variant="outline" className="text-primary border-primary/30">{items.length} Items Tracked</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Main Shelf', 'Refrigerator', 'Spices Rack'].map((loc) => (
              <div key={loc} className="bg-muted/50 rounded-xl p-4 border border-dashed flex flex-col gap-3 min-h-[120px]">
                <span className="text-[10px] uppercase tracking-widest font-black opacity-40">{loc}</span>
                <div className="flex flex-wrap gap-2">
                  {items.filter(i => i.location === loc).map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`w-3 h-3 rounded-[3px] ${differenceInDays(new Date(item.expiryDate), new Date()) < 3 ? 'bg-destructive' : 'bg-primary'}`}
                      title={`${item.name} (${item.quantity} ${item.unit})`}
                    />
                  ))}
                  {items.filter(i => i.location === loc).length === 0 && (
                    <span className="text-[10px] italic opacity-30">Empty shelf</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory List (Data Table Style) */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Recent Inventory</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground font-medium">
                  <th className="text-left py-3 px-2">Item Name</th>
                  <th className="text-left py-3 px-2">Location</th>
                  <th className="text-left py-3 px-2">Cost</th>
                  <th className="text-right py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => {
                    const status = getExpiryStatus(item.expiryDate);
                    return (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-2">
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] opacity-40 uppercase tracking-tighter">{item.category} • {item.quantity} {item.unit}</div>
                        </td>
                        <td className="py-4 px-2 text-muted-foreground font-medium">{item.location}</td>
                        <td className="py-4 px-2 font-mono">₹{item.cost || 0}</td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                              {status.label}
                            </Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 opacity-40">No entries found</div>
          )}
        </CardContent>
      </Card>

      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingItem={editingItem}
      />
    </div>
  );
}
