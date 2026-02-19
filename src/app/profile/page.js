"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import styles from "./profile.module.css";

const STORAGE_KEY = "vtp_profile_data_v1";

const DEFAULT_PROFILE = {
  name: "Majeed Abro",
  email: "Majeed@example.com",
  phone: "0313-2258597",
  cnic: "35202-XXXXXXX-X",
  company: "Visual Telematics Platform",
  fleetSize: "120 Vehicles",
  city: "Karachi",
  role: "Admin",
  jobTitle: "Fleet Manager",
  language: "English",
  timezone: "GMT+5 (PKT)",
  units: "KM / KMH",
  twoFactorEnabled: true,
  photoDataUrl: "",
};

const emitProfileUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vtp-profile-updated"));
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_PROFILE, ...parsed };
      setProfile(merged);
      setDraft(merged);
    } catch {
      // Ignore invalid stored profile.
    }
  }, []);

  const initials = useMemo(() => {
    const parts = String(profile.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "VT";
    return parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }, [profile.name]);

  const handleFieldChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleTwoFactorToggle = (checked) => {
    if (isEditing) {
      setDraft((prev) => ({ ...prev, twoFactorEnabled: checked }));
      return;
    }
    const updated = { ...profile, twoFactorEnabled: checked };
    setProfile(updated);
    setDraft(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      emitProfileUpdated();
    } catch {}
  };

  const handleStartEdit = () => {
    setDraft(profile);
    setIsEditing(true);
    setStatusMessage("");
  };

  const handleCancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
    setShowPasswordForm(false);
    setPasswordError("");
    setStatusMessage("Changes discarded.");
  };

  const handleSave = () => {
    setProfile(draft);
    setIsEditing(false);
    setShowPasswordForm(false);
    setPasswordError("");
    setStatusMessage("Profile updated successfully.");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      emitProfileUpdated();
    } catch {
      setStatusMessage("Profile updated, but local save failed.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.setItem("isLoggedIn", "false");
    } catch {}
    window.location.href = "/login";
  };

  const handlePasswordSubmit = () => {
    const newPass = passwordForm.newPassword.trim();
    const confirmPass = passwordForm.confirmPassword.trim();

    if (!newPass || newPass.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordError("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordForm(false);
    setStatusMessage("Password changed successfully.");
  };

  const handlePhotoPick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage("Image size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setDraft((prev) => ({ ...prev, photoDataUrl: result }));
      if (!isEditing) {
        const updated = { ...profile, photoDataUrl: result };
        setProfile(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          emitProfileUpdated();
        } catch {}
      }
      setStatusMessage("Profile photo updated.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    setDraft((prev) => ({ ...prev, photoDataUrl: "" }));
    if (!isEditing) {
      const updated = { ...profile, photoDataUrl: "" };
      setProfile(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        emitProfileUpdated();
      } catch {}
    }
    setStatusMessage("Profile photo removed.");
  };

  const activeData = isEditing ? draft : profile;

  return (
    <>
      <Sidebar isOpen={true} />
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <Link href="/" className={styles.backBtn} aria-label="Back to Home">
            Back to Home
          </Link>

          <div className={styles.avatarWrap}>
            {activeData.photoDataUrl ? (
              <img src={activeData.photoDataUrl} alt="Profile" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </button>
              <button
                type="button"
                className={styles.avatarBtnGhost}
                onClick={handleRemovePhoto}
                disabled={!activeData.photoDataUrl}
              >
                Remove
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handlePhotoPick}
              />
            </div>
          </div>

          <div className={styles.heroInfo}>
            <h1>{activeData.name}</h1>
            <p className={styles.role}>{activeData.jobTitle}</p>
            <div className={styles.company}>{activeData.company}</div>
            {statusMessage ? <p className={styles.status}>{statusMessage}</p> : null}
          </div>

          <div className={styles.heroActions}>
            {isEditing ? (
              <>
                <button className={styles.primary} type="button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className={styles.ghost} type="button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <button className={styles.primary} type="button" onClick={handleStartEdit}>
                Edit Profile
              </button>
            )}
            <button className={styles.ghost} type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Personal Info</h2>
            <div className={styles.row}>
              <span>Name</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              ) : (
                <strong>{profile.name}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Email</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                />
              ) : (
                <strong>{profile.email}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Phone</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                />
              ) : (
                <strong>{profile.phone}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>CNIC</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.cnic}
                  onChange={(e) => handleFieldChange("cnic", e.target.value)}
                />
              ) : (
                <strong>{profile.cnic}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Job Title</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.jobTitle}
                  onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                />
              ) : (
                <strong>{profile.jobTitle}</strong>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Company Info</h2>
            <div className={styles.row}>
              <span>Company</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.company}
                  onChange={(e) => handleFieldChange("company", e.target.value)}
                />
              ) : (
                <strong>{profile.company}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Fleet Size</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.fleetSize}
                  onChange={(e) => handleFieldChange("fleetSize", e.target.value)}
                />
              ) : (
                <strong>{profile.fleetSize}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>City</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                />
              ) : (
                <strong>{profile.city}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Role</span>
              {isEditing ? (
                <input
                  className={styles.fieldInput}
                  value={draft.role}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
                />
              ) : (
                <strong>{profile.role}</strong>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Security</h2>
            <div className={styles.row}>
              <span>Password</span>
              <button
                className={styles.linkBtn}
                type="button"
                onClick={() => setShowPasswordForm((prev) => !prev)}
              >
                {showPasswordForm ? "Close" : "Change Password"}
              </button>
            </div>
            {showPasswordForm && (
              <div className={styles.passwordBox}>
                <input
                  type="password"
                  placeholder="Current password"
                  className={styles.fieldInput}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  placeholder="New password"
                  className={styles.fieldInput}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className={styles.fieldInput}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
                {passwordError ? <p className={styles.error}>{passwordError}</p> : null}
                <button type="button" className={styles.primaryMini} onClick={handlePasswordSubmit}>
                  Update Password
                </button>
              </div>
            )}
            <div className={styles.row}>
              <span>Two-Factor Auth</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={activeData.twoFactorEnabled}
                  onChange={(e) => handleTwoFactorToggle(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Preferences</h2>
            <div className={styles.row}>
              <span>Language</span>
              {isEditing ? (
                <select
                  className={styles.fieldInput}
                  value={draft.language}
                  onChange={(e) => handleFieldChange("language", e.target.value)}
                >
                  <option>English</option>
                  <option>Urdu</option>
                </select>
              ) : (
                <strong>{profile.language}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Timezone</span>
              {isEditing ? (
                <select
                  className={styles.fieldInput}
                  value={draft.timezone}
                  onChange={(e) => handleFieldChange("timezone", e.target.value)}
                >
                  <option>GMT+5 (PKT)</option>
                  <option>GMT+4</option>
                  <option>GMT+6</option>
                </select>
              ) : (
                <strong>{profile.timezone}</strong>
              )}
            </div>
            <div className={styles.row}>
              <span>Units</span>
              {isEditing ? (
                <select
                  className={styles.fieldInput}
                  value={draft.units}
                  onChange={(e) => handleFieldChange("units", e.target.value)}
                >
                  <option>KM / KMH</option>
                  <option>MI / MPH</option>
                </select>
              ) : (
                <strong>{profile.units}</strong>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.readOnlyCard}`}>
            <h2>Notifications</h2>
            <p className={styles.readOnlyNote}>Read-only for now</p>
            <div className={styles.row}>
              <span>Email</span>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked disabled />
                <span className={styles.slider} />
              </label>
            </div>
            <div className={styles.row}>
              <span>SMS</span>
              <label className={styles.toggle}>
                <input type="checkbox" disabled />
                <span className={styles.slider} />
              </label>
            </div>
            <div className={styles.row}>
              <span>WhatsApp</span>
              <label className={styles.toggle}>
                <input type="checkbox" disabled />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          <div className={`${styles.card} ${styles.readOnlyCard}`}>
            <h2>Activity Log</h2>
            <p className={styles.readOnlyNote}>Read-only for now</p>
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
              <strong>Chrome - Windows</strong>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
