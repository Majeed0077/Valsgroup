"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
});

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeItem={activeNavItem}
        setActiveItem={setActiveNavItem}
      />
      <div style={{ marginLeft: isSidebarOpen ? "100px" : "0", minHeight: "100vh", overflowY: "auto" }}>
        <Dashboard />
      </div>
    </>
  );
}
