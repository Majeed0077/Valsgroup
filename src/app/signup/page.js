'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const nameValue = name.trim();
  const emailValue = email.trim();
  const isNameValid = nameValue.length >= 2;
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue),
    [emailValue]
  );
  const isPasswordValid = password.length >= 6;
  const isMatch = password === confirmPassword;
  const canSubmit =
    isNameValid && isEmailValid && isPasswordValid && isMatch && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isNameValid) {
      setError('Please enter your full name.');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push('/login');
    } catch (err) {
      setError(err.message || 'An error occurred during sign up.');
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
            <h1 className={styles.leftTitle}>Create Account</h1>
            <p className={styles.leftText}>
              Sign up to manage your fleet efficiently and intelligently.
            </p>
            <ul className={styles.leftList}>
              <li>Unified dashboards for every fleet team.</li>
              <li>Automated insights to cut fuel waste.</li>
              <li>Secure access for every driver group.</li>
            </ul>
            <p className={styles.leftFoot}>Get started in under two minutes.</p>
          </div>

          <div className={styles.rightPanel}>
            <span className={styles.kicker}>Create access</span>
            <h2 className={styles.title}>Start your account</h2>
            <p className={styles.subtitle}>
              Use your work email to set up access.
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
                <label htmlFor="name" className={styles.label}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  aria-invalid={!isNameValid && name.length > 0}
                  required
                  className={styles.input}
                  disabled={isSubmitting}
                  placeholder="John Doe"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!isEmailValid && email.length > 0}
                  required
                  className={styles.input}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={!isPasswordValid && password.length > 0}
                    required
                    className={styles.input}
                    disabled={isSubmitting}
                    placeholder="Create a password"
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
                <p className={styles.helpText}>Minimum 6 characters.</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.inputWrap}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={!isMatch && confirmPassword.length > 0}
                    required
                    className={styles.input}
                    disabled={isSubmitting}
                    placeholder="Repeat your password"
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
              <p className={styles.helpText}>
                Already have access? You can sign in any time.
              </p>
            </form>
            <div className={styles.links}>
              <Link href="/login" className={styles.link}>
                Already have an account? Sign In
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
