'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { FaBell, FaQuestionCircle, FaSearch, FaSpinner, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../app/fleet-dashboard/useAuth'

const Header = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { authChecked, isAuthenticated } = useAuth();

  const handleInputChange = (e) => setSearchTerm(e.target.value);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isSearching && onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSearching) handleSearchSubmit();
  };

  if (!authChecked) {
    // Auth status not checked yet — show loading UI or nothing
    return (
      <div className={styles.header}>
        <div>Loading...</div>
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
            {/* For logout, you must implement your logout handler to clear sessionStorage and redirect */}
            <button
              onClick={() => {
                sessionStorage.setItem('isLoggedIn', 'false'); // clear auth flag
                window.location.reload(); // or better: router.push('/login');
              }}
              className={styles.loginButton}
              style={{ marginLeft: '10px' }}
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
