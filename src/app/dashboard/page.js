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
      <div
        style={{
          marginLeft: isSidebarOpen ? "88px" : "0",
          width: isSidebarOpen ? "calc(100% - 88px)" : "100%",
          minHeight: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Dashboard />
      </div>
    </>
  );
}
