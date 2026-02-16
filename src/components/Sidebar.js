"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBell,
  FaCar,
  FaCommentDots,
  FaChevronRight,
  FaClipboardList,
  FaDollarSign,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaGasPump,
  FaListAlt,
  FaMapMarkerAlt,
  FaRegDotCircle,
  FaRegClock,
  FaRoad,
  FaSatellite,
  FaShoppingBag,
  FaThermometerHalf,
  FaTachometerAlt,
  FaTools,
  FaLock,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import Panels from "./Panels";

import logo from "../../public/icons/logo.png";
import dashboard from "../../public/icons/Group-3.png";
import tracking from "../../public/icons/Group-2.png";
import report from "../../public/icons/Vector-1.png";
import chart from "../../public/icons/Group.png";
import complain from "../../public/icons/complain.png";
import setting from "../../public/icons/Group-1.png";
import toggleIcon from "../../public/icons/Vector.png";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: dashboard },
  { id: "tracking", label: "Tracking", icon: tracking },
  { id: "report", label: "Report", icon: report },
  { id: "chart", label: "Chart", icon: chart },
  { id: "complain", label: "Complaint", icon: complain },
  { id: "setting", label: "Setting", icon: setting },
];

const routeMap = {
  dashboard: "/dashboard",
  tracking: "/tracking",
  report: "#",
  chart: "#",
  setting: "#",
  complain: "#",
};

const pathToItem = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/tracking": "tracking",
  "/report": "report",
  "/chart": "chart",
  "/setting": "setting",
  "/complain": "complain",
};

const reportMenuItems = [
  { label: "Activity", Icon: FaRegDotCircle },
  { label: "Geofence-Address", Icon: FaMapMarkerAlt },
  { label: "Sensor", Icon: FaSatellite },
  { label: "Alert", Icon: FaExclamationTriangle },
  { label: "Reminder", Icon: FaBell },
  { label: "Expense", Icon: FaDollarSign },
  { label: "Fuel", Icon: FaGasPump },
  { label: "RPM", Icon: FaTachometerAlt },
  { label: "Temperature", Icon: FaThermometerHalf },
  { label: "Job", Icon: FaShoppingBag },
  { label: "E-lock", Icon: FaLock },
  { label: "Tire", Icon: FaRegDotCircle },
  { label: "Driver Behavior", Icon: FaRoad },
  { label: "OBD", Icon: FaCar },
  { label: "Trip Classification", Icon: FaListAlt },
  { label: "Billing", Icon: FaFileInvoiceDollar },
  { label: "Logs", Icon: FaClipboardList },
];

const chartMenuItems = [
  { label: "Activity", Icon: FaRegDotCircle },
  { label: "Alert", Icon: FaExclamationTriangle },
  { label: "Fuel", Icon: FaGasPump },
  { label: "Expense", Icon: FaDollarSign },
  { label: "Tire", Icon: FaRegDotCircle },
  { label: "Temperature", Icon: FaThermometerHalf },
];

const settingMenuItems = [
  { label: "General", Icon: FaTools },
  { label: "Master", Icon: FaRegDotCircle },
  { label: "Tire", Icon: FaRegDotCircle },
];

const complaintMenuItems = [
  { label: "New Complaint", Icon: FaCommentDots },
  { label: "Open Tickets", Icon: FaRegClock },
  { label: "In Progress", Icon: FaTools },
  { label: "Resolved", Icon: FaRegDotCircle },
  { label: "Escalated", Icon: FaExclamationTriangle },
  { label: "Complaint Logs", Icon: FaClipboardList },
];

