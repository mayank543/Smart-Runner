import { useRef, useEffect, useState } from 'react';

// Enhanced MapCanvas with Intersection Observer API for performance optimization
const MapCanvas = ({ positions }) => {
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const observerRef = useRef(null);

  // Intersection Observer API - Only render when canvas is visible
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up Intersection Observer to optimize rendering
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          setIsVisible(entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1
        }
      );

      observerRef.current.observe(canvas);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Canvas drawing with Background Tasks API integration
  useEffect(() => {
    if (!isVisible) {
      console.log('🎨 Canvas not visible, skipping render');
      return;
    }

    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      
      // Clear canvas with smooth animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background grid for reference
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i <= canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      console.log("🎨 Canvas redraw - positions:", positions.length);
      
      if (positions.length === 0) {
        // Draw "No data" message
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No tracking data yet", canvas.width / 2, canvas.height / 2);
        ctx.fillText("Click 'Start Run' to begin tracking", canvas.width / 2, canvas.height / 2 + 25);
        return;
      }

      if (positions.length === 1) {
        // Draw single point with pulsing animation
        const pos = positions[0];
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.5 + 0.5;
        
        ctx.fillStyle = `rgba(50, 205, 50, ${0.8 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 8 + pulse * 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Start Point", canvas.width / 2, canvas.height / 2 + 35);
        ctx.fillText(`Accuracy: ${pos.accuracy?.toFixed(1)}m`, canvas.width / 2, canvas.height / 2 + 50);
        return;
      }

      // Calculate bounds
      const lats = positions.map((p) => p.latitude);
      const lons = positions.map((p) => p.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      console.log("📐 Bounds:", { minLat, maxLat, minLon, maxLon });

      const padding = 30;
      const width = canvas.width - padding * 2;
      const height = canvas.height - padding * 2;
      
      // Handle case where all points are the same (or very close)
      const latRange = maxLat - minLat;
      const lonRange = maxLon - minLon;
      
      // If range is too small, add some padding
      const minRange = 0.001; // ~100 meters
      const effectiveLatRange = Math.max(latRange, minRange);
      const effectiveLonRange = Math.max(lonRange, minRange);
      
      const adjustedMinLat = minLat - (effectiveLatRange - latRange) / 2;
      const adjustedMaxLat = maxLat + (effectiveLatRange - latRange) / 2;
      const adjustedMinLon = minLon - (effectiveLonRange - lonRange) / 2;
      const adjustedMaxLon = maxLon + (effectiveLonRange - lonRange) / 2;

      // Draw the path with gradient
      const pathPoints = [];
      
      positions.forEach((pos, i) => {
        const x = padding + ((pos.longitude - adjustedMinLon) / (adjustedMaxLon - adjustedMinLon)) * width;
        const y = padding + ((adjustedMaxLat - pos.latitude) / (adjustedMaxLat - adjustedMinLat)) * height;
        pathPoints.push({ x, y, accuracy: pos.accuracy });
      });

      // Draw path with gradient from red to orange
      if (pathPoints.length > 1) {
        const gradient = ctx.createLinearGradient(
          pathPoints[0].x, pathPoints[0].y,
          pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y
        );
        gradient.addColorStop(0, "red");
        gradient.addColorStop(0.5, "orange");
        gradient.addColorStop(1, "yellow");

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        pathPoints.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
      }
      
      // Draw start point (green with glow effect)
      if (pathPoints.length > 0) {
        const start = pathPoints[0];
        ctx.shadowColor = "lime";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "lime";
        ctx.beginPath();
        ctx.arc(start.x, start.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Add "START" label
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("START", start.x, start.y - 15);
      }
      
      // Draw end point (cyan with pulsing effect)
      if (pathPoints.length > 1) {
        const end = pathPoints[pathPoints.length - 1];
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.3 + 0.7;
        
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(end.x, end.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Add "CURRENT" label
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CURRENT", end.x, end.y - 15);
      }
      
      // Draw intermediate points with accuracy indicators
      pathPoints.forEach((point, i) => {
        if (i > 0 && i < pathPoints.length - 1) {
          // Draw accuracy circle (larger circle = less accurate)
          const accuracy = point.accuracy || 10;
          const accuracyRadius = Math.max(2, Math.min(accuracy / 5, 10));
          
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, accuracyRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw point
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    // Use Background Tasks API for smooth rendering
    if ('requestIdleCallback' in window) {
      requestIdleCallback(drawCanvas, { timeout: 100 });
    } else {
      // Fallback for browsers without Background Tasks API
      requestAnimationFrame(drawCanvas);
    }
  }, [positions, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={400}
      className="border border-gray-500 rounded bg-gray-800"
    />
  );
};

export default MapCanvas;