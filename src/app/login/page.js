'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  const emailValue = email.trim();
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue),
    [emailValue]
  );
  const isPasswordValid = password.length >= 6;
  const canSubmit = isEmailValid && isPasswordValid && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (emailValue === 'test@example.com' && password === 'password') {
        sessionStorage.setItem('isLoggedIn', 'true');
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', emailValue);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        router.push('/');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.formContainer}>
          <div className={styles.leftPanel}>
            <div className={styles.brandPill}>VTP</div>
            <h1 className={styles.leftTitle}>Welcome Back</h1>
            <p className={styles.leftText}>
              Fast, efficient and productive platform for your fleet tracking
              needs.
            </p>
            <ul className={styles.leftList}>
              <li>Live vehicle telemetry and route replay.</li>
              <li>Driver behavior insights and instant alerts.</li>
              <li>Maintenance planning that saves downtime.</li>
            </ul>
            <p className={styles.leftFoot}>Trusted by logistics teams who move fast.</p>
          </div>

          <div className={styles.rightPanel}>
            <span className={styles.kicker}>Secure access</span>
            <h2 className={styles.title}>Sign in</h2>
            <p className={styles.subtitle}>
              Use your work email to access the customer panel.
            </p>

            <form
              onSubmit={handleSubmit}
              className={styles.form}
              noValidate
              aria-busy={isSubmitting}
            >
              {error && (
                <p className={styles.error} role="alert" aria-live="polite">
                  {error}
                </p>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!isEmailValid && email.length > 0}
                  required
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={!isPasswordValid && password.length > 0}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isSubmitting}
                />
                Remember this device
              </label>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
              <p className={styles.helpText}>
                Having trouble? Contact your fleet admin for access.
              </p>
            </form>

            <div className={styles.links}>
              <Link href="/forgot-password" className={styles.link}>
                Forgot Password?
              </Link>
              <span className={styles.separator}>|</span>
              <Link href="/signup" className={styles.link}>
                Don&apos;t have an account? Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        Powered by <strong>&nbsp;Visual Telematics Platform</strong>
      </footer>
    </div>
  );
}
