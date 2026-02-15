'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { FaBell, FaQuestionCircle, FaSearch, FaSignOutAlt, FaSpinner, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/app/fleet-dashboard/useAuth';

const Header = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { authChecked, isAuthenticated } = useAuth();
  const notificationsRef = useRef(null);

  const notifications = [
    { id: 1, level: 'High', message: 'Overspeed alert on TS-0001', time: '2m ago' },
    { id: 2, level: 'Medium', message: 'Fuel level low on DUMMY-003', time: '8m ago' },
    { id: 3, level: 'Low', message: 'Reminder due for service', time: '12m ago' },
  ];

  const highCount = notifications.filter((item) => item.level === 'High').length;
  const mediumCount = notifications.filter((item) => item.level === 'Medium').length;
  const lowCount = notifications.filter((item) => item.level === 'Low').length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const profileRef = useRef(null);

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
        <div ref={notificationsRef} className={styles.notificationsWrap}>
          <button
            className={styles.iconButtonWrapper}
            title="Notifications"
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
          >
            <FaBell size={18} className={styles.iconButtonIcon} />
            <span className={styles.notificationBadge}></span>
          </button>
          {isNotificationsOpen && (
            <div className={styles.notificationsPanel}>
              <div className={styles.notificationsHeader}>
                <span>Notifications</span>
              </div>
              <div className={styles.notificationsSummary}>
                <div className={styles.high}>High <strong>{highCount}</strong></div>
                <div className={styles.medium}>Medium <strong>{mediumCount}</strong></div>
                <div className={styles.low}>Low <strong>{lowCount}</strong></div>
              </div>
              <div className={styles.notificationsList}>
                {notifications.map((item) => (
                  <div key={item.id} className={styles.notificationItem}>
                    <span className={`${styles.levelDot} ${styles[`dot${item.level}`]}`} />
                    <div className={styles.notificationText}>
                      <p>{item.message}</p>
                      <small>{item.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className={styles.iconButtonWrapper} title="Help">
          <FaQuestionCircle size={18} className={styles.iconButtonIcon} />
        </button>

        {isAuthenticated ? (
          <>
            <div ref={profileRef} className={styles.profileWrap}>
              <button
                className={styles.userIconWrapper}
                title="User Profile"
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                <FaUserCircle size={22} className={styles.userIcon} />
                <span className={styles.statusIndicator}></span>
              </button>
              {isProfileOpen && (
                <div className={styles.profileMenu}>
                  <Link href="/profile" className={styles.profileMenuItem}>Profile</Link>
                  <Link href="/settings" className={styles.profileMenuItem}>Settings</Link>
                  <button
                    className={styles.profileMenuItem}
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem('isLoggedIn', 'false');
                      } catch {}
                      window.location.href = '/login';
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
