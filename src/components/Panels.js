'use client';

import React, { useMemo, useState } from 'react';
import styles from './Panels.module.css';
import {
  FaEllipsisV,
  FaFilter,
  FaMapMarkerAlt,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaExpand,
  FaVideo,
  FaThumbsUp,
  FaWifi,
  FaBriefcase,
  FaSortAmountDown,
} from 'react-icons/fa';

const statusCards = [
  { value: '22', label: 'Running', className: 'running' },
  { value: '01', label: 'Idle', className: 'idle' },
  { value: '01', label: 'Inactive', className: 'inactive' },
  { value: '82', label: 'Stopped', className: 'stopped' },
  { value: '0', label: 'No Data', className: 'nodata' },
  { value: '105', label: 'Total', className: 'total' },
];

const vehicleRows = Array.from({ length: 11 }).map((_, index) => ({
  id: `TS-00${String(index + 1).padStart(2, '0')}`,
  time: '22-04-2025 10:09:52 AM',
  address: 'Shahrah Faisal, PECHS, Block 5',
  distance: '9.05 km from Pakistan State Oil (PSO)...',
}));

const driverRows = [
  { name: 'Samama Anees', id: 'TS-0001', status: 'Allocated', role: 'Default' },
  { name: 'Kaif Ahmed', id: 'TS-0002', status: 'Not Allocated', role: 'Default' },
  { name: 'Uzain', id: 'TS-0003', status: 'Allocated', role: 'Default' },
  { name: 'Huzaifa', id: 'TS-0004', status: 'Allocated', role: 'Default' },
  { name: 'Usama', id: 'TS-0005', status: 'Allocated', role: 'Default' },
  { name: 'Saim', id: 'TS-0006', status: 'Allocated', role: 'Default' },
  { name: 'Jatoon', id: 'TS-0007', status: 'Allocated', role: 'Default' },
  { name: 'Rehan', id: 'TS-0008', status: 'Allocated', role: 'Default' },
  { name: 'Noman', id: 'TS-0009', status: 'Allocated', role: 'Default' },
];

const locationRows = [
  'The Indus Logistics',
  'Dawlance (DPL) Parking Area Landhi Karachi',
  'Farhan Petroleum Service - Fuel filling',
  'Near Quetta Lucky Green Hotel, Looni',
  'Pepsico Plant Multan - Parking',
  'Pepsico WH Hyd - Parking',
  'R - Customer Address',
  'Shabbir Tiles Multan WH - Warehouse',
  'Shabbir Tiles Unit 2 Karachi - Parking',
];

const geofenceRows = [
  'Karachi Toll-to-Toll Plaza',
  'Farhan Petroleum Service',
  'Burki Gasoline',
  'Shell Daharki Filling Station',
  'Mehran Petroleum Service',
  'United Refrigeration Industrial',
  'Haier Warehouse Hyderabad',
  'DPL 1 Factory Landhi',
  'DPL 2 Factory Landhi',
];

const tabs = [
  { id: 'vehical', label: 'Vehical' },
  { id: 'driver', label: 'Driver' },
  { id: 'location', label: 'Location' },
  { id: 'geofence', label: 'Geofence' },
];

const Panels = () => {
  const [activeTab, setActiveTab] = useState('vehical');
  const [companySelection, setCompanySelection] = useState({
    indus: true,
    engro: true,
  });

  const selectAll = useMemo(() => Object.values(companySelection).every(Boolean), [companySelection]);

  return (
    <div className={styles.panelRoot}>
      <div className={styles.navbar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.statusBar}>
        {statusCards.map((card) => (
          <div key={card.label} className={`${styles.statusCard} ${styles[card.className]}`}>
            <span className={styles.statusValue}>{card.value}</span>
            <span className={styles.statusLabel}>{card.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.searchRow}>
        <label className={styles.iconCheck}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={(event) =>
              setCompanySelection({
                indus: event.target.checked,
                engro: event.target.checked,
              })
            }
          />
        </label>
        <div className={styles.searchWrap}>
          <FaSearch size={12} />
          <input type="text" placeholder="Search by IMEI, Registration, Object Model, SIM Number, etc." />
        </div>
        <button type="button" className={styles.iconBtn} aria-label="Refresh">
          <FaSyncAlt />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Filter">
          <FaFilter />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Sort">
          <FaSortAmountDown />
        </button>
      </div>

      <div className={styles.companyRow}>
        <label>
          <input
            type="checkbox"
            checked={companySelection.indus}
            onChange={(event) =>
              setCompanySelection((prev) => ({ ...prev, indus: event.target.checked }))
            }
          />
          <span>The Indus Logistics</span>
        </label>
      </div>

      <div className={styles.companyRow}>
        <label>
          <input
            type="checkbox"
            checked={companySelection.engro}
            onChange={(event) =>
              setCompanySelection((prev) => ({ ...prev, engro: event.target.checked }))
            }
          />
          <span>Engro</span>
        </label>
      </div>

      <div className={styles.tableWrap}>
        {activeTab === 'vehical' &&
          vehicleRows.map((row) => (
            <div key={row.id} className={`${styles.dataRow} ${styles.vehicleRow}`}>
              <span className={styles.dot} />
              <div className={styles.leftBlock}>
                <strong>{row.id}</strong>
                <small>{row.time}</small>
              </div>
              <div className={styles.middleBlock}>
                <span>{row.address}</span>
                <span>{row.distance}</span>
              </div>
              <div className={styles.rightIcons}>
                <FaWifi />
                <FaThumbsUp />
                <FaVideo />
                <FaBriefcase />
                <FaExpand />
              </div>
            </div>
          ))}

        {activeTab === 'driver' &&
          driverRows.map((row) => (
            <div key={row.id} className={`${styles.dataRow} ${styles.driverRow}`}>
              <span className={`${styles.dot} ${styles.blueDot}`} />
              <div className={styles.driverName}>
                <strong>{row.name}</strong>
                <small>{row.id}</small>
              </div>
              <div className={styles.driverStatus}>{row.status}</div>
              <div className={styles.driverRole}>{row.role}</div>
              <div className={styles.rightIcons}>
                <FaEllipsisV />
              </div>
            </div>
          ))}

        {activeTab === 'location' &&
          locationRows.map((name) => (
            <div key={name} className={`${styles.dataRow} ${styles.listRow}`}>
              <label className={styles.rowCheck}>
                <input type="checkbox" defaultChecked />
                <span className={styles.listName}>{name}</span>
              </label>
              <div className={styles.rightIcons}>
                <FaMapMarkerAlt />
                <FaTrash />
                <FaExpand />
              </div>
            </div>
          ))}

        {activeTab === 'geofence' &&
          geofenceRows.map((name) => (
            <div key={name} className={`${styles.dataRow} ${styles.listRow}`}>
              <label className={styles.rowCheck}>
                <input type="checkbox" defaultChecked />
                <span className={styles.listName}>{name}</span>
              </label>
              <div className={styles.rightIcons}>
                <FaMapMarkerAlt />
                <FaTrash />
                <FaExpand />
              </div>
            </div>
          ))}
      </div>

      <div className={styles.footer}>
        {activeTab === 'vehical' && (
          <>
            <button type="button">Save Selection</button>
            <button type="button">Live Streaming</button>
          </>
        )}
        {activeTab === 'driver' && (
          <>
            <button type="button">XLS</button>
            <button type="button">PDF</button>
          </>
        )}
        {activeTab === 'location' && (
          <>
            <button type="button">XLS</button>
            <button type="button">PDF</button>
          </>
        )}
        {activeTab === 'geofence' && (
          <>
            <button type="button">KML</button>
            <button type="button">XLS</button>
            <button type="button">PDF</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Panels;
