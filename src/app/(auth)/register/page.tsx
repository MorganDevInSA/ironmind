'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { logout, signUpWithEmail, signInWithFacebook, signInWithMicrosoft } from '@/lib/firebase';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

// ─── password rules ───────────────────────────────────────────────────────────

const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  {
    id: 'special',
    label: 'One special character (!@#$…)',
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

// ─── field input with optional eye toggle ─────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm
          bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)]
          text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)]
          focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)]
          focus:outline-none transition-all duration-200"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-2)] hover:text-[color:var(--text-1)] transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleFacebookRegister = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await signInWithFacebook();
      router.push('/dashboard');
    } catch {
      setError('Failed to sign in with Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftRegister = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await signInWithMicrosoft();
      router.push('/dashboard');
    } catch {
      setError('Failed to sign in with Microsoft');
    } finally {
      setIsLoading(false);
    }
  };

  const ruleResults = useMemo(
    () => RULES.map((r) => ({ ...r, pass: r.test(password) })),
    [password],
  );
  const allRulesPass = ruleResults.every((r) => r.pass);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const formValid = allRulesPass && passwordsMatch && displayName.trim() && email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!formValid) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await signUpWithEmail(email, password, displayName);
      await logout();
      setSuccess('Account created. Check your email and verify your address before signing in.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm
    bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)]
    text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)]
    focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)]
    focus:outline-none transition-all duration-200`;

  const labelCls =
    'block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-1.5';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4
      bg-[radial-gradient(900px_500px_at_50%_-10%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_60%),linear-gradient(160deg,var(--bg-0),var(--bg-1)_55%,var(--bg-2))]"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <IronmindLogo variant="auth" priority className="mb-3" />
          <p className="text-sm text-[color:var(--text-2)] mt-2 uppercase tracking-[0.2em]">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[14px] p-6 bg-[color:var(--panel-strong)] backdrop-blur-xl
          border border-[color:var(--chrome-border)] shadow-[var(--shadow-strong)]"
        >
          <h2 className="text-xl font-bold font-heading tracking-tight text-[color:var(--text-0)] mb-6">
            Sign Up
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[color:color-mix(in_srgb,var(--bad)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--bad)_30%,transparent)] text-[color:var(--bad)]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[color:color-mix(in_srgb,var(--good)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--good)_30%,transparent)] text-[color:var(--good)]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Display name */}
            <div>
              <label htmlFor="displayName" className={labelCls}>
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputCls}
                placeholder="Your name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelCls}>
                Password
              </label>
              <PasswordInput id="password" value={password} onChange={setPassword} />

              {/* Rules checklist — show as soon as user starts typing */}
              {(password.length > 0 || touched) && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {ruleResults.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200
                        ${
                          r.pass
                            ? 'bg-[color:color-mix(in_srgb,var(--good)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--good)_45%,transparent)]'
                            : 'bg-[color:var(--surface-track)] border border-[color:var(--chrome-border)]'
                        }`}
                      >
                        {r.pass ? (
                          <Check size={9} className="text-[color:var(--good)]" />
                        ) : (
                          <X size={9} className="text-[color:var(--text-2)]" />
                        )}
                      </div>
                      <span
                        className={`text-xs transition-colors duration-200 ${r.pass ? 'text-[color:var(--good)]' : 'text-[color:var(--text-2)]'}`}
                      >
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className={labelCls}>
                Confirm Password
              </label>
              <PasswordInput
                id="confirm"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter password"
              />

              {/* Match indicator */}
              {confirm.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                    ${
                      passwordsMatch
                        ? 'bg-[color:color-mix(in_srgb,var(--good)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--good)_45%,transparent)]'
                        : 'bg-[color:color-mix(in_srgb,var(--bad)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--bad)_35%,transparent)]'
                    }`}
                  >
                    {passwordsMatch ? (
                      <Check size={9} className="text-[color:var(--good)]" />
                    ) : (
                      <X size={9} className="text-[color:var(--bad)]" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${passwordsMatch ? 'text-[color:var(--good)]' : 'text-[color:var(--bad)]'}`}
                  >
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full py-3 rounded-lg font-semibold text-sm text-white
                bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
                shadow-[0_8px_22px_color-mix(in_srgb,var(--accent)_25%,transparent)]
                hover:brightness-110 active:scale-95 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Facebook / Microsoft — hidden until console credentials are configured */}
          {false && (
            <>
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-[color:var(--chrome-border)]" />
                <span className="text-xs text-[color:var(--text-2)] uppercase tracking-[0.15em]">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-[color:var(--chrome-border)]" />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleFacebookRegister}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium
                    bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)]
                    hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50
                    flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Continue with Facebook
                </button>

                <button
                  type="button"
                  onClick={handleMicrosoftRegister}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium
                    bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)]
                    hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50
                    flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Continue with Microsoft
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[color:var(--text-2)] mt-6">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-[color:var(--accent)] hover:text-[color:var(--accent-light)] underline underline-offset-2 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
