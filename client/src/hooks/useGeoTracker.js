import { useState, useEffect, useRef } from 'react';

const useGeoTracker = (isTracking) => {
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [networkInfo, setNetworkInfo] = useState(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Network Information API - Monitor connection quality
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });

      const handleConnectionChange = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      };

      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  // Background Tasks API - Process position updates efficiently
  const schedulePositionUpdate = (position) => {
    const updatePosition = () => {
      const newPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };

      console.log('📍 New position:', newPosition);
      
      setPositions(prev => {
        // Filter out positions that are too close or too recent
        const lastPos = prev[prev.length - 1];
        if (lastPos) {
          const distance = calculateDistance(lastPos, newPosition);
          const timeDiff = newPosition.timestamp - lastPos.timestamp;
          
          // Skip if movement is less than 5 meters or less than 2 seconds
          if (distance < 5 && timeDiff < 2000) {
            return prev;
          }
        }
        
        return [...prev, newPosition];
      });
      setError(null);
    };

    // Use Background Tasks API if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(updatePosition, { timeout: 1000 });
    } else {
      // Fallback for browsers without Background Tasks API
      setTimeout(updatePosition, 0);
    }
  };

  useEffect(() => {
    if (!isTracking) {
      // Stop tracking
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setStatus('idle');
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setStatus('error');
      return;
    }

    setStatus('tracking');
    setError(null);

    // Adjust tracking frequency based on network conditions
    const getTrackingInterval = () => {
      if (!networkInfo) return 1000; // Default 1 second
      
      switch (networkInfo.effectiveType) {
        case 'slow-2g':
          return 10000; // 10 seconds
        case '2g':
          return 5000;  // 5 seconds
        case '3g':
          return 2000;  // 2 seconds
        case '4g':
        default:
          return 1000;  // 1 second
      }
    };

    // Options for geolocation with adaptive settings
    const options = {
      enableHighAccuracy: true,
      timeout: networkInfo?.effectiveType === 'slow-2g' ? 20000 : 10000,
      maximumAge: getTrackingInterval()
    };

    // Success callback
    const handleSuccess = (position) => {
      const now = Date.now();
      const interval = getTrackingInterval();
      
      // Throttle updates based on network conditions
      if (now - lastUpdateRef.current >= interval) {
        schedulePositionUpdate(position);
        lastUpdateRef.current = now;
      }
    };

    // Error callback
    const handleError = (error) => {
      console.error('Geolocation error:', error);
      setError(error.message);
      setStatus('error');
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup function
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, networkInfo]);

  // Clear positions when starting new tracking session
  useEffect(() => {
    if (isTracking) {
      setPositions([]);
      lastUpdateRef.current = 0;
    }
  }, [isTracking]);

  return {
    positions,
    error,
    status,
    networkInfo
  };
};

// Helper function to calculate distance between two points
function calculateDistance(pos1, pos2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = pos1.latitude * Math.PI/180;
  const φ2 = pos2.latitude * Math.PI/180;
  const Δφ = (pos2.latitude-pos1.latitude) * Math.PI/180;
  const Δλ = (pos2.longitude-pos1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export default useGeoTracker;