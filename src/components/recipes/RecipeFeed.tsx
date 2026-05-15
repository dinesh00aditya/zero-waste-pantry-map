import { useState, useEffect } from 'react';
import { SharedRecipe } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { format } from 'date-fns';
import { Share2, Utensils, Heart, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { collection, onSnapshot, query, limit, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { toast } from 'sonner';

export function RecipeFeed() {
  const [recipes, setRecipes] = useState<SharedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SharedRecipe | null>(null);

  useEffect(() => {
    // Note: Due to lack of index, simple fetch first.
    const q = query(collection(db, 'recipes'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(document => ({ id: document.id, ...document.data() } as SharedRecipe));
      // Sort in memory to avoid needing composite index creation via Firestore console immediately
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecipes(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recipes');
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (recipeId: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'recipes', recipeId));
      toast.success("Recipe deleted from community.");
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${recipeId}`);
      toast.error("Failed to delete recipe");
    }
  };

  return (
    <div className="space-y-6 pt-8 border-t" id="feed">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Community Kitchen</h2>
          <p className="text-muted-foreground text-xs">Collaborative zero-waste cooking across the globe.</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">Live Feed</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="group overflow-hidden bg-card/50 hover:bg-card border-border/40 hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                      {recipe.authorName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xs font-bold leading-none">{recipe.authorName}</h3>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {format(new Date(recipe.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {auth.currentUser?.uid === recipe.authorId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                    className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                    title="Delete Shared Recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <CardTitle className="text-base font-black tracking-tight group-hover:text-primary transition-colors leading-tight">{recipe.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.slice(0, 3).map((ing, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-muted/50 rounded text-muted-foreground border border-border/30">
                    {ing}
                  </span>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="text-[9px] px-2 py-0.5 opacity-40">+{recipe.ingredients.length - 3}</span>
                )}
              </div>
              
              <div className="pt-3 flex items-center justify-between border-t border-border/20">
                 <div className="flex gap-4">
                    <button className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors">
                       <Heart className="w-3.5 h-3.5" /> 24
                    </button>
                 </div>
                 <button 
                  onClick={() => setSelectedRecipe(recipe)}
                  className="text-[10px] font-black text-primary hover:underline underline-offset-4 uppercase tracking-widest"
                 >
                   Recipe Details
                 </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/30">
          <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-xs text-muted-foreground font-medium">Be the first to share a zero-waste recipe!</p>
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{selectedRecipe.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                  <Avatar className="w-6 h-6 rounded-md">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold rounded-md">
                      {selectedRecipe.authorName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>By <span className="font-bold">{selectedRecipe.authorName}</span> on {format(new Date(selectedRecipe.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <span key={i} className="text-sm px-3 py-1 bg-muted rounded-md font-medium text-muted-foreground">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Instructions</h3>
                  <ol className="space-y-4 list-decimal pl-4">
                    {selectedRecipe.instructions.map((step, s) => (
                      <li key={s} className="text-sm text-foreground/80 leading-relaxed pl-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
