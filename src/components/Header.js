'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { FaBell, FaQuestionCircle, FaSearch, FaSpinner, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/app/fleet-dashboard/useAuth';

const Header = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { authChecked, isAuthenticated } = useAuth();

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const term = searchTerm.trim();
    if (!isSearching && onSearch && term) onSearch(term);
  };

  if (!authChecked) {
    return (
      <div className={styles.header}>
        <div>Loading.</div>
      </div>
    );
  }

  return (
    <div className={styles.header}>
      <div className={styles.searchContainer}>
        <FaSearch size={16} className={styles.searchIconInternal} />
        <input
          type="text"
          placeholder="Search"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSearching) handleSearchSubmit(e);
          }}
          disabled={isSearching}
        />
        {isSearching && <FaSpinner className={styles.searchSpinner} size={16} />}
      </div>

      <div className={styles.controls}>
        <button className={styles.iconButtonWrapper} title="Notifications">
          <FaBell size={18} className={styles.iconButtonIcon} />
          <span className={styles.notificationBadge}></span>
        </button>

        <button className={styles.iconButtonWrapper} title="Help">
          <FaQuestionCircle size={18} className={styles.iconButtonIcon} />
        </button>

        {isAuthenticated ? (
          <>
            <div className={styles.userIconWrapper} title="User Profile">
              <FaUserCircle size={22} className={styles.userIcon} />
              <span className={styles.statusIndicator}></span>
            </div>

            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('isLoggedIn', 'false');
                } catch {}
                window.location.href = '/login';
              }}
              className={styles.loginButton}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.signInLink}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.loginButton}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
