"use client";

import React from "react";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <div style={{ height: "100vh", overflowY: "auto", padding: "20px" }}>
      <h2>Dashboard</h2>
      <Dashboard />
    </div>
  );
}
