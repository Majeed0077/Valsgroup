'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const AnimatedMarker = dynamic(() => import('./AnimatedMarker'), { ssr: false });

const VehicleAnimator = ({ vehicle }) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [previousPosition, setPreviousPosition] = useState(null);

  const animationFrameRef = useRef(null);
  const index = useRef(0);
  const pathRef = useRef([]);

  useEffect(() => {
    if (!vehicle?.path?.length) return;

    const path = vehicle.path.map(p => [p.latitude, p.longitude]);
    pathRef.current = path;

    let startTime = null;
    const totalAnimationTime = 50000;
    const stepDuration = totalAnimationTime / (path.length - 1);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const step = Math.floor(elapsed / stepDuration);

      if (step >= path.length - 1) {
        setPreviousPosition(path[path.length - 2]);
        setCurrentPosition(path[path.length - 1]);
        cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      if (step !== index.current) {
        setPreviousPosition(path[step]);
        setCurrentPosition(path[step + 1]);
        index.current = step;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize positions
    setCurrentPosition(path[0]);
    setPreviousPosition(null);
    index.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [vehicle.path]);

  if (!currentPosition) return null;

  return (
    <AnimatedMarker
      vehicle={vehicle}
      position={currentPosition}
      previousPosition={previousPosition}
    />
  );
};

export default VehicleAnimator;
