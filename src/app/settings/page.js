"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Link from "next/link";
import styles from "./settings.module.css";

export default function SettingsPage() {
  return (
    <>
      <Sidebar isOpen={true} />
      <Header />
      <main className={styles.page}>
        <Link href="/" className={styles.backBtn} aria-label="Back to Home">
          Back to Home
        </Link>
        <section className={styles.card}>
          <h1>Settings</h1>
          <div className={styles.row}>
            <span>Notifications</span>
            <button className={styles.linkBtn}>Manage</button>
          </div>
          <div className={styles.row}>
            <span>Security</span>
            <button className={styles.linkBtn}>Change Password</button>
          </div>
          <div className={styles.row}>
            <span>Language</span>
            <strong>English</strong>
          </div>
          <div className={styles.row}>
            <span>Timezone</span>
            <strong>GMT+5 (PKT)</strong>
          </div>
        </section>
      </main>
    </>
  );
}

