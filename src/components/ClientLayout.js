// src/components/ClientLayout.js
'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaBars } from 'react-icons/fa';
import styles from '@/app/page.module.css';

export default function ClientLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
      />
      {!isSidebarOpen && (
        <button
          className={styles.openSidebarButton}
          onClick={toggleSidebar}
          title="Open Sidebar"
        >
          <FaBars size={20} />
        </button>
      )}
      <Header onSearch={() => {}} isSearching={false} />
      <div
        className={styles.contentArea}
        style={{ marginLeft: isSidebarOpen ? '260px' : '0' }}
      >
        {children}
      </div>
    </>
  );
}
