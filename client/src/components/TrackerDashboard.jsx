import { useMemo } from "react";

// import { useAuth } from "@clerk/clerk-react"; // Removed useAuth
import {
  Play,
  Square,
  MapPin,
  Activity,
  Zap,
  Timer,
  Navigation,
  Wifi,
  Signal,
  Target,
  Map,
} from "lucide-react";
import LeafletMapComponent from "./LeafletMapComponent";

// Calculate distance between two points
function calculateDistance(pos1, pos2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Filter positions to reduce GPS noise and false movements
function filterValidMovements(positions) {
  if (positions.length < 2) return positions;

  const filtered = [positions[0]]; // Always include first position

  for (let i = 1; i < positions.length; i++) {
    const prev = filtered[filtered.length - 1];
    const current = positions[i];

    // Calculate distance between points
    const distance = calculateDistance(prev, current);

    // Only add point if movement is significant enough
    // Use GPS accuracy to determine minimum movement threshold
    const minMovement = Math.max(
      (prev.accuracy || 10) + (current.accuracy || 10), // Sum of both accuracies
      5 // Minimum 5 meters to filter out GPS noise
    );

    if (distance > minMovement) {
      filtered.push(current);
    }
  }

  return filtered;
}

// Format distance in appropriate units
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

// Format speed in km/h
function formatSpeed(metersPerSecond) {
  if (!metersPerSecond) return "0.0 km/h";
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

// Calculate average speed
function calculateAverageSpeed(positions) {
  const filtered = filterValidMovements(positions);
  if (filtered.length < 2) return 0;

  const totalDistance = filtered.reduce((total, pos, i) => {
    if (i === 0) return 0;
    return total + calculateDistance(filtered[i - 1], pos);
  }, 0);

  const totalTime =
    (filtered[filtered.length - 1].timestamp - filtered[0].timestamp) / 1000; // in seconds

  if (totalTime <= 0) return 0;
  return totalDistance / totalTime; // m/s
}

// Calculate current speed with smoothing
function calculateCurrentSpeed(positions) {
  const filtered = filterValidMovements(positions);
  if (filtered.length < 2) return 0;

  // Use last few points for current speed calculation
  const recentPoints = filtered.slice(-3); // Last 3 filtered points
  if (recentPoints.length < 2) return 0;

  const distance = calculateDistance(
    recentPoints[0],
    recentPoints[recentPoints.length - 1]
  );
  const timeDiff =
    (recentPoints[recentPoints.length - 1].timestamp -
      recentPoints[0].timestamp) /
    1000;

  if (timeDiff <= 0) return 0;
  return distance / timeDiff; // m/s
}

// Format time duration
function formatDuration(startTime, endTime) {
  const duration = (endTime - startTime) / 1000; // in seconds
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}m ${seconds}s`;
}

function TrackerDashboard({
  tracking,
  setTracking,
  sessionStartTime,
  sessionPositions,
  error,
  status,
  networkInfo,
}) {
  // const { getToken } = useAuth(); // Removed getToken

  // Calculate stats with filtered positions
  const filteredPositions = useMemo(
    () => filterValidMovements(sessionPositions),
    [sessionPositions]
  );

  const totalDistance = useMemo(() => {
    if (filteredPositions.length < 2) return 0;

    let distance = 0;
    for (let i = 1; i < filteredPositions.length; i++) {
      distance += calculateDistance(
        filteredPositions[i - 1],
        filteredPositions[i]
      );
    }
    return distance;
  }, [filteredPositions]);

  const averageSpeed = calculateAverageSpeed(sessionPositions);
  const currentSpeed = calculateCurrentSpeed(sessionPositions);

  const duration =
    sessionStartTime && sessionPositions.length > 0
      ? formatDuration(
        sessionStartTime,
        sessionPositions[sessionPositions.length - 1].timestamp
      )
      : "0m 0s";

  // Save run to Local Storage
  const saveRunSession = async () => {
    if (sessionPositions.length < 2) {
      alert("Not enough data to save this run");
      return;
    }

    try {
      // Calculate max speed from the session
      let maxSpeed = 0;
      for (let i = 1; i < sessionPositions.length; i++) {
        const speed = calculateCurrentSpeed(sessionPositions.slice(0, i + 1));
        if (speed > maxSpeed) maxSpeed = speed;
      }

      const runData = {
        _id: Date.now().toString(), // Generate a unique ID
        createdAt: new Date().toISOString(),
        distance: totalDistance,
        avgSpeed: averageSpeed * 3.6, // Convert m/s to km/h
        maxSpeed: maxSpeed * 3.6, // Convert m/s to km/h
        duration: (Date.now() - sessionStartTime) / 1000, // Convert to seconds
        calories: Math.round(totalDistance * 0.06), // Rough calorie calculation
        path: sessionPositions.map((pos) => ({
          latitude: pos.latitude,
          longitude: pos.longitude,
          timestamp: pos.timestamp,
          accuracy: pos.accuracy,
        })),
      };

      console.log("Saving run data to localStorage:", runData);

      // Get existing runs
      const existingRuns = JSON.parse(localStorage.getItem("smartRunner_history") || "[]");

      // Add new run
      const updatedRuns = [runData, ...existingRuns];

      // Save back to localStorage
      localStorage.setItem("smartRunner_history", JSON.stringify(updatedRuns));

      console.log("Run saved successfully locally");
      alert("Run saved successfully! Check your history to see the details.");

    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving run: " + error.message);
    }
  };

  // 👈 Fixed handleStopTracking function
  const handleStopTracking = async () => {
    setTracking(false);
    if (sessionPositions.length >= 2) {
      const shouldSave = window.confirm(
        "Would you like to save this run to your history?"
      );
      if (shouldSave) {
        await saveRunSession();
      }
    }
  };

  return (
    <>
      <div className="mb-6 space-y-4">
        <button
          onClick={tracking ? handleStopTracking : () => setTracking(true)} // 👈 Use handleStopTracking
          className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 ${tracking
            ? "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700"
            : "bg-white hover:bg-gray-200 text-black"
            }`}
        >
          <div className="relative flex items-center gap-3">
            {tracking ? (
              <>
                <Square className="h-5 w-5 fill-current" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                Start Run
              </>
            )}
          </div>
        </button>

        <div className="text-sm">
          <p>
            Status:{" "}
            <span
              className={`font-bold ${status === "tracking"
                ? "text-white"
                : status === "error"
                  ? "text-white"
                  : "text-gray-500"
                }`}
            >
              {status}
            </span>
          </p>
          {error && <p className="text-white">Error: {error}</p>}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Distance Card */}
        <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">
              Total Distance
            </h3>
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatDistance(totalDistance)}
          </div>
          <p className="text-gray-500 text-sm">
            Distance covered this session
          </p>
        </div>

        {/* Average Speed Card */}
        <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">
              Average Speed
            </h3>
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {formatSpeed(averageSpeed)}
          </div>
          <p className="text-gray-500 text-sm">
            Your average pace for this session
          </p>
        </div>

        {/* Current Activity Card */}
        <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 hover:border-white/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">
              Current Activity
            </h3>
            <Timer className="h-6 w-6 text-white" />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {tracking ? "Running" : "Stopped"}
          </div>
          <p className="text-gray-500 text-sm">
            {tracking ? `Duration: ${duration}` : "Ready to start"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Current: {formatSpeed(currentSpeed)}
          </p>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 hover:border-white/30 transition-all duration-300"
        >
          <div className="text-white font-semibold text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {sessionPositions.length}
          </div>
          <div className="text-gray-500 text-sm">GPS Points</div>
        </div>

        <div
          className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 hover:border-white/30 transition-all duration-300"
        >
          <div className="text-white font-semibold text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {sessionPositions.length > 0
              ? `${sessionPositions[
                sessionPositions.length - 1
              ].accuracy?.toFixed(0) || "N/A"
              }m`
              : "N/A"}
          </div>
          <div className="text-gray-500 text-sm">GPS Accuracy</div>
        </div>

        {networkInfo && (
          <>
            <div
              className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 hover:border-white/30 transition-all duration-300"
            >
              <div className="text-white font-semibold text-lg flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                {networkInfo.effectiveType}
              </div>
              <div className="text-gray-500 text-sm">Network Type</div>
            </div>

            <div
              className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 hover:border-white/30 transition-all duration-300"
            >
              <div className="text-white font-semibold text-lg flex items-center gap-2">
                <Signal className="h-5 w-5" />
                {networkInfo.rtt}ms
              </div>
              <div className="text-gray-500 text-sm">Network RTT</div>
            </div>
          </>
        )}
      </div>

      {/* Current Position Display */}
      {sessionPositions.length > 0 && (
        <div
          className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 mb-6 hover:border-white/30 transition-all duration-300"
        >
          <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Position
          </h3>
          <p className="font-mono text-sm text-gray-300">
            {sessionPositions[sessionPositions.length - 1].latitude.toFixed(6)},{" "}
            {sessionPositions[sessionPositions.length - 1].longitude.toFixed(6)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {tracking ? "Live Updates" : "Paused"} • Last updated:{" "}
            {new Date(
              sessionPositions[sessionPositions.length - 1].timestamp
            ).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Map Canvas */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-white text-xl flex items-center gap-2">
          <Map className="h-6 w-6" />
          Live Tracking Map
        </h3>
        <div
          className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-white/30 transition-all duration-300"
        >
          <LeafletMapComponent positions={sessionPositions} />
          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span>Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Path</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border border-gray-500 rounded-full"></div>
                <span>Current Position</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Signal className="h-4 w-4" />
              <span>{tracking ? "Live Updates" : "Static View"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TrackerDashboard;
