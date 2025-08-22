import { useRef, useEffect, useState } from "react";

// Enhanced MapCanvas with Intersection Observer API for performance optimization
const MapCanvas = ({ positions }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 400 });
  const observerRef = useRef(null);

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;

        // Calculate responsive dimensions
        const width = Math.min(containerWidth - 16, 800); // Max width 800px, subtract padding
        const height = Math.min(width * 0.6, 400); // Maintain aspect ratio, max height 400px

        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Intersection Observer API - Only render when canvas is visible
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up Intersection Observer to optimize rendering
    if ("IntersectionObserver" in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          setIsVisible(entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: "50px",
          threshold: 0.1,
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
      console.log("🎨 Canvas not visible, skipping render");
      return;
    }

    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      // Clear canvas with black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid with dark green color
      ctx.strokeStyle = "rgba(34, 197, 94, 0.1)"; // green-500 with low opacity
      ctx.lineWidth = 1;
      const gridSize = Math.min(canvas.width, canvas.height) / 10;

      for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i <= canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      console.log("🎨 Canvas redraw - positions:", positions.length);

      if (positions.length === 0) {
        // Draw "No data" message with green theme
        ctx.fillStyle = "#10b981"; // green-500
        ctx.font = `${Math.min(canvas.width, canvas.height) / 25}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "No tracking data yet",
          canvas.width / 2,
          canvas.height / 2
        );
        ctx.fillStyle = "#6b7280"; // gray-500
        ctx.font = `${Math.min(canvas.width, canvas.height) / 30}px Arial`;
        ctx.fillText(
          "Click 'Start Run' to begin tracking",
          canvas.width / 2,
          canvas.height / 2 + 25
        );
        return;
      }

      if (positions.length === 1) {
        // Draw single point with pulsing green animation
        const pos = positions[0];
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.5 + 0.5;

        // Outer glow
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.8 + pulse * 0.2})`; // green-500
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          8 + pulse * 4,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        ctx.fillStyle = "#10b981";
        ctx.font = `${Math.min(canvas.width, canvas.height) / 35}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("Start Point", canvas.width / 2, canvas.height / 2 + 35);
        ctx.fillStyle = "#9ca3af"; // gray-400
        ctx.fillText(
          `Accuracy: ${pos.accuracy?.toFixed(1)}m`,
          canvas.width / 2,
          canvas.height / 2 + 50
        );
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

      const padding = Math.min(canvas.width, canvas.height) / 15;
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
        const x =
          padding +
          ((pos.longitude - adjustedMinLon) /
            (adjustedMaxLon - adjustedMinLon)) *
            width;
        const y =
          padding +
          ((adjustedMaxLat - pos.latitude) /
            (adjustedMaxLat - adjustedMinLat)) *
            height;
        pathPoints.push({ x, y, accuracy: pos.accuracy });
      });

      // Draw path with white color and subtle green glow
      if (pathPoints.length > 1) {
        // Draw glow effect
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 5;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(
          2,
          Math.min(canvas.width, canvas.height) / 150
        );
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        pathPoints.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw start point (green with glow effect)
      if (pathPoints.length > 0) {
        const start = pathPoints[0];
        const pointSize = Math.max(
          6,
          Math.min(canvas.width, canvas.height) / 60
        );

        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#10b981"; // green-500
        ctx.beginPath();
        ctx.arc(start.x, start.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add "START" label
        ctx.fillStyle = "#10b981";
        ctx.font = `${Math.min(canvas.width, canvas.height) / 40}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("START", start.x, start.y - pointSize - 5);
      }

      // Draw end point (brighter green with pulsing effect)
      if (pathPoints.length > 1) {
        const end = pathPoints[pathPoints.length - 1];
        const pointSize = Math.max(
          6,
          Math.min(canvas.width, canvas.height) / 60
        );
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.3 + 0.7;

        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`; // green-500 with pulse
        ctx.beginPath();
        ctx.arc(end.x, end.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add "CURRENT" label
        ctx.fillStyle = "#22c55e";
        ctx.font = `${Math.min(canvas.width, canvas.height) / 45}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("CURRENT", end.x, end.y - pointSize - 5);
      }

      // Draw intermediate points with accuracy indicators
      pathPoints.forEach((point, i) => {
        if (i > 0 && i < pathPoints.length - 1) {
          const pointSize = Math.max(
            2,
            Math.min(canvas.width, canvas.height) / 120
          );

          // Draw accuracy circle (larger circle = less accurate)
          const accuracy = point.accuracy || 10;
          const accuracyRadius = Math.max(
            pointSize,
            Math.min(accuracy / 5, pointSize * 3)
          );

          ctx.strokeStyle = "rgba(16, 185, 129, 0.3)"; // green-500 with opacity
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, accuracyRadius, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw point
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    // Use Background Tasks API for smooth rendering
    if ("requestIdleCallback" in window) {
      requestIdleCallback(drawCanvas, { timeout: 100 });
    } else {
      // Fallback for browsers without Background Tasks API
      requestAnimationFrame(drawCanvas);
    }
  }, [positions, isVisible, canvasSize]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border border-gray-800 rounded-lg bg-black w-full max-w-full"
        style={{ display: "block" }}
      />
    </div>
  );
};

export default MapCanvas;
