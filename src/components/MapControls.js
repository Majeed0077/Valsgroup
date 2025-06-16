import React from 'react';
import styles from './MapControls.module.css'; // Ensure this path is correct and CSS exists

// Import necessary icons from react-icons
import {
  FaAngleDoubleLeft,  // For toggling the Info Panel
  FaMapMarkerAlt,     // For Locate Me
  FaStar,             // For Favorites
  FaMap,              // For Layers
  FaTrafficLight,     // For Traffic indicator/toggle
  FaLocationArrow,    // For Navigation or Vehicle toggle ('send' ID)
  FaCrosshairs,       // For Center on GPS
  FaTag,              // For Labels toggle ('labels' ID)
  FaArrowsAltV,       // For Measurement Units
  FaPlus,             // Zoom In
  FaMinus             // Zoom Out
} from 'react-icons/fa';

/**
 * Configuration array for the main vertical control buttons.
 */
const mainControlsConfig = [
  { id: 'toggleSidebar', icon: FaAngleDoubleLeft, label: 'Toggle Info Panel' },
  { id: 'locate',        icon: FaMapMarkerAlt,    label: 'Locate Me' },
  { id: 'favorites',     icon: FaStar,            label: 'Favorites' },
  { id: 'layers',        icon: FaMap,             label: 'Layers' },
  { id: 'traffic',       icon: FaTrafficLight,    label: 'Traffic' },
  { id: 'send',          icon: FaLocationArrow,   label: 'Toggle Vehicles / Navigate' },
  { id: 'gps',           icon: FaCrosshairs,      label: 'Center on GPS' },
  { id: 'measure',       icon: FaArrowsAltV,      label: 'Measurement Units' },
  { id: 'labels',        icon: FaTag,             label: 'Toggle Labels' },
];

/**
 * MapControls Component
 */
const MapControls = ({ onControlClick, onZoomIn, onZoomOut }) => {
  const handleMainClick = (id) => {
    if (onControlClick) {
      onControlClick(id);
    } else {
      console.warn(`MapControls: 'onControlClick' prop handler is missing. Click for ID '${id}' cannot be processed.`);
    }
  };

  const handleZoomInClick = () => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      console.warn(`MapControls: 'onZoomIn' prop handler is missing. Attempting fallback via onControlClick('zoomIn').`);
      handleMainClick('zoomIn');
    }
  };

  const handleZoomOutClick = () => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      console.warn(`MapControls: 'onZoomOut' prop handler is missing. Attempting fallback via onControlClick('zoomOut').`);
      handleMainClick('zoomOut');
    }
  };

  return (
    <>
      {/* Main Vertical Control Buttons */}
      <div className={styles.mainControlsContainer}>
        {mainControlsConfig.map(control => (
          <button
            key={control.id}
            className={styles.mainControlButton}
            onClick={() => handleMainClick(control.id)}
            title={control.label}
            aria-label={control.label}
          >
            <control.icon size={18} />
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className={styles.zoomControlsContainer}>
        <button
          className={`${styles.zoomButton} ${styles.zoomButtonIn}`}
          onClick={handleZoomInClick}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <FaPlus size={16} />
        </button>
        <button
          className={`${styles.zoomButton} ${styles.zoomButtonOut}`}
          onClick={handleZoomOutClick}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <FaMinus size={16} />
        </button>
      </div>
    </>
  );
};

export default MapControls;
