import React, { useCallback, useMemo } from 'react';
import styles from './MapControls.module.css';
import {
  FaAngleDoubleLeft, FaAngleDoubleRight, FaMapMarkerAlt, FaStar, FaMap, FaTrafficLight,
  FaLocationArrow, FaCrosshairs, FaTag, FaArrowsAltV, FaPlus, FaMinus, FaRedoAlt, FaExchangeAlt
} from 'react-icons/fa';

const mainControlsConfig = [
  { id: 'toggleSidebar', icon: FaAngleDoubleRight, label: 'Toggle Info Panel' },
  { id: 'locate',        icon: FaMapMarkerAlt,    label: 'Locate Me' },
  { id: 'favorites',     icon: FaStar,            label: 'Favorites' },
  { id: 'layers',        icon: FaMap,             label: 'Layers' },
  { id: 'traffic',       icon: FaTrafficLight,    label: 'Traffic' },
  { id: 'send',          icon: FaLocationArrow,   label: 'Toggle Vehicles / Navigate' },
  { id: 'gps',           icon: FaCrosshairs,      label: 'Center on GPS' },
  { id: 'measure',       icon: FaArrowsAltV,      label: 'Measurement Units' },
  { id: 'labels',        icon: FaTag,             label: 'Toggle Labels' },
  { id: 'refresh',       icon: FaRedoAlt,         label: 'Refresh / Reset View' },
  { id: 'swap',          icon: FaExchangeAlt,     label: 'Swap / Compare View' },
];

const PANEL_WIDTH = 262;

const MapControls = React.memo(({ onControlClick, onZoomIn, onZoomOut, isPanelOpen = false }) => {
  const controls = useMemo(
    () => (isPanelOpen ? mainControlsConfig.filter((control) => control.id !== 'toggleSidebar') : mainControlsConfig),
    [isPanelOpen]
  );

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
      {isPanelOpen && (
        <button
          className={styles.panelHandleButton}
          style={{ '--telemetry-panel-width': `${PANEL_WIDTH}px` }}
          onClick={() => handleMainClick('toggleSidebar')}
          title="Close Info Panel"
          aria-label="Close Info Panel"
          tabIndex={0}
        >
          <FaAngleDoubleRight size={24} />
        </button>
      )}

      <div
        className={`${styles.mainControlsContainer} ${isPanelOpen ? styles.panelOpen : ''}`}
        style={{ '--telemetry-panel-width': `${PANEL_WIDTH}px` }}
      >
        {controls.map((control) => {
          const IconComponent = control.id === 'toggleSidebar' ? FaAngleDoubleLeft : control.icon;
          return (
            <button
              key={control.id}
              className={styles.mainControlButton}
              onClick={() => handleMainClick(control.id)}
              title={control.label}
              aria-label={control.label}
              tabIndex={0}
            >
              <IconComponent size={18} />
            </button>
          );
        })}
      </div>
      <div
        className={`${styles.zoomControlsContainer} ${isPanelOpen ? styles.panelOpen : ''}`}
        style={{ '--telemetry-panel-width': `${PANEL_WIDTH}px` }}
      >
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

MapControls.displayName = "MapControls";

export default MapControls;
