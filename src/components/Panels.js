'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './Panels.module.css';
import {
  FaCog,
  FaCamera,
  FaEllipsisV,
  FaFilter,
  FaGripVertical,
  FaLock,
  FaMapMarkerAlt,
  FaPlayCircle,
  FaSearch,
  FaSignal,
  FaSlidersH,
  FaSyncAlt,
  FaTrash,
  FaExpand,
  FaVideo,
  FaThumbsUp,
  FaWifi,
  FaBriefcase,
  FaSortAmountDown,
  FaWrench,
  FaBatteryHalf,
  FaMinus,
} from 'react-icons/fa';

const statusCards = [
  { id: 'running', label: 'Running', className: 'running' },
  { id: 'idle', label: 'Idle', className: 'idle' },
  { id: 'inactive', label: 'Inactive', className: 'inactive' },
  { id: 'stopped', label: 'Stopped', className: 'stopped' },
  { id: 'nodata', label: 'No Data', className: 'nodata' },
  { id: 'total', label: 'Total', className: 'total' },
];

const vehicleRows = Array.from({ length: 11 }).map((_, index) => ({
  id: `TS-00${String(index + 1).padStart(2, '0')}`,
  time: '22-04-2025 10:09:52 AM',
  address: 'Shahrah Faisal, PECHS, Block 5',
  distance: '9.05 km from Pakistan State Oil (PSO)...',
  speed: index % 3 === 0 ? '0' : String((index + 2) * 3),
  voltage: `${(12 + (index % 5) * 0.7).toFixed(1)}V`,
  status:
    index % 5 === 0
      ? 'stopped'
      : index % 5 === 1
      ? 'running'
      : index % 5 === 2
      ? 'idle'
      : index % 5 === 3
      ? 'inactive'
      : 'nodata',
  company: index % 2 === 0 ? 'indus' : 'engro',
}));

const driverRows = [
  { name: 'Majeed Abro', id: 'TS-0001', status: 'Allocated', role: 'Default' },
  { name: 'Atif u Rahman', id: 'TS-0002', status: 'Not Allocated', role: 'Default' },
  { name: 'Abid u Rahman', id: 'TS-0003', status: 'Allocated', role: 'Default' },
  { name: 'Sayed Farhan', id: 'TS-0004', status: 'Allocated', role: 'Default' },
  { name: 'Abdul Hameed', id: 'TS-0005', status: 'Allocated', role: 'Default' },
  { name: 'Kaif u din', id: 'TS-0006', status: 'Allocated', role: 'Default' },
  { name: 'Uzain', id: 'TS-0007', status: 'Allocated', role: 'Default' },
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

const objectListColumnGroups = [
  {
    title: 'Sensors',
    checked: false,
    items: [
      { label: 'Ignition', checked: true },
      { label: 'Power', checked: true },
      { label: 'GSM', checked: true },
      { label: 'GPS', checked: true },
      { label: 'External voltage', checked: true },
      { label: 'OBD', checked: false },
      { label: 'SOC', checked: false },
      { label: 'Charging Status', checked: false },
      { label: 'SOH', checked: false },
      { label: 'Battery Temperature', checked: false },
      { label: 'Passenger Seat', checked: false },
      { label: 'Beacon', checked: false },
      { label: 'Taximeter', checked: false },
    ],
  },
  {
    title: 'Address',
    checked: true,
    items: [{ label: 'Address', checked: true }],
  },
  {
    title: 'Object Activity',
    checked: false,
    items: [
      { label: 'Last Updated', checked: true, hasOptions: true },
      { label: 'Mode', checked: true },
      { label: 'Driver', checked: false },
      { label: 'Driver Mobile Number', checked: false },
      { label: 'TimeLine Chart', checked: false },
      { label: 'Number of passenger seat', checked: false },
      { label: 'Reminder', checked: false },
      { label: 'Notes', checked: false },
      { label: 'Reports', checked: false, hasOptions: true },
      { label: 'Object Health', checked: false },
      { label: 'Expiry Date', checked: false },
      { label: 'VIN', checked: false },
    ],
  },
  {
    title: 'Video Telematics',
    checked: false,
    items: [
      { label: 'Live Streaming', checked: false },
      { label: 'Snapshot', checked: false },
      { label: 'Video Playback', checked: false },
      { label: 'Intercom Mic', checked: false },
    ],
  },
];

const initialObjectNameFields = {
  objectNumber: true,
  objectName: false,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const Panels = ({ isSettingsOpen: controlledSettingsOpen, onSettingsToggle, onPanelWidthChange }) => {
  const [activeTab, setActiveTab] = useState('vehical');
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const [objectNameFields, setObjectNameFields] = useState(initialObjectNameFields);
  const [columnGroups, setColumnGroups] = useState(objectListColumnGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('total');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState(() => new Set(vehicleRows.map((row) => row.id)));
  const [companySelection, setCompanySelection] = useState({
    indus: true,
    engro: true,
  });

  const companyRows = useMemo(
    () => ({
      indus: vehicleRows.filter((row) => row.company === 'indus'),
      engro: vehicleRows.filter((row) => row.company === 'engro'),
    }),
    []
  );

  const statusCounts = useMemo(() => {
    const counts = { running: 0, idle: 0, inactive: 0, stopped: 0, nodata: 0, total: 0 };
    vehicleRows.forEach((row) => {
      counts.total += 1;
      if (counts[row.status] !== undefined) counts[row.status] += 1;
    });
    return counts;
  }, []);

  const isSettingsOpen = typeof controlledSettingsOpen === 'boolean' ? controlledSettingsOpen : internalSettingsOpen;

  const isItemChecked = (groupTitle, itemLabel) =>
    !!columnGroups
      .find((group) => group.title === groupTitle)
      ?.items.find((item) => item.label === itemLabel)?.checked;

  const showObjectNumber = objectNameFields.objectNumber;
  const showObjectName = objectNameFields.objectName;
  const showMode = isItemChecked('Object Activity', 'Mode');
  const showLastUpdated = isItemChecked('Object Activity', 'Last Updated');
  const addressSelection = isItemChecked('Address', 'Address');
  const showAddress = addressSelection !== false;
  const showIgnition = isItemChecked('Sensors', 'Ignition');
  const showPower = isItemChecked('Sensors', 'Power');
  const showGsm = isItemChecked('Sensors', 'GSM');
  const showGps = isItemChecked('Sensors', 'GPS');
  const showExternalVoltage = isItemChecked('Sensors', 'External voltage');
  const showLiveStreaming = isItemChecked('Video Telematics', 'Live Streaming');
  const showSnapshot = isItemChecked('Video Telematics', 'Snapshot');
  const showVideoPlayback = isItemChecked('Video Telematics', 'Video Playback');
  const showIntercomMic = isItemChecked('Video Telematics', 'Intercom Mic');
  const rightActionCount = [
    showLiveStreaming,
    showSnapshot,
    showVideoPlayback,
    showIntercomMic,
  ].filter(Boolean).length;
  const rightActionWidth =
    rightActionCount > 0 ? rightActionCount * 16 + Math.max(0, rightActionCount - 1) * 6 : 0;

  const vehicleGridTemplate = [
    '16px',
    '10px',
    showObjectNumber || showObjectName || showLastUpdated ? '150px' : null,
    showMode ? '26px' : null,
    showIgnition ? '18px' : null,
    showPower ? '18px' : null,
    showGsm ? '18px' : null,
    showGps ? '18px' : null,
    showExternalVoltage ? '50px' : null,
    showAddress ? 'minmax(170px, 1fr)' : null,
    '18px',
    rightActionWidth > 0 ? `${rightActionWidth}px` : null,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!onPanelWidthChange) return;

    const getTargetWidth = () => {
      const columns = [
        16, // row checkbox
        10, // status dot
        showObjectNumber || showObjectName || showLastUpdated ? (showObjectName ? 190 : 160) : 0,
        showMode ? 30 : 0,
        showIgnition ? 18 : 0,
        showPower ? 18 : 0,
        showGsm ? 18 : 0,
        showGps ? 18 : 0,
        showExternalVoltage ? 64 : 0,
        showAddress ? 240 : 0,
        18, // like icon
        rightActionWidth > 0 ? rightActionWidth : 0, // video telematics icons
      ].filter((value) => value > 0);

      const columnsWidth = columns.reduce((sum, value) => sum + value, 0);
      const gapWidth = Math.max(0, columns.length - 1) * 6;
      const rowPadding = 12;
      const framePadding = 24;
      const calculatedWidth = columnsWidth + gapWidth + rowPadding + framePadding;

      const viewportWidth =
        typeof window !== 'undefined' ? window.innerWidth : 1600;
      const rightSettingsOffset = isSettingsOpen ? 218 : 0;
      const availableWidth = Math.max(520, viewportWidth - 70 - rightSettingsOffset - 60);
      const maxWidth = Math.min(700, availableWidth);
      return clamp(calculatedWidth, 520, maxWidth);
    };

    const applyWidth = () => {
      onPanelWidthChange(getTargetWidth());
    };

    applyWidth();
    window.addEventListener('resize', applyWidth);
    return () => window.removeEventListener('resize', applyWidth);
  }, [
    onPanelWidthChange,
    isSettingsOpen,
    showObjectNumber,
    showObjectName,
    showLastUpdated,
    showMode,
    showIgnition,
    showPower,
    showGsm,
    showGps,
    showExternalVoltage,
    showAddress,
    rightActionWidth,
  ]);

  const toggleObjectNameField = (field) => {
    setObjectNameFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleGroup = (groupTitle) => {
    setColumnGroups((prev) =>
      prev.map((group) => {
        if (group.title !== groupTitle) return group;
        const nextChecked = !group.checked;
        return {
          ...group,
          checked: nextChecked,
          items: group.items.map((item) => ({ ...item, checked: nextChecked })),
        };
      })
    );
  };

  const toggleGroupItem = (groupTitle, itemLabel) => {
    setColumnGroups((prev) =>
      prev.map((group) => {
        if (group.title !== groupTitle) return group;
        const nextItems = group.items.map((item) =>
          item.label === itemLabel ? { ...item, checked: !item.checked } : item
        );
        return {
          ...group,
          items: nextItems,
          checked: nextItems.every((item) => item.checked),
        };
      })
    );
  };

  const toggleSettings = () => {
    if (onSettingsToggle) {
      onSettingsToggle(!isSettingsOpen);
      return;
    }
    setInternalSettingsOpen((prev) => !prev);
  };

  const filteredVehicleRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let rows = vehicleRows.filter((row) => companySelection[row.company]);

    if (activeStatusFilter !== 'total') {
      rows = rows.filter((row) => row.status === activeStatusFilter);
    }

    if (normalizedSearch) {
      rows = rows.filter((row) =>
        `${row.id} ${row.address} ${row.distance}`.toLowerCase().includes(normalizedSearch)
      );
    }

    rows = [...rows].sort((a, b) => {
      const aNum = Number(a.id.replace(/\D/g, ''));
      const bNum = Number(b.id.replace(/\D/g, ''));
      return sortAscending ? aNum - bNum : bNum - aNum;
    });

    return rows;
  }, [activeStatusFilter, companySelection, searchTerm, sortAscending]);

  const filteredIds = filteredVehicleRows.map((row) => row.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedVehicleIds.has(id));

  const toggleVehicleSelection = (vehicleId) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  };

  const toggleSelectAllFiltered = (checked) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

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
        <button
          type="button"
          className={styles.settingsToggle}
          aria-label="Open object list settings"
          title="Object List Settings"
          onClick={toggleSettings}
        >
          <FaCog size={14} />
        </button>
      </div>

      <div className={styles.statusBar}>
        {statusCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`${styles.statusCard} ${styles.statusCardButton} ${styles[card.className]} ${
              activeStatusFilter === card.id ? styles.statusCardActive : ''
            }`}
            onClick={() => setActiveStatusFilter(card.id)}
          >
            <span className={styles.statusValue}>{String(statusCounts[card.id]).padStart(2, '0')}</span>
            <span className={styles.statusLabel}>{card.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.searchRow}>
        <label className={styles.iconCheck}>
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={(event) => toggleSelectAllFiltered(event.target.checked)}
          />
        </label>
        <div className={styles.searchWrap}>
          <FaSearch size={12} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by IMEI, Registration, Object Model, SIM Number, etc."
          />
        </div>
        <button type="button" className={styles.iconBtn} aria-label="Search">
          <FaSearch />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Refresh"
          onClick={() => {
            setSearchTerm('');
            setActiveStatusFilter('total');
            setCompanySelection({ indus: true, engro: true });
          }}
        >
          <FaSyncAlt />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Filter">
          <FaFilter />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Sort"
          onClick={() => setSortAscending((prev) => !prev)}
        >
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
        <span className={styles.companyMeta}>[ {companyRows.indus.length} ]</span>
        <button type="button" className={styles.companyCollapse} aria-label="Collapse company row">
          <FaMinus />
        </button>
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
        <span className={styles.companyMeta}>[ {companyRows.engro.length} ]</span>
        <button type="button" className={styles.companyCollapse} aria-label="Collapse company row">
          <FaMinus />
        </button>
      </div>

      <div className={styles.tableWrap}>
        {activeTab === 'vehical' &&
          filteredVehicleRows.map((row) => (
            <div
              key={row.id}
              className={`${styles.dataRow} ${styles.vehicleRow}`}
              style={{ gridTemplateColumns: vehicleGridTemplate }}
            >
              <label className={styles.rowTick}>
                <input
                  type="checkbox"
                  checked={selectedVehicleIds.has(row.id)}
                  onChange={() => toggleVehicleSelection(row.id)}
                />
              </label>
              <span
                className={`${styles.dot} ${
                  row.status === 'stopped'
                    ? styles.dotStop
                    : row.status === 'running'
                    ? styles.dotRun
                    : styles.dotIdle
                }`}
              />
              {(showObjectNumber || showObjectName || showLastUpdated) && (
                <div className={styles.leftBlock}>
                  {showObjectNumber ? <strong>{row.id}</strong> : null}
                  {showObjectName ? <small>{`Object ${row.id}`}</small> : null}
                  {showLastUpdated ? <small>{row.time}</small> : null}
                </div>
              )}
              {showMode ? <span className={styles.metricCell}>{row.speed}</span> : null}
              {showIgnition ? (
                <FaWrench
                  className={`${styles.metricIcon} ${
                    row.status === 'stopped' ? styles.iconDanger : styles.iconOk
                  }`}
                />
              ) : null}
              {showPower ? <FaBatteryHalf className={`${styles.metricIcon} ${styles.iconOk}`} /> : null}
              {showGsm ? <FaSignal className={`${styles.metricIcon} ${styles.iconWarn}`} /> : null}
              {showGps ? <FaWifi className={`${styles.metricIcon} ${styles.iconOk}`} /> : null}
              {showExternalVoltage ? <span className={styles.voltageCell}>{row.voltage}</span> : null}
              {showAddress ? (
                <div className={styles.middleBlock}>
                  <span>{row.address}</span>
                  <span>{row.distance}</span>
                </div>
              ) : null}
              <div className={styles.endIcons}>
                <FaThumbsUp />
              </div>
              {rightActionCount > 0 ? (
                <div className={styles.rightIcons}>
                  {showLiveStreaming ? <FaVideo /> : null}
                  {showSnapshot ? <FaCamera /> : null}
                  {showVideoPlayback ? <FaPlayCircle /> : null}
                  {showIntercomMic ? <FaLock /> : null}
                </div>
              ) : null}
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

      <aside className={`${styles.settingsDrawer} ${isSettingsOpen ? styles.settingsDrawerOpen : ''}`}>
        <div className={styles.settingsDrawerHead}>
          <strong>Object List</strong>
        </div>
        <div className={styles.settingsDrawerBody}>
          <div className={styles.settingsSearchWrap}>
            <FaSearch size={12} />
            <input type="text" placeholder="Search" />
            <FaSyncAlt size={11} />
          </div>
          <p className={styles.settingsHint}>*If no space available, remove some widgets to add new ones.</p>

          <h5 className={styles.settingsSectionTitle}>Object Name</h5>
          <div className={styles.settingsSimpleCard}>
            <label className={styles.settingsCheckRow}>
              <input
                type="checkbox"
                checked={objectNameFields.objectNumber}
                onChange={() => toggleObjectNameField('objectNumber')}
              />
              <span className={styles.settingsText}>Object Number</span>
            </label>
            <label className={styles.settingsCheckRow}>
              <input
                type="checkbox"
                checked={objectNameFields.objectName}
                onChange={() => toggleObjectNameField('objectName')}
              />
              <span className={styles.settingsText}>Object Name</span>
            </label>
          </div>

          <h5 className={styles.settingsSectionTitle}>Choose Columns</h5>
          <div className={styles.settingsColumnsWrap}>
            {objectListColumnGroups.map((group) => (
              <section key={group.title} className={styles.settingsGroup}>
                <header>
                  <label className={styles.settingsCheckRow}>
                    <input
                      type="checkbox"
                      checked={!!columnGroups.find((g) => g.title === group.title)?.checked}
                      onChange={() => toggleGroup(group.title)}
                    />
                    <span className={styles.settingsText}>{group.title}</span>
                  </label>
                  <button type="button" className={styles.settingsDragBtn} aria-label={`Move ${group.title}`}>
                    <FaGripVertical />
                  </button>
                </header>
                <div className={styles.settingsItems}>
                  {(columnGroups.find((g) => g.title === group.title)?.items || []).map((item) => (
                    <div key={`${group.title}-${item.label}`} className={styles.settingsItemRow}>
                      <label className={styles.settingsCheckRow}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleGroupItem(group.title, item.label)}
                        />
                        <span className={styles.settingsText} title={item.label}>
                          {item.label}
                        </span>
                      </label>
                      {item.hasOptions ? (
                        <button type="button" className={styles.settingsItemAction} aria-label={`${item.label} options`}>
                          <FaSlidersH />
                        </button>
                      ) : (
                        <span className={styles.settingsItemActionSpacer} aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <div className={styles.settingsDrawerFooter}>
          <button type="button" onClick={() => (onSettingsToggle ? onSettingsToggle(false) : setInternalSettingsOpen(false))}>Save</button>
          <button type="button" onClick={() => (onSettingsToggle ? onSettingsToggle(false) : setInternalSettingsOpen(false))}>Cancel</button>
        </div>
      </aside>
    </div>
  );
};

export default Panels;
