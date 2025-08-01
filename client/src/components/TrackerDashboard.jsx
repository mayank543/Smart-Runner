import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react'; // 👈 Import useAuth
import { Play, Square, MapPin, Activity, Zap, Timer, Navigation, Wifi, Signal, Target, Map } from 'lucide-react';
import MapCanvas from './MapCanvas';

// Calculate distance between two points
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
  if (!metersPerSecond) return '0.0 km/h';
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

// Calculate average speed
function calculateAverageSpeed(positions) {
  const filtered = filterValidMovements(positions);
  if (filtered.length < 2) return 0;
  
  const totalDistance = filtered.reduce((total, pos, i) => {
    if (i === 0) return 0;
    return total + calculateDistance(filtered[i-1], pos);
  }, 0);
  
  const totalTime = (filtered[filtered.length - 1].timestamp - filtered[0].timestamp) / 1000; // in seconds
  
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
  
  const distance = calculateDistance(recentPoints[0], recentPoints[recentPoints.length - 1]);
  const timeDiff = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 1000;
  
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
  networkInfo 
}) {
  const { getToken } = useAuth(); // 👈 Get auth token function

  // Calculate stats with filtered positions
  const filteredPositions = useMemo(() => filterValidMovements(sessionPositions), [sessionPositions]);
  
  const totalDistance = useMemo(() => {
    if (filteredPositions.length < 2) return 0;
    
    let distance = 0;
    for (let i = 1; i < filteredPositions.length; i++) {
      distance += calculateDistance(filteredPositions[i-1], filteredPositions[i]);
    }
    return distance;
  }, [filteredPositions]);

  const averageSpeed = calculateAverageSpeed(sessionPositions);
  const currentSpeed = calculateCurrentSpeed(sessionPositions);
  
  const duration = sessionStartTime && sessionPositions.length > 0 ? 
    formatDuration(sessionStartTime, sessionPositions[sessionPositions.length - 1].timestamp) : '0m 0s';

  // 👈 Fixed saveRunSession function with Clerk auth
  const saveRunSession = async () => {
    if (sessionPositions.length < 2) {
      alert('Not enough data to save this run');
      return;
    }

    try {
      const token = await getToken(); // 👈 Get Clerk token
      if (!token) {
        alert('Please login to save your runs');
        return;
      }

      // Calculate max speed from the session
      let maxSpeed = 0;
      for (let i = 1; i < sessionPositions.length; i++) {
        const speed = calculateCurrentSpeed(sessionPositions.slice(0, i + 1));
        if (speed > maxSpeed) maxSpeed = speed;
      }

      const runData = {
        distance: totalDistance,
        avgSpeed: averageSpeed * 3.6, // Convert m/s to km/h
        maxSpeed: maxSpeed * 3.6, // Convert m/s to km/h
        duration: (Date.now() - sessionStartTime) / 1000, // Convert to seconds
        calories: Math.round(totalDistance * 0.06), // Rough calorie calculation
        path: sessionPositions.map(pos => ({
          latitude: pos.latitude,
          longitude: pos.longitude,
          timestamp: pos.timestamp,
          accuracy: pos.accuracy
        }))
      };

      console.log('Saving run data:', runData); // 👈 Debug log

      const response = await fetch('http://localhost:3000/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(runData)
      });

      if (response.ok) {
        const savedRun = await response.json();
        console.log('Run saved successfully:', savedRun);
        alert('Run saved successfully! Check your history to see the details.');
      } else {
        const errorData = await response.text();
        console.error('Save failed:', errorData);
        alert('Failed to save run: ' + errorData);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving run: ' + error.message);
    }
  };

  // 👈 Fixed handleStopTracking function
  const handleStopTracking = async () => {
    setTracking(false);
    if (sessionPositions.length >= 2) {
      const shouldSave = window.confirm('Would you like to save this run to your history?');
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
          className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
            tracking 
              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-2xl shadow-red-500/30 text-white" 
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-2xl shadow-green-500/30 text-white"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
          <p>Status: <span className={`font-bold ${
            status === 'tracking' ? 'text-green-400' : 
            status === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>{status}</span></p>
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Distance Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-green-400/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Total Distance</h3>
              <Navigation className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent mb-2">
              {formatDistance(totalDistance)}
            </div>
            <p className="text-gray-400 text-sm">
              Distance covered this session
            </p>
          </div>
        </div>

        {/* Average Speed Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-purple-400/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Average Speed</h3>
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent mb-2">
              {formatSpeed(averageSpeed)}
            </div>
            <p className="text-gray-400 text-sm">
              Your average pace for this session
            </p>
          </div>
        </div>

        {/* Current Activity Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-orange-400/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-sm font-medium">Current Activity</h3>
              <Timer className="h-6 w-6 text-orange-400" />
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-300 bg-clip-text text-transparent mb-1">
              {tracking ? 'Running' : 'Stopped'}
            </div>
            <p className="text-gray-400 text-sm">
              {tracking ? `Duration: ${duration}` : 'Ready to start'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Current: {formatSpeed(currentSpeed)}
            </p>
          </div>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
          <div className="text-cyan-400 font-semibold text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {sessionPositions.length}
          </div>
          <div className="text-gray-400 text-sm">GPS Points</div>
        </div>
        
        <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
          <div className="text-yellow-400 font-semibold text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {sessionPositions.length > 0 ? 
              `${sessionPositions[sessionPositions.length - 1].accuracy?.toFixed(0) || 'N/A'}m` : 
              'N/A'
            }
          </div>
          <div className="text-gray-400 text-sm">GPS Accuracy</div>
        </div>

        {networkInfo && (
          <>
            <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-blue-400 font-semibold text-lg flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                {networkInfo.effectiveType}
              </div>
              <div className="text-gray-400 text-sm">Network Type</div>
            </div>
            
            <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-indigo-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
              <div className="text-indigo-400 font-semibold text-lg flex items-center gap-2">
                <Signal className="h-5 w-5" />
                {networkInfo.rtt}ms
              </div>
              <div className="text-gray-400 text-sm">Network RTT</div>
            </div>
          </>
        )}
      </div>

      {/* Current Position Display */}
      {sessionPositions.length > 0 && (
        <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 mb-6 hover:border-green-400/50 transition-all duration-300">
          <h3 className="font-semibold mb-2 text-green-400 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Position
          </h3>
          <p className="font-mono text-sm text-gray-300">
            {sessionPositions[sessionPositions.length - 1].latitude.toFixed(6)}, {sessionPositions[sessionPositions.length - 1].longitude.toFixed(6)}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {tracking ? "Live Updates" : "Paused"} • Last updated: {new Date(sessionPositions[sessionPositions.length - 1].timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Map Canvas */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-green-400 text-xl flex items-center gap-2">
          <Map className="h-6 w-6" />
          Live Tracking Map
        </h3>
        <div style={{backgroundColor: '#181818'}} className="backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 hover:border-green-400/30 transition-all duration-300">
          <MapCanvas positions={sessionPositions} />
          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Path</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
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