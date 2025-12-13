import React, { useCallback, useMemo } from 'react';
import styles from './MapControls.module.css';
import {
  FaAngleDoubleLeft, FaMapMarkerAlt, FaStar, FaMap, FaTrafficLight,
  FaLocationArrow, FaCrosshairs, FaTag, FaArrowsAltV, FaPlus, FaMinus
} from 'react-icons/fa';

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

const MapControls = React.memo(({ onControlClick, onZoomIn, onZoomOut }) => {
  const controls = useMemo(() => mainControlsConfig, []);

  const handleMainClick = useCallback((id) => {
    if (onControlClick) {
      onControlClick(id);
    }
  }, [onControlClick]);

  const handleZoomInClick = useCallback(() => {
    if (onZoomIn) {
      onZoomIn();
    } else {
      handleMainClick('zoomIn');
    }
  }, [onZoomIn, handleMainClick]);

  const handleZoomOutClick = useCallback(() => {
    if (onZoomOut) {
      onZoomOut();
    } else {
      handleMainClick('zoomOut');
    }
  }, [onZoomOut, handleMainClick]);

  return (
    <>
      <div className={styles.mainControlsContainer}>
        {controls.map(control => (
          <button
            key={control.id}
            className={styles.mainControlButton}
            onClick={() => handleMainClick(control.id)}
            title={control.label}
            aria-label={control.label}
            tabIndex={0}
          >
            <control.icon size={18} />
          </button>
        ))}
      </div>
      <div className={styles.zoomControlsContainer}>
        <button
          className={`${styles.zoomButton} ${styles.zoomButtonIn}`}
          onClick={handleZoomInClick}
          title="Zoom In"
          aria-label="Zoom In"
          tabIndex={0}
        >
          <FaPlus size={16} />
        </button>
        <button
          className={`${styles.zoomButton} ${styles.zoomButtonOut}`}
          onClick={handleZoomOutClick}
          title="Zoom Out"
          aria-label="Zoom Out"
          tabIndex={0}
        >
          <FaMinus size={16} />
        </button>
      </div>
    </>
  );
});

export default MapControls;