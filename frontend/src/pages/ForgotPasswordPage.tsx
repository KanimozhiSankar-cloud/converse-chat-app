import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Spinner } from '../components/common/Spinner';
import { forgotPasswordRequest } from '../services/authService';
import { getErrorMessage } from '../services/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordRequest(email);
      setMessage(result.message);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-100">Reset your password</h2>
      <p className="mt-1 text-sm text-slate-400">Enter your email and we will send reset instructions.</p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        {message && <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
          <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent" />
        </div>
        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <Spinner size="sm" className="border-ink-950 border-t-transparent" /> : <Mail className="h-4 w-4" />}
          Send reset link
        </button>
      </form>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
    </AuthLayout>
  );
}