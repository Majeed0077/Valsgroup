"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./profile.module.css";

export default function ProfilePage() {
  return (
    <>
      <Sidebar isOpen={true} />
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Link href="/" className={styles.backBtn} aria-label="Back to Home">
            Back to Home
          </Link>
          <div className={styles.avatar}>MA</div>
          <div className={styles.heroInfo}>
            <h1>Majeed Abro</h1>
            <p className={styles.role}>Fleet Manager</p>
            <div className={styles.company}>Visual Telematics Platform</div>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.primary}>Edit Profile</button>
            <button className={styles.ghost}>Logout</button>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Personal Info</h2>
            <div className={styles.row}>
              <span>Name</span>
              <strong>Majeed Abro</strong>
            </div>
            <div className={styles.row}>
              <span>Email</span>
              <strong>Majeed@example.com</strong>
            </div>
            <div className={styles.row}>
              <span>Phone</span>
              <strong>0313-2258597</strong>
            </div>
            <div className={styles.row}>
              <span>CNIC</span>
              <strong>35202-XXXXXXX-X</strong>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Company Info</h2>
            <div className={styles.row}>
              <span>Company</span>
              <strong>Visual Telematics Platform</strong>
            </div>
            <div className={styles.row}>
              <span>Fleet Size</span>
              <strong>120 Vehicles</strong>
            </div>
            <div className={styles.row}>
              <span>City</span>
              <strong>Karachi</strong>
            </div>
            <div className={styles.row}>
              <span>Role</span>
              <strong>Admin</strong>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Security</h2>
            <div className={styles.row}>
              <span>Password</span>
              <button className={styles.linkBtn}>Change Password</button>
            </div>
            <div className={styles.row}>
              <span>Two‑Factor Auth</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Preferences</h2>
            <div className={styles.row}>
              <span>Language</span>
              <strong>English</strong>
            </div>
            <div className={styles.row}>
              <span>Timezone</span>
              <strong>GMT+5 (PKT)</strong>
            </div>
            <div className={styles.row}>
              <span>Units</span>
              <strong>KM / KMH</strong>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Notifications</h2>
            <div className={styles.row}>
              <span>Email</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider} />
              </label>
            </div>
            <div className={styles.row}>
              <span>SMS</span>
              <label className={styles.toggle}>
                <input type="checkbox" />
                <span className={styles.slider} />
              </label>
            </div>
            <div className={styles.row}>
              <span>WhatsApp</span>
              <label className={styles.toggle}>
                <input type="checkbox" />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Activity Log</h2>
            <div className={styles.logItem}>
              <span>Last Login</span>
              <strong>Today, 10:32 AM</strong>
            </div>
            <div className={styles.logItem}>
              <span>Last Password Change</span>
              <strong>3 days ago</strong>
            </div>
            <div className={styles.logItem}>
              <span>Last Device</span>
              <strong>Chrome · Windows</strong>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
