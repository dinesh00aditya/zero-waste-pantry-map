import { useState, useEffect } from 'react';
import * as React from 'react';
import { useAuth } from './hooks/useAuth';
import { PantryDashboard } from './components/pantry/PantryDashboard';
import { RecipeGenerator } from './components/recipes/RecipeGenerator';
import { RecipeFeed } from './components/recipes/RecipeFeed';
import { PantryMapView } from './components/pantry/PantryMapView';
import { FinanceView } from './components/finance/FinanceView';
import { SettingsView } from './components/settings/SettingsView';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { Sun, Moon, LogOut, LayoutGrid, ChefHat, Settings, Home, Map as MapIcon, BarChart3, Users, Loader2, Sparkles, Mail } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { differenceInDays } from 'date-fns';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  const { user, status, loginWithGoogle, loginWithEmail, signupWithEmail, logout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [accentColor, setAccentColor] = useState('bg-emerald-500');
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const colorMap: Record<string, string> = {
      'bg-emerald-500': '#10b981',
      'bg-blue-500': '#3b82f6',
      'bg-violet-500': '#8b5cf6',
      'bg-orange-500': '#f97316',
      'bg-rose-500': '#f43f5e'
    };
    
    if (colorMap[accentColor]) {
      document.documentElement.style.setProperty('--primary', colorMap[accentColor]);
    }
  }, [accentColor]);

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;

    const q = query(collection(db, 'pantry'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(dbItems);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pantry');
    });

    return () => unsubscribe();
  }, [status, user]);

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled');
      } else {
        setError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signupWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-sm w-full space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-2 shadow-xl shadow-primary/20">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">ZeroWaste Pantry</h1>
          </div>

          <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-xl border border-border/50">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
              <CardDescription>
                {isSignUp ? 'Sign up to start managing your pantry.' : 'Sign in to access your pantry.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Chef John" 
                      required 
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                
                {error && (
                  <div className="text-xs font-bold text-destructive text-center">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full font-bold shadow-xl shadow-primary/20" disabled={authLoading}>
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-bold tracking-widest">Or</span>
                </div>
              </div>

              <Button onClick={handleGoogleAuth} variant="outline" className="w-full font-bold" disabled={authLoading}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t py-4 bg-muted/10">
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs text-muted-foreground hover:text-primary font-bold"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-card border-r flex flex-col p-6 gap-8 shrink-0">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
          <LayoutGrid className="w-6 h-6" />
          <span>PantrySense</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<MapIcon className="w-4 h-4" />} label="Pantry Map" active={currentView === 'map'} onClick={() => setCurrentView('map')} />
          <NavItem icon={<ChefHat className="w-4 h-4" />} label="Recipes" active={currentView === 'recipes'} onClick={() => setCurrentView('recipes')} />
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Cost Tracking" active={currentView === 'finance'} onClick={() => setCurrentView('finance')} />
          <NavItem icon={<Users className="w-4 h-4" />} label="Community" active={currentView === 'community'} onClick={() => setCurrentView('community')} />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-[1400px] mx-auto min-h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight capitalize">{currentView.replace('-', ' ')}</h1>
              <p className="text-muted-foreground text-sm">
                {currentView === 'dashboard' ? `Good Morning, ${user.name}. You have ${items.filter(i => differenceInDays(new Date(i.expiryDate), new Date()) < 3).length} items expiring soon.` : `Manage your ${currentView}.`}
              </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent shrink-0 flex items-center justify-center text-white font-bold" title={user.name}>
                 {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : 'U'}
               </div>
            </div>
          </div>

          <div className="w-full">
            {currentView === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                <div className="space-y-8">
                  <PantryDashboard items={items} />
                  <RecipeFeed />
                </div>
                <aside className="space-y-8">
                  <RecipeGenerator items={items} />
                </aside>
              </div>
            )}

            {currentView === 'map' && <PantryMapView items={items} />}
            {currentView === 'recipes' && <RecipeGenerator items={items} fullWidth />}
            {currentView === 'finance' && <FinanceView items={items} />}
            {currentView === 'community' && <RecipeFeed />}
            {currentView === 'settings' && <SettingsView user={user} logout={logout} isDark={isDark} setIsDark={setIsDark} accentColor={accentColor} setAccentColor={setAccentColor} />}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`
      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all
      ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