const Sidebar = ({
  isOpen = true,
  toggleSidebar = () => {},
  activeItem = null,
  setActiveItem = () => {},
}) => {
  const SIDEBAR_WIDTH = 70;
  const pathname = usePathname();
  const routeActiveItem = pathToItem[pathname] || "dashboard";
  const [localActiveItem, setLocalActiveItem] = useState(routeActiveItem);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [submenuType, setSubmenuType] = useState(null);
  const [submenuTop, setSubmenuTop] = useState(240);
  const reportTriggerRef = useRef(null);
  const chartTriggerRef = useRef(null);
  const complaintTriggerRef = useRef(null);
  const settingTriggerRef = useRef(null);
  const submenuPanelRef = useRef(null);
  const sidebarWidth = isOpen ? SIDEBAR_WIDTH : 0;
  const panelWidth = 500;
  const panelTop = 100;
  const panelLeft = sidebarWidth;
  const toggleLeft = dashboardVisible ? panelLeft + panelWidth + 1 : sidebarWidth;
  const resolvedActiveItem = routeActiveItem || activeItem || localActiveItem;
  const submenuLeft = useMemo(() => sidebarWidth - 8, [sidebarWidth]);
  const activeSubmenuItems =
    submenuType === "chart"
      ? chartMenuItems
      : submenuType === "complain"
      ? complaintMenuItems
      : submenuType === "setting"
      ? settingMenuItems
      : reportMenuItems;

  const updateSubmenuPosition = useCallback((type) => {
    const targetRef =
      type === "chart"
        ? chartTriggerRef.current
        : type === "complain"
        ? complaintTriggerRef.current
        : type === "setting"
        ? settingTriggerRef.current
        : reportTriggerRef.current;
    if (!targetRef) return;
    const rect = targetRef.getBoundingClientRect();
    setSubmenuTop(Math.max(80, rect.top - 8));
  }, []);

  useEffect(() => {
    setLocalActiveItem(routeActiveItem);
  }, [routeActiveItem]);

  useEffect(() => {
    if (!isOpen) {
      setSubmenuType(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!submenuType) return undefined;

    updateSubmenuPosition(submenuType);
    const onResize = () => updateSubmenuPosition(submenuType);
    const onClickOutside = (event) => {
      const target = event.target;
      const outsideReportTrigger = !reportTriggerRef.current || !reportTriggerRef.current.contains(target);
      const outsideChartTrigger = !chartTriggerRef.current || !chartTriggerRef.current.contains(target);
      const outsideComplaintTrigger =
        !complaintTriggerRef.current || !complaintTriggerRef.current.contains(target);
      const outsideSettingTrigger = !settingTriggerRef.current || !settingTriggerRef.current.contains(target);
      if (
        submenuPanelRef.current &&
        !submenuPanelRef.current.contains(target) &&
        outsideReportTrigger &&
        outsideChartTrigger &&
        outsideComplaintTrigger &&
        outsideSettingTrigger
      ) {
        setSubmenuType(null);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [submenuType, updateSubmenuPosition]);

  return (
    <>
      <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ""}`} id="sidebar">
        <div className={styles.sidebarLogo}>
          <Link href="/">
            <Image className={styles.logoDefault} src={logo} alt="Logo" width={96} height={96} />
          </Link>
        </div>

        <ul className={styles.menu}>
          {navItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              {item.id === "report" || item.id === "chart" || item.id === "complain" || item.id === "setting" ? (
                <button
                  ref={
                    item.id === "report"
                      ? reportTriggerRef
                      : item.id === "chart"
                      ? chartTriggerRef
                      : item.id === "complain"
                      ? complaintTriggerRef
                      : settingTriggerRef
                  }
                  type="button"
                  className={`${styles.menuLink} ${styles.menuButton} ${
                    resolvedActiveItem === item.id ? styles.active : ""
                  }`}
                  onClick={() => {
                    setLocalActiveItem(item.id);
                    setActiveItem(item.id);
                    setSubmenuType((prev) => (prev === item.id ? null : item.id));
                    updateSubmenuPosition(item.id);
                  }}
                >
                  <Image src={item.icon} alt={`${item.label} Icon`} width={24} height={24} />
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link
                  href={routeMap[item.id] || "#"}
                  className={`${styles.menuLink} ${resolvedActiveItem === item.id ? styles.active : ""}`}
                  onClick={() => {
                    setLocalActiveItem(item.id);
                    setActiveItem(item.id);
                    setSubmenuType(null);
                  }}
                >
                  <Image src={item.icon} alt={`${item.label} Icon`} width={24} height={24} />
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <button
          className={styles.toggleBtn}
          onClick={(event) => {
            event.preventDefault();
          }}
          type="button"
        >
          <Image src={toggleIcon} alt="Toggle Icon" width={20} height={20} />
        </button>
      </aside>

      <button
        type="button"
        className={styles.verticalOrangeButton}
        style={{ left: `${toggleLeft}px`, top: `${panelTop}px` }}
        onClick={() => setDashboardVisible((prev) => !prev)}
        aria-label="Toggle dashboard overlay"
      />

      {dashboardVisible && (
        <div
          style={{
            position: "fixed",
            top: `${panelTop}px`,
            bottom: "8px",
            left: `${panelLeft}px`,
            width: `${panelWidth}px`,
            zIndex: 9998,
          }}
        >
          <Panels />
        </div>
      )}

      {submenuType && isOpen && (
        <div
          ref={submenuPanelRef}
          className={styles.reportPanel}
          style={{
            left: `${submenuLeft}px`,
            top: `${submenuTop}px`,
            width:
              submenuType === "chart"
                ? "190px"
                : submenuType === "setting"
                ? "220px"
                : submenuType === "complain"
                ? "220px"
                : "238px",
          }}
        >
          <ul className={styles.reportMenuList}>
            {activeSubmenuItems.map(({ label, Icon }) => (
              <li key={label} className={styles.reportMenuItem}>
                <span className={styles.reportItemLeft}>
                  <Icon size={12} />
                  <span>{label}</span>
                </span>
                <FaChevronRight size={10} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default Sidebar;
