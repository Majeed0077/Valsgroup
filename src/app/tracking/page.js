"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the MapComponent with SSR disabled
const Tracking = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export default function TrackingPage() {
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <Tracking />
    </div>
  );
}
