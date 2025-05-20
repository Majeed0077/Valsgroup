  'use client';

  import React, { useRef, useEffect, useState } from 'react';
  import Image from 'next/image';
  import styles from './Sidebar.module.css';
  import Panels from './Panels';

  import logo from '../../public/icons/logo.png';
  import logoHover from '../../public/icons/logo1.png';
  import dashboard from '../../public/icons/Group-3.png';
  import tracking from '../../public/icons/Group-2.png';
  import report from '../../public/icons/Vector-1.png';
  import chart from '../../public/icons/Group.png';
  import setting from '../../public/icons/Group-1.png';
  import toggleIcon from '../../public/icons/Vector.png';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboard },
    { id: 'tracking', label: 'Tracking', icon: tracking },
    { id: 'report', label: 'Report', icon: report },
    { id: 'chart', label: 'Chart', icon: chart },
    { id: 'setting', label: 'Setting', icon: setting },
  ];

  const Sidebar = () => {
    const [dashboardVisible, setDashboardVisible] = useState(false);
    const buttonRef = useRef(null);

    const toggleSidebar = () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
      }
    };

    const showDashboard = () => {
      const button = buttonRef.current;
      setDashboardVisible((prev) => {
        const nowVisible = !prev;
        if (button) {
          button.style.left = nowVisible ? '760px' : '140px';
        }
        return nowVisible;
      });
    };

    useEffect(() => {
      const button = buttonRef.current;
      if (button) {
        button.style.left = '140px';
      }
    }, []);

    return (
      <>
        {/* Sidebar */}
        <div className={styles.sidebar} id="sidebar">
          <div className={styles.sidebarLogo}>
            <a href="#">
              <Image
                className={styles.logoDefault}
                src={logo}
                alt="Logo"
                width={70}
                height={70}
              />
              <Image
                className={styles.logoHover}
                src={logoHover}
                alt="Logo Hover"
                width={70}
                height={70}
              />
            </a>
          </div>

          <ul className={styles.menu}>
            {navItems.map((item) => (
              <li key={item.id} className={styles.menuItem}>
                <a href="#">
                  <Image
                    src={item.icon}
                    alt={`${item.label} Icon`}
                    width={24}
                    height={24}
                  />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <button className={styles.toggleBtn} onClick={toggleSidebar}>
            <Image src={toggleIcon} alt="Toggle Icon" width={20} height={20} />
          </button>
        </div>

        {/* Orange Toggle Button */}
        <div
          ref={buttonRef}
          className={styles.verticalOrangeButton}
          onClick={showDashboard}
        ></div>

        {/* Floating Dashboard Overlay */}
        {dashboardVisible && (
          <div
            style={{
              position: 'fixed',
              top: '100px',
              left: '140px',
              width: '620px',
              zIndex: 9998,
            }}
          >
            <Panels/>
          </div>
        )}
      </>
    );
  };

  export default Sidebar;
