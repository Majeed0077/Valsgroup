'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { FaBars } from 'react-icons/fa';
import styles from '@/app/page.module.css';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const hideSidebarRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthPage = hideSidebarRoutes.includes(pathname);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthPage) return <>{children}</>;

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
        vehicleGroups={{}}
        activeGroups={[]}
        setActiveGroups={() => {}}
        onVehicleSelect={() => {}}
        isLoading={false}
      />

      {!isSidebarOpen && (
        <button
          className={styles.openSidebarButton}
          onClick={() => setIsSidebarOpen(true)}
          title="Open Sidebar"
        >
          <FaBars size={20} />
        </button>
      )}

      <div
        className={styles.contentArea}
        style={{ marginLeft: isSidebarOpen ? '140px' : '0' }}
      >
        {children}
      </div>
    </>
  );
}
