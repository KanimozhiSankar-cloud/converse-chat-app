import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Camera, Monitor, Moon, Save, Sun, Trash2, X } from 'lucide-react';
import { AuthUser } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Theme, useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { changePassword, updateCurrentUser } from '../../services/userService';
import { getErrorMessage } from '../../services/api';

export function SettingsPanel({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const { logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateCurrentUser({ name, email, avatar });
      updateUser({ ...user, ...updated });
      showToast('Profile updated');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setAvatarError('Images must be 1 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarError(null);
    };
    reader.onerror = () => setAvatarError('Unable to read that image.');
    reader.readAsDataURL(file);
  }

  async function removeAvatar() {
    setAvatar('');
    setAvatarError(null);
    try {
      const updated = await updateCurrentUser({ name, email, avatar: '' });
      updateUser({ ...user, ...updated });
      showToast('Profile image removed');
    } catch (error) {
      setAvatar(user.avatar);
      showToast(getErrorMessage(error), 'error');
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password changed');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] overflow-hidden bg-black/45" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="glass-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-y-0 border-r-0 p-6 shadow-2xl">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Preferences</p><h2 className="mt-1 text-xl font-semibold text-primary">Settings</h2></div><button type="button" onClick={onClose} aria-label="Close settings" title="Close" className="text-secondary hover:text-primary"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleProfileSubmit} className="mt-8 space-y-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Account</h3><div className="flex items-center gap-3 rounded-2xl border border-token bg-input p-3"><Avatar name={name} src={avatar} size="lg" showStatusDot={false} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-primary">Profile image</p><p className="mt-1 text-xs text-tertiary">JPG, PNG, GIF or WebP up to 1 MB</p><input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" /><div className="mt-2 flex gap-2"><button type="button" onClick={() => avatarInputRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-token px-2.5 py-1.5 text-xs text-secondary hover:border-accent/50 hover:text-accent"><Camera className="h-3.5 w-3.5" />Change photo</button>{avatar && <button type="button" onClick={removeAvatar} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Remove</button>}</div></div></div>{avatarError && <p className="text-xs text-red-300">{avatarError}</p>}<input value={name} onChange={(event) => setName(event.target.value)} aria-label="Profile name" className="w-full rounded-xl border border-token bg-input px-3 py-2.5 text-sm text-primary outline-none focus:border-accent" placeholder="Name" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" aria-label="Profile email" className="w-full rounded-xl border border-token bg-input px-3 py-2.5 text-sm text-primary outline-none focus:border-accent" placeholder="Email" /><button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-ink-950 disabled:opacity-50"><Save className="h-4 w-4" />Save profile</button></form>
        <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Change password</h3><input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" aria-label="Current password" className="w-full rounded-xl border border-token bg-input px-3 py-2.5 text-sm text-primary outline-none focus:border-accent" placeholder="Current password" /><input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" aria-label="New password" className="w-full rounded-xl border border-token bg-input px-3 py-2.5 text-sm text-primary outline-none focus:border-accent" placeholder="New password" /><button type="submit" disabled={isSaving || !currentPassword || !newPassword} className="rounded-xl border border-token px-3 py-2 text-sm text-secondary hover:border-accent/50 hover:text-accent disabled:opacity-50">Change password</button></form>
        <section className="mt-8"><h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Appearance</h3><div className="mt-3 grid grid-cols-3 gap-2">{([['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']] as [Theme, typeof Sun, string][]).map(([value, Icon, label]) => <button key={value} type="button" onClick={() => setTheme(value)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs ${theme === value ? 'border-accent bg-accent/10 text-accent' : 'border-token text-secondary hover:text-primary'}`}><Icon className="h-4 w-4" />{label}</button>)}</div></section>
        <div className="mt-8 border-t border-token pt-5"><button type="button" onClick={logout} className="text-sm text-red-300 hover:text-red-200">Log out</button><p className="mt-4 text-xs text-tertiary">Account deletion requires a server-side deletion policy and is not available yet.</p></div>
      </aside>
    </div>
  );
}

