"use client";

import React from "react";
import styles from "./MapTypeSwitcher.module.css";

export default function MapTypeSwitcher({ isOpen, mapType, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Map type</div>
      <div className={styles.options}>
        <button
          type="button"
          className={`${styles.option} ${mapType === "default" ? styles.active : ""}`}
          onClick={() => onSelect?.("default")}
        >
          <span className={`${styles.thumb} ${styles.defaultThumb}`} />
          <span className={styles.label}>Default</span>
        </button>
        <button
          type="button"
          className={`${styles.option} ${mapType === "satellite" ? styles.active : ""}`}
          onClick={() => onSelect?.("satellite")}
        >
          <span className={`${styles.thumb} ${styles.satelliteThumb}`} />
          <span className={styles.label}>Satellite</span>
        </button>
      </div>
    </div>
  );
}
