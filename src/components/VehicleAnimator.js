// src/components/VehicleAnimator.js
import React, { useState, useEffect, useRef } from 'react';
import AnimatedMarker from './AnimatedMarker';

const VehicleAnimator = ({ vehicle }) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [previousPosition, setPreviousPosition] = useState(null);
  const index = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Stop any existing animation when the component unmounts or path changes
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    
    const path = (vehicle.path || []).map(p => [p.latitude, p.longitude]);

    // We need at least two points to animate
    if (path.length < 2) {
        if(path.length === 1) setCurrentPosition(path[0]);
        return cleanup;
    }

    // Initialize position
    setCurrentPosition(path[0]);
    index.current = 0;
    
    // Calculate interval duration
    const totalAnimationTime = 50000; // 50 seconds
    const intervalDuration = totalAnimationTime / (path.length - 1);

    intervalRef.current = setInterval(() => {
      index.current += 1;
      
      if (index.current >= path.length) {
        // Stop the interval when the animation is done
        clearInterval(intervalRef.current);
        return;
      }
      
      setPreviousPosition(path[index.current - 1]);
      setCurrentPosition(path[index.current]);
    }, intervalDuration);

    // Cleanup function to clear the interval when the component is unmounted
    return cleanup;

  }, [vehicle.path]); // Rerun effect if the vehicle's path changes

  if (!currentPosition) {
    return null; // Don't render anything if there's no position
  }

  return (
    <AnimatedMarker
      vehicle={vehicle}
      position={currentPosition}
      previousPosition={previousPosition}
    />
  );
};

export default VehicleAnimator;