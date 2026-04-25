'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { brandAssets } from '@/lib/constants/brand-assets';
import {
  logout,
  resendEmailVerification,
  signInWithEmail,
  signInWithFacebook,
  signInWithGoogle,
  signInWithMicrosoft,
} from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');
    setShowResend(false);

    try {
      const user = await signInWithEmail(email, password);
      if (!user.emailVerified) {
        await resendEmailVerification();
        await logout();
        setError('Email not verified yet. We sent a fresh verification link.');
        setShowResend(true);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setInfo('');
    setShowResend(false);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      setError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError('');
    setInfo('');
    setShowResend(false);
    try {
      await signInWithFacebook();
      router.push('/dashboard');
    } catch {
      setError('Failed to sign in with Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');
    setInfo('');
    setShowResend(false);
    try {
      await signInWithMicrosoft();
      router.push('/dashboard');
    } catch {
      setError('Failed to sign in with Microsoft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      const user = await signInWithEmail(email, password);
      if (user.emailVerified) {
        setInfo('Email already verified. You can sign in now.');
      } else {
        await resendEmailVerification();
        setInfo('Verification email sent. Check your inbox and spam folder.');
      }
      await logout();
    } catch {
      setError('Could not resend verification email. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo — combined male + female mark (transparent PNG) */}
        <div className="text-center mb-8">
          <Image
            src={brandAssets.logoCombined}
            alt="IRONMIND"
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 640px) 85vw, 384px"
            className="mx-auto mb-3 h-auto max-h-[min(28vh,240px)] w-auto max-w-[min(100%,384px)] object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          />
          <p className="text-[color:var(--text-1)] mt-2">Elite Bodybuilding Performance</p>
        </div>

        {/* Login Card */}
        <div className="bg-[color:var(--panel-strong)] border border-[color:var(--chrome-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-[color:color-mix(in_srgb,var(--good)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--good)_20%,transparent)] rounded-lg text-[color:var(--good)] text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--text-1)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] rounded-lg text-[color:var(--text-0)] focus:outline-none focus:border-[color:var(--accent)]"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text-1)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] rounded-lg text-[color:var(--text-0)] focus:outline-none focus:border-[color:var(--accent)]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-[color:var(--text-2)]">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)] font-medium rounded-lg hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </button>

          {/* Facebook / Microsoft — hidden until console credentials are configured */}
          {false && (
            <>
              <button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="w-full py-2.5 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)] font-medium rounded-lg hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              <button
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className="w-full py-2.5 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)] font-medium rounded-lg hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Continue with Microsoft
              </button>
            </>
          )}

          {showResend && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full mt-3 py-2.5 bg-[color:var(--bg-2)] border border-[color:var(--chrome-border)] text-[color:var(--text-0)] font-medium rounded-lg hover:bg-[color:var(--surface-track)] transition-colors disabled:opacity-50"
            >
              Resend verification email
            </button>
          )}
        </div>

        <p className="text-center text-sm text-[color:var(--text-2)] mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-[color:var(--accent)] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
