"use client";

import React from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const Tracking = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export default function TrackingPage() {
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      {/* Header sits on top (it already has absolute + z-index in CSS) */}
      <Header />

      {/* Map */}
      <div style={{ width: "100%", height: "100vh" }}>
        <Tracking />
      </div>
    </div>
  );
}
