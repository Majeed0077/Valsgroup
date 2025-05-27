'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { FaBars } from 'react-icons/fa';
import styles from '@/app/page.module.css';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');

  const hideSidebarRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthPage = hideSidebarRoutes.includes(pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

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
      <div
        className={styles.contentArea}
        style={{ marginLeft: isSidebarOpen ? '260px' : '0' }}
      >
        {children}
      </div>
    </>
  );
}
