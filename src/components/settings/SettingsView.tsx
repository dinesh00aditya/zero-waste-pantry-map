import * as React from 'react';
import { User } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { User as UserIcon, Bell, Shield, Palette, Smartphone, Globe, LogOut, Loader2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { toast } from 'sonner';

export function SettingsView({ 
  user, 
  logout, 
  isDark, 
  setIsDark,
  accentColor,
  setAccentColor 
}: { 
  user: User; 
  logout: () => void; 
  isDark: boolean; 
  setIsDark: (val: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}) {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [alertsEnabled, setAlertsEnabled] = React.useState(true);
  const [tipsEnabled, setTipsEnabled] = React.useState(false);
  const [socialEnabled, setSocialEnabled] = React.useState(true);

  // Profile Form States
  const [displayName, setDisplayName] = React.useState(user.name);
  const [bio, setBio] = React.useState(user.bio || '');
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Security Form States
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [savingPassword, setSavingPassword] = React.useState(false);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: displayName,
        bio: bio
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    // In a real app, save to firestore preferences object
    toast.success('Notification preferences saved');
  };

  const handleUpdateLocalization = () => {
    toast.success('Localization updated');
  };

  const handleRevokeSession = () => {
    toast.success('Session revoked successfully');
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1">
          <SettingsNavItem 
            icon={<UserIcon className="w-4 h-4" />} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
          />
          <SettingsNavItem 
            icon={<Bell className="w-4 h-4" />} 
            label="Notifications" 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
          />
          <SettingsNavItem 
            icon={<Shield className="w-4 h-4" />} 
            label="Security" 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
          />
          <SettingsNavItem 
            icon={<Palette className="w-4 h-4" />} 
            label="Appearance" 
            active={activeTab === 'appearance'} 
            onClick={() => setActiveTab('appearance')}
          />
          <SettingsNavItem 
            icon={<Globe className="w-4 h-4" />} 
            label="Localization" 
            active={activeTab === 'localization'} 
            onClick={() => setActiveTab('localization')}
          />
          <SettingsNavItem 
            icon={<Smartphone className="w-4 h-4" />} 
            label="Connected Devices" 
            active={activeTab === 'devices'} 
            onClick={() => setActiveTab('devices')}
          />
        </aside>

        <div className="space-y-8">
          {activeTab === 'profile' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Public Profile</CardTitle>
                  <CardDescription>How other community members see your contributions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-primary/20">
                       {user.name[0]}
                     </div>
                     <div className="space-y-2">
                        <Button variant="outline" size="sm">Change Avatar</Button>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">JPG, PNG or GIF. Max size 2MB.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="s-name">Display Name</Label>
                        <Input id="s-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="s-email">Email Address</Label>
                        <Input id="s-email" value={user.email} disabled />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="s-bio">Short Bio</Label>
                     <Input id="s-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cooking my way to zero waste..." />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
                   <Button size="sm" onClick={handleUpdateProfile} disabled={savingProfile}>
                     {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save Changes
                   </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/50 rounded-xl text-center">
                         <p className="text-2xl font-black">12</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Recipes Shared</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl text-center">
                         <p className="text-2xl font-black">1.2k</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Community Likes</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl text-center">
                         <p className="text-2xl font-black">Top 5%</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Waste Saver Rank</p>
                      </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                 <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Permanently delete your account and all tracked data.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Button variant="destructive" size="sm" onClick={logout}>Sign Out Everywhere</Button>
                 </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive kitchen alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 cursor-pointer"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Expiry Alerts</p>
                    <p className="text-xs text-muted-foreground">Receive push notifications when items are about to expire.</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${alertsEnabled ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${alertsEnabled ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 cursor-pointer"
                  onClick={() => setTipsEnabled(!tipsEnabled)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Recipe Tips</p>
                    <p className="text-xs text-muted-foreground">Get weekly zero-waste recipe inspiration.</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${tipsEnabled ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${tipsEnabled ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 cursor-pointer"
                  onClick={() => setSocialEnabled(!socialEnabled)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Community Interactions</p>
                    <p className="text-xs text-muted-foreground">When someone likes or shares your recipes.</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${socialEnabled ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${socialEnabled ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
                 <Button size="sm" onClick={handleSavePreferences}>Save Preferences</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Ensure your account is using a long, random password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
                   <Button size="sm" onClick={handleUpdatePassword} disabled={savingPassword}>
                     {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Update Password
                   </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm font-bold">Authenticator App</p>
                       <p className="text-xs text-muted-foreground">Recommended for maximum security.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Setup link sent to email in a real scenario")}>Set Up</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Customize the visual interface of PantrySense.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isDark ? 'border-primary ring-2 ring-primary ring-offset-2 bg-background' : 'border-border/50 bg-background hover:border-primary/50'}`}
                    onClick={() => setIsDark(true)}
                  >
                    <div className="flex justify-between items-center mb-4">
                       <div className="w-8 h-4 bg-muted rounded" />
                       <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-primary' : 'border border-border'}`} />
                    </div>
                    <p className="text-xs font-bold">Sleek Dark</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Experimental AMOLED mode.</p>
                  </div>
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${!isDark ? 'border-primary ring-2 ring-primary ring-offset-2 bg-white' : 'border-border/50 bg-white hover:border-primary/50'}`}
                    onClick={() => setIsDark(false)}
                  >
                    <div className="flex justify-between items-center mb-4">
                       <div className="w-8 h-4 bg-muted/20 rounded" />
                       <div className={`w-4 h-4 rounded-full ${!isDark ? 'bg-primary' : 'border border-border'}`} />
                    </div>
                    <p className="text-xs font-bold text-zinc-900">Modern Light</p>
                    <p className="text-[10px] text-muted-foreground mt-1">High contrast readability.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3">
                     {['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-rose-500'].map((color) => (
                       <div 
                         key={color} 
                         onClick={() => setAccentColor(color)}
                         className={`w-8 h-8 rounded-full ${color} cursor-pointer hover:scale-110 transition-transform ${accentColor === color ? 'ring-2 ring-offset-2 ring-foreground' : ''}`} 
                       />
                     ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'localization' && (
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>Manage unit systems and preferred language.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Interface Language</Label>
                    <div className="relative p-2.5 bg-muted/40 rounded-lg border border-border/50 text-sm font-medium flex justify-between items-center">
                       English (US)
                       <Badge variant="outline" className="text-[9px]">Default</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit System</Label>
                    <div className="relative p-2.5 bg-muted/40 rounded-lg border border-border/50 text-sm font-medium flex justify-between items-center">
                       Metric (kg, L)
                       <Badge variant="outline" className="text-[9px]">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                   <Label>Timezone</Label>
                   <div className="p-2.5 bg-muted/40 rounded-lg border border-border/50 text-xs font-mono">
                      (GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi
                   </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
                 <Button size="sm" onClick={handleUpdateLocalization}>Update Localization</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'devices' && (
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>View and manage all your active sessions and devices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-primary/5 border-primary/20">
                   <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                      <Smartphone className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold">This Device (iPhone 15 Pro)</span>
                         <Badge className="bg-primary hover:bg-primary text-[8px] h-4">Current</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">New Delhi, India • Last active: Just now</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 opacity-60">
                   <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                      <Smartphone className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <span className="text-sm font-bold">Desktop Browser (Chrome)</span>
                      <p className="text-[10px] text-muted-foreground">Mumbai, India • Last active: 2 hours ago</p>
                   </div>
                   <Button variant="ghost" size="sm" className="text-destructive font-bold text-[10px] uppercase" onClick={handleRevokeSession}>Revoke</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`
      flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors
      ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted'}
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
