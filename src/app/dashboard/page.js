"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the MapComponent with SSR disabled
const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
});

export default function Dashboardpage() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", overflowY: "auto" }}>
      <Dashboard />
    </div>
  );
}
