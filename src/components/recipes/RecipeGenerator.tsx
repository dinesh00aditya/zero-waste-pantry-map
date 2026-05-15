import { useState } from 'react';
import { PantryItem, SharedRecipe } from '../../types';
import { getRecipeSuggestions } from '../../services/geminiService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Sparkles, Loader2, Share2, ChefHat, Timer, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

import { toast } from 'sonner';

export function RecipeGenerator({ items, fullWidth = false }: { items: PantryItem[]; fullWidth?: boolean }) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const suggestions = await getRecipeSuggestions(items);
      setRecipes(suggestions);
      toast.success("Recipes generated based on your pantry!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate recipes.");
    } finally {
      setLoading(false);
    }
  };

  const shareRecipe = async (recipe: any) => {
    if (!auth.currentUser) return;
    setSharing(recipe.title);
    try {
      const recipeRef = doc(db, 'recipes', Date.now().toString());
      const payload = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Chef',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(recipeRef, payload);
      toast.success("Recipe shared with community!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'recipes');
      toast.error("Error sharing recipe.");
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className={`space-y-6 ${fullWidth ? 'max-w-6xl mx-auto' : ''}`} id="recipes">
      {!fullWidth && (
        <div className="cost-stat bg-gradient-to-br from-card to-secondary/50 p-6 rounded-2xl border flex flex-col gap-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Analytics Dashboard</div>
          <div className="text-2xl font-black">₹{items.reduce((acc, i) => acc + (Number(i.cost) || 0), 0).toLocaleString()}</div>
          <div className="text-[10px] text-primary flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3" /> + ₹{Math.floor(items.reduce((acc, i) => acc + (Number(i.cost) || 0), 0) * 0.05)} this week
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
             <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">AI Magic Suggestions</h3>
             {fullWidth && <p className="text-xs text-muted-foreground">Tailored recipes based on your expiring items.</p>}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-primary font-bold text-[10px]">
               <Loader2 className="w-4 h-4 animate-spin" />
               GENERATING...
            </div>
          ) : (
            <Button variant="default" size="sm" onClick={generate} disabled={items.length === 0} className="rounded-full shadow-lg shadow-primary/20">
               <Sparkles className="w-3.5 h-3.5 mr-2" />
               Generate New
            </Button>
          )}
        </div>

        {recipes.length === 0 && !loading && (
          <div className="bg-muted/50 border-2 border-dashed p-12 rounded-3xl text-center flex flex-col items-center gap-4">
            <ChefHat className="w-12 h-12 text-muted-foreground opacity-20" />
            <div className="max-w-xs mx-auto">
              <div className="text-sm font-bold opacity-60">No recipes yet</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Click generate to let AI scan your pantry and suggest zero-waste meals.
              </p>
            </div>
          </div>
        )}

        <div className={`grid gap-4 ${fullWidth ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {recipes.map((recipe, idx) => (
            <Card key={idx} className="bg-card hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
              <div className="p-4 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-base font-bold leading-tight group-hover:text-primary transition-colors">{recipe.title}</h4>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-tighter shrink-0 border-primary/20 text-primary">{recipe.difficulty}</Badge>
                </div>
                
                <div className="space-y-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Ingredients</p>
                   <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing: string, i: number) => (
                        <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium text-muted-foreground">{ing}</span>
                      ))}
                   </div>
                </div>

                {fullWidth && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Instructions</p>
                    <ol className="text-[11px] text-muted-foreground space-y-2">
                      {recipe.instructions.slice(0, 3).map((step: string, s: number) => (
                        <li key={s} className="flex gap-2">
                          <span className="text-primary font-black">{s+1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                      {recipe.instructions.length > 3 && <li className="italic opacity-50">...and {recipe.instructions.length - 3} more steps</li>}
                    </ol>
                  </div>
                )}
              </div>
              <div className="p-4 bg-muted/20 border-t">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full h-9 text-[10px] uppercase font-black tracking-widest hover:bg-primary hover:text-white transition-all gap-2"
                  onClick={() => shareRecipe(recipe)}
                  disabled={sharing === recipe.title}
                >
                  <Share2 className="w-3 h-3" />
                  {sharing === recipe.title ? 'Sharing...' : 'Share with Community'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
