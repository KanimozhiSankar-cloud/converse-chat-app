import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, LockKeyhole } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Spinner } from '../components/common/Spinner';
import { resetPasswordRequest } from '../services/authService';
import { getErrorMessage } from '../services/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) return setError('This reset link is missing its token.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setIsSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      navigate('/login', { replace: true, state: { message: 'Your password has been reset. Sign in with your new password.' } });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-100">Choose a new password</h2>
      <p className="mt-1 text-sm text-slate-400">Use at least 8 characters for your new password.</p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-300">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-300">Confirm password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent" />
        </div>
        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <Spinner size="sm" className="border-ink-950 border-t-transparent" /> : <LockKeyhole className="h-4 w-4" />}
          Reset password
        </button>
      </form>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400"><CheckCircle className="h-4 w-4 text-accent" /><Link to="/login" className="font-medium hover:text-slate-200">Return to sign in</Link></div>
    </AuthLayout>
  );
}