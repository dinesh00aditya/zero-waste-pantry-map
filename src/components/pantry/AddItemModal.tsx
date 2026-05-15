import { useState, useEffect, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PantryItem } from '../../types';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export function AddItemModal({ isOpen, onClose, editingItem }: {
  isOpen: boolean;
  onClose: () => void;
  editingItem: PantryItem | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Grains',
    quantity: 1,
    unit: 'kg',
    expiryDate: '',
    location: 'Main Shelf',
    cost: 0
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        expiryDate: editingItem.expiryDate.split('T')[0],
        location: editingItem.location,
        cost: editingItem.cost
      });
    } else {
      setFormData({
        name: '',
        category: 'Grains',
        quantity: 1,
        unit: 'kg',
        expiryDate: '',
        location: 'Main Shelf',
        cost: 0
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const itemId = editingItem ? editingItem.id : Date.now().toString();
      const itemRef = doc(db, 'pantry', itemId);
      
      const payload = {
        ...formData,
        userId: auth.currentUser.uid,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString()
      };

      await setDoc(itemRef, payload);
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'pantry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Pantry Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Basmati Rice" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Grains', 'Vegetables', 'Fruits', 'Dairy', 'Spices', 'Snacks', 'Other'].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (Map)</Label>
              <Input 
                id="location" 
                placeholder="e.g. Shelf A, Row 2" 
                value={formData.location} 
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                required 
                value={isNaN(formData.quantity) ? '' : formData.quantity} 
                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input 
                id="unit" 
                placeholder="kg, pcs, l" 
                required 
                value={formData.unit} 
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input 
              id="expiry" 
              type="date" 
              required 
              value={formData.expiryDate} 
              onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost Tracking (₹)</Label>
            <Input 
              id="cost" 
              type="number" 
              value={isNaN(formData.cost) ? '' : formData.cost} 
              onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
