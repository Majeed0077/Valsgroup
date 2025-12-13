'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
 
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (email === "test@example.com" && password === "password") {
        sessionStorage.setItem('isLoggedIn', 'true');
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
        {/* Left Side */}
        <div className={styles.leftPanel}>
          <h1 className={styles.leftTitle}>Welcome Back</h1>
          <p className={styles.leftText}>Fast, efficient and productive platform for your fleet tracking needs.</p>
          {/* <div className={styles.languageSelect}>🇺🇸 English</div> */}
        </div>

        {/* Right Side (Login Form) */}
        <div className={styles.rightPanel}>
          <p className={styles.subtitle}>Please sign in to your account</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="you@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.links}>
            <Link href="/forgot-password" className={styles.link}>Forgot Password?</Link>
            <span className={styles.separator}>|</span>
            <Link href="/signup" className={styles.link}>Don&apos;t have an account? Sign Up</Link>
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
