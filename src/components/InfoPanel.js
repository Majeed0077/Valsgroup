// src/components/InfoPanel.js
'use client';

import React from 'react';
import Image from 'next/image';
import styles from './InfoPanel.module.css'; 
import {
  FaTimes, FaMapMarkerAlt, FaRoute, FaTachometerAlt, FaInfoCircle,
  FaEye, FaShareAlt, FaPaperPlane, FaMapPin, FaThumbsUp,
  FaRegClock, FaUndoAlt, FaCog, FaCopy, FaCar, FaTruck, FaMotorcycle,
  FaShuttleVan, // For Vans, Tempos
  FaBusAlt,     // For Buses
  FaQuestionCircle // For Default/Other
} from 'react-icons/fa';

// The InfoPanel Component
const InfoPanel = ({ isVisible, onClose, data }) => {

    const currentData = data || {}; 

    const copyToClipboard = (text, type) => {
        if (!text || text === "N/A") {
            console.warn(`Attempted to copy empty or N/A ${type}`);
            return;
        }
        if (!navigator.clipboard) {
            console.error('Clipboard API not available.');
            alert('Clipboard access not available.');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            console.log(`${type} copied: ${text}`);
        }).catch(err => {
            console.error(`Failed to copy ${type}: `, err);
            alert(`Failed to copy ${type}.`);
        });
    };

    if (!isVisible || !data) {
        return null;
    }

    const getStatusClass = (status) => {
        const statusKey = status?.trim().toLowerCase() || 'inactive';
        return styles[statusKey] || styles.inactive;
    };

    const handleGenericAction = (actionName) => {
        alert(`Action: ${actionName} for ${currentData.plate || 'vehicle'}`);
    };
    
    const vehicleIcon = () => {
        const typeLower = currentData.vehicleType?.toLowerCase() || '';
        if (typeLower.includes('truck')) return <FaTruck className={styles.vehicleTypeIcon} />;
        if (typeLower.includes('bike') || typeLower.includes('motorcycle')) return <FaMotorcycle className={styles.vehicleTypeIcon} />;
        if (typeLower.includes('car') || typeLower.includes('suv') || typeLower.includes('muv')) return <FaCar className={styles.vehicleTypeIcon} />;
        if (typeLower.includes('van') || typeLower.includes('tempo') || typeLower.includes('campervan')) return <FaShuttleVan className={styles.vehicleTypeIcon} />;
        if (typeLower.includes('bus')) return <FaBusAlt className={styles.vehicleTypeIcon} />;
        if (typeLower.includes('default')) return <FaQuestionCircle className={styles.vehicleTypeIcon} />;
        return <FaCar className={styles.vehicleTypeIcon} />; // Fallback generic icon
    };

    return (
        <div className={`${styles.panelContainer} ${isVisible ? styles.visible : ''}`}>
            <div className={styles.panelHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.headerButton} title="Vehicle Actions" onClick={() => handleGenericAction('Vehicle Actions')}><FaRoute /></button>
                    <button className={styles.headerButton} title="Geofence Info" onClick={() => handleGenericAction('Geofence Info')}><FaMapPin /></button>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.headerButton} title="Settings" onClick={() => handleGenericAction('Settings')}><FaCog /></button>
                    <button className={styles.headerButtonClose} onClick={onClose} title="Close Panel"><FaTimes /></button>
                </div>
            </div>

            <div className={styles.panelContent}>
                <div className={styles.vehicleInfo}>
                    <div className={styles.vehicleDetails}>
                        <div className={styles.vehicleType}>
                            {vehicleIcon()} {currentData.vehicleType || 'N/A'}
                        </div>
                        <div className={styles.plateContainer}>
                            <span className={styles.plateNumber}>{currentData.plate || 'N/A'}</span>
                            <span className={`${styles.status} ${getStatusClass(currentData.status)}`}>
                                {currentData.status || 'N/A'}
                            </span>
                        </div>
                        <div className={styles.tripInfo}>Current Trip: <span className={styles.tripValue}>{currentData.tripDistance || '0.00'} km</span></div>
                        <div className={styles.odometer}>
                            {(currentData.odometer || '0000000').toString().split('').map((digit, index) => (
                                <span key={index} className={styles.odoDigit}>{digit}</span>
                            ))}
                        </div>
                        <div className={styles.driverInfo}>
                            <div>Driver: <span className={styles.driverValue}>{currentData.driver || 'N/A'}</span></div>
                            <div>Mobile: <span className={styles.driverValue}>{currentData.mobile || 'N/A'}</span></div>
                        </div>
                         <div className={styles.detailsLink} onClick={() => handleGenericAction('View Full Details')}>
                            Details <FaInfoCircle size={12} style={{marginLeft: '4px'}}/>
                        </div>
                    </div>
                    <div className={styles.vehicleImageContainer}>
                        <Image
                            src={currentData.vehicleImage || '/icons/placeholder-suv.png'}
                            alt={currentData.vehicleType || 'Vehicle'}
                            width={130} height={80}
                            className={styles.vehicleImage}
                            priority
                            onError={(e) => { e.target.onerror = null; e.target.src = '/icons/placeholder-suv.png'; }}
                        />
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    <button className={styles.actionButton} title="View Details" onClick={() => handleGenericAction('View Details')}><FaEye /></button>
                    <button className={styles.actionButton} title="Share Location" onClick={() => handleGenericAction('Share Location')}><FaShareAlt /></button>
                    <button className={styles.actionButton} title="Send Command" onClick={() => handleGenericAction('Send Command')}><FaPaperPlane /></button>
                    <button className={styles.actionButton} title="View on Map" onClick={() => handleGenericAction('View on Map')}><FaMapMarkerAlt /></button>
                    <button className={styles.actionButton} title="Favorite" onClick={() => handleGenericAction('Favorite')}><FaThumbsUp /></button>
                </div>

                <div className={styles.locationSection}>
                    <div className={styles.locationItem}>
                        <FaMapMarkerAlt className={styles.locationIcon} />
                        <div className={styles.locationText}>
                            <span className={styles.locationLabel}>Coordinates</span>
                            <span className={styles.locationCoords}>{currentData.location || 'N/A'}</span>
                        </div>
                        <button className={styles.copyButton} onClick={() => copyToClipboard(currentData.location, 'Coordinates')} title="Copy Coordinates" disabled={!currentData.location || currentData.location === 'N/A'}>
                            <FaCopy size={12}/>
                        </button>
                    </div>
                    <div className={styles.locationItem}>
                        <FaMapPin className={styles.locationIcon} /> 
                        <div className={styles.locationText}>
                            <span className={styles.locationLabel}>Address</span>
                            <span className={styles.locationDescription}>{currentData.address || 'N/A'}</span>
                        </div>
                        <button className={styles.copyButton} onClick={() => copyToClipboard(currentData.address, 'Address')} title="Copy Address" disabled={!currentData.address || currentData.address === 'N/A'}>
                            <FaCopy size={12}/>
                        </button>
                    </div>
                     <div className={styles.locationItem}>
                        <FaMapPin className={styles.locationIcon} />
                        <div className={styles.locationText}>
                            <span className={styles.locationLabel}>Geofence</span>
                            <span className={styles.locationCoords}>{currentData.geofence || "N/A"}</span>
                        </div>
                         <button
                            className={styles.copyButton}
                            disabled={!currentData.geofence || currentData.geofence === "N/A"}
                            onClick={() => copyToClipboard(currentData.geofence, 'Geofence')}
                            title={currentData.geofence && currentData.geofence !== "N/A" ? "Copy Geofence" : "No Geofence Data"}>
                                 <FaCopy size={12}/>
                         </button>
                    </div>
                     <div className={styles.locationActions}>
                         <button className={styles.locationActionButton} title="Navigate Here" onClick={() => handleGenericAction('Navigate Here')}><FaRoute /></button>
                         <button className={styles.locationActionButton} title="Set Geofence" onClick={() => handleGenericAction('Set Geofence')}><FaMapPin /></button>
                         <button className={styles.locationActionButton} title="Street View" onClick={() => handleGenericAction('Street View')}><FaEye /></button>
                     </div>
                </div>

                <div className={styles.activitySection}>
                    <div className={styles.activityHeader}>
                        <FaRegClock className={styles.sectionIcon} /> Today Activity
                        <button className={styles.refreshButton} onClick={() => handleGenericAction('Refresh Activity')} title="Refresh Activity"><FaUndoAlt /></button>
                    </div>
                    <div className={styles.activityBody}>
                        <div className={styles.activityChart}><div className={styles.chartPlaceholder}>Activity Chart Area</div></div>
                        <div className={styles.activityLegend}>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.running}`}></span> Running <span className={styles.time}>{currentData.runningTime || 'N/A'}</span></div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.idle}`}></span> Idle <span className={styles.time}>{currentData.idleTime || 'N/A'}</span></div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.stop}`}></span> Stop <span className={styles.time}>{currentData.stopTime || 'N/A'}</span></div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.inactive}`}></span> Inactive <span className={styles.time}>{currentData.inactiveTime || 'N/A'}</span></div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.work}`}></span> Work Hour <span className={styles.time}>{currentData.workHour || 'N/A'}</span></div>
                        </div>
                    </div>
                    <button className={styles.showLogButton} onClick={() => handleGenericAction('Show Log')}>Show Log</button>
                </div>

                 <div className={styles.speedSection}>
                     <div className={styles.activityHeader}>
                        <FaTachometerAlt className={styles.sectionIcon} /> Speed
                        <button className={styles.refreshButton} onClick={() => handleGenericAction('Refresh Speed')} title="Refresh Speed"><FaUndoAlt /></button>
                    </div>
                    <div className={styles.speedDetails}>
                        <div>Current Speed: <span className={styles.speedValue}>{currentData.currentSpeed || 'N/A'} km/h</span></div>
                        <div>Average Speed: <span className={styles.speedValue}>{currentData.averageSpeed || 'N/A'} km/h</span></div>
                        <div>Maximum Speed: <span className={styles.speedValue}>{currentData.maxSpeed || 'N/A'} km/h</span></div>
                        <div>Speed Limit: <span className={styles.speedValue}>{currentData.speedLimit || 'N/A'} km/h</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;