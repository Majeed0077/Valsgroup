'use client';

import React, { useState, useEffect } from 'react';
import styles from './FleetDashboard.module.css';
import Image from 'next/image';

const FleetDashboard = () => {
  const [activeTab, setActiveTab] = useState('vehical');
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    const checkboxes = document.querySelectorAll('.org-checkbox');
    checkboxes.forEach((cb) => {
      cb.checked = selectAll;
    });
  }, [selectAll]);

  const tabs = ['vehical', 'driver', 'location', 'geofence'];

  return (
    <div className={styles.dashboard}>
      {/* Navbar Tabs */}
      <div className={styles.navbar}>
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={`${styles.statusBox} ${styles.green}`}>22<br />Running</div>
        <div className={`${styles.statusBox} ${styles.yellow}`}>01<br />Idle</div>
        <div className={`${styles.statusBox} ${styles.blue}`}>01<br />Inactive</div>
        <div className={`${styles.statusBox} ${styles.red}`}>82<br />Stopped</div>
        <div className={`${styles.statusBox} ${styles.gray}`}>0<br />No Data</div>
        <div className={`${styles.statusBox} ${styles.orange}`}>105<br />Total</div>
      </div>

      {/* Filter Row */}
      <div className={styles.filterRow}>
        <div className={styles.orgFilter}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
            />
            Select All
          </label>
          <label className={styles.checkbox}>
            <input type="checkbox" className="org-checkbox" defaultChecked /> The Indus Logistics
          </label>
          <label className={styles.checkbox}>
            <input type="checkbox" className="org-checkbox" defaultChecked /> Engro
          </label>
        </div>

        <input type="text" placeholder="Search by IMEI, Registration, etc." />

        <div className={styles.filterIcons}>
          <i className="fas fa-search"></i>
          <i className="fas fa-filter"></i>
          <i className="fas fa-list"></i>
          <i className="fas fa-user-group"></i>
        </div>
      </div>

      {/* Panels */}
      {activeTab === 'vehical' && (
        <div className={`${styles.panel} ${styles.active}`}>
          <div className={styles.dataTable}>
            <div className={styles.dataRow}>
              <div className={`${styles.dot} ${styles.green}`}></div>
              <div className={styles.idTime}>
                <strong>TS-0001</strong>
                <small>22-04-2025 10:09:52 AM</small>
              </div>
              <div className={styles.locationText}>
                Shahrah Faisal, PECHS, Block 5<br />
                9.05 km from Pakistan State Oil (PSO)...
              </div>
              <div className={styles.icons}>
                <i className="fas fa-signal"></i>
                <i className="fas fa-video"></i>
                <i className="fas fa-camera"></i>
                <i className="fas fa-thumbs-up"></i>
                <i className="fas fa-ellipsis-v"></i>
              </div>
            </div>
          </div>
          <div className={styles.footerButtons}>
            <button>Save Selection</button>
            <button>Live Streaming</button>
          </div>
        </div>
      )}

      {activeTab === 'driver' && (
        <div className={`${styles.panel} ${styles.active}`}>
          <div className={styles.dataTable}>
            <div className={styles.dataRow}>
              <div className={`${styles.dot} ${styles.blue}`}></div>
              <div className={styles.driverName}>
                <strong>Samama Anees</strong><br />
                <small>TS-0001</small>
              </div>
              <div className={styles.driverStatus}>Allocated</div>
              <div className={styles.driverRole}>Default</div>
              <div className={styles.menuIcon}>
                <i className="fas fa-ellipsis-v"></i>
              </div>
            </div>
          </div>
          <div className={styles.footerButtons}>
            <button>XLS</button>
            <button>PDF</button>
          </div>
        </div>
      )}

      {activeTab === 'location' && (
        <div className={`${styles.panel} ${styles.active}`}>
          <div className={styles.dataTable}>
            <div className={styles.dataRow}>
              <label>
                <input type="checkbox" defaultChecked /> The Indus Logistics
              </label>
              <div className={styles.locationActions}>
                <i className="fas fa-map-marker-alt"></i>
                <i className="fas fa-trash"></i>
              </div>
            </div>
          </div>
          <div className={styles.footerButtons}>
            <button>XLS</button>
            <button>PDF</button>
          </div>
        </div>
      )}

      {activeTab === 'geofence' && (
        <div className={`${styles.panel} ${styles.active}`}>
          <div className={styles.dataTable}>
            <div className={styles.dataRow}>
              <label>
                <input type="checkbox" defaultChecked /> Karachi Toll-to-Toll Plaza
              </label>
              <div className={styles.locationActions}>
                <i className="fas fa-map-marker-alt"></i>
                <i className="fas fa-trash"></i>
              </div>
            </div>
          </div>
          <div className={styles.footerButtons}>
            <button>KML</button>
            <button>XLS</button>
            <button>PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetDashboard;
