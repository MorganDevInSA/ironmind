'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { logout, signUpWithEmail } from '@/lib/firebase';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

// ─── password rules ───────────────────────────────────────────────────────────

const RULES = [
  { id: 'length',   label: 'At least 8 characters',       test: (p: string) => p.length >= 8 },
  { id: 'upper',    label: 'One uppercase letter',         test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number',   label: 'One number',                   test: (p: string) => /[0-9]/.test(p) },
  { id: 'special',  label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
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
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm
          bg-[#131313] border border-[rgba(65,50,50,0.50)]
          text-[#F0F0F0] placeholder:text-[#5E5E5E]
          focus:border-[rgba(220,38,38,0.50)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]
          focus:outline-none transition-all duration-200"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E5E5E] hover:text-[#9A9A9A] transition-colors"
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
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [touched, setTouched]         = useState(false);

  const ruleResults = useMemo(() => RULES.map(r => ({ ...r, pass: r.test(password) })), [password]);
  const allRulesPass = ruleResults.every(r => r.pass);
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
    bg-[#131313] border border-[rgba(65,50,50,0.50)]
    text-[#F0F0F0] placeholder:text-[#5E5E5E]
    focus:border-[rgba(220,38,38,0.50)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]
    focus:outline-none transition-all duration-200`;

  const labelCls = 'block text-xs font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-1.5';

  return (
    <div className="min-h-screen flex items-center justify-center p-4
      bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(180,20,20,0.07),transparent_60%),linear-gradient(160deg,#080808,#0D0D0D_55%,#131313)]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <IronmindLogo variant="auth" priority className="mb-3" />
          <p className="text-sm text-[#5E5E5E] mt-2 uppercase tracking-[0.2em]">Create your account</p>
        </div>

        {/* Card */}
        <div className="rounded-[14px] p-6 bg-[rgba(18,14,14,0.94)] backdrop-blur-xl
          border border-[rgba(65,50,50,0.40)] shadow-[0_16px_40px_rgba(0,0,0,0.60)]">
          <h2 className="text-xl font-bold font-heading tracking-tight text-[#F0F0F0] mb-6">Sign Up</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.30)] text-[#EF4444]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.30)] text-[#22C55E]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Display name */}
            <div>
              <label htmlFor="displayName" className={labelCls}>Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={inputCls}
                placeholder="Your name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <PasswordInput id="password" value={password} onChange={setPassword} />

              {/* Rules checklist — show as soon as user starts typing */}
              {(password.length > 0 || touched) && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {ruleResults.map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200
                        ${r.pass
                          ? 'bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.45)]'
                          : 'bg-[rgba(65,50,50,0.40)] border border-[rgba(65,50,50,0.50)]'}`}>
                        {r.pass
                          ? <Check size={9} className="text-[#22C55E]" />
                          : <X size={9} className="text-[#5E5E5E]" />}
                      </div>
                      <span className={`text-xs transition-colors duration-200 ${r.pass ? 'text-[#22C55E]' : 'text-[#5E5E5E]'}`}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className={labelCls}>Confirm Password</label>
              <PasswordInput id="confirm" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />

              {/* Match indicator */}
              {confirm.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                    ${passwordsMatch
                      ? 'bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.45)]'
                      : 'bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.35)]'}`}>
                    {passwordsMatch
                      ? <Check size={9} className="text-[#22C55E]" />
                      : <X size={9} className="text-[#EF4444]" />}
                  </div>
                  <span className={`text-xs ${passwordsMatch ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full py-3 rounded-lg font-semibold text-sm text-white
                bg-gradient-to-r from-[#DC2626] to-[#B91C1C] border border-[rgba(220,38,38,0.5)]
                shadow-[0_8px_22px_rgba(220,38,38,0.25)]
                hover:brightness-110 active:scale-95 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#5E5E5E] mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
