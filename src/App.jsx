import { useState, useEffect } from 'react';
import MapCanvas from './components/MapCanvas';
import useGeoTracker from './hooks/useGeoTracker';

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
  if (positions.length < 2) return 0;
  
  const totalDistance = positions.reduce((total, pos, i) => {
    if (i === 0) return 0;
    return total + calculateDistance(positions[i-1], pos);
  }, 0);
  
  const totalTime = (positions[positions.length - 1].timestamp - positions[0].timestamp) / 1000; // in seconds
  
  if (totalTime <= 0) return 0;
  return totalDistance / totalTime; // m/s
}

// Format time duration
function formatDuration(startTime, endTime) {
  const duration = (endTime - startTime) / 1000; // in seconds
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}m ${seconds}s`;
}

function App() {
  const [tracking, setTracking] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const { positions, error, status, networkInfo } = useGeoTracker(tracking);
  
  // Clear positions when starting new tracking session
  const [sessionPositions, setSessionPositions] = useState([]);
  
  useEffect(() => {
    if (tracking && positions.length === 0) {
      setSessionPositions([]);
      setSessionStartTime(Date.now());
    } else {
      setSessionPositions(positions);
    }
  }, [tracking, positions]);
  
  // Calculate stats
  const totalDistance = sessionPositions.reduce((total, pos, i) => {
    if (i === 0) return 0;
    return total + calculateDistance(sessionPositions[i-1], pos);
  }, 0);

  const averageSpeed = calculateAverageSpeed(sessionPositions);
  const currentSpeed = sessionPositions.length > 0 ? 
    (sessionPositions[sessionPositions.length - 1].speed || 0) : 0;
  
  const duration = sessionStartTime && sessionPositions.length > 0 ? 
    formatDuration(sessionStartTime, sessionPositions[sessionPositions.length - 1].timestamp) : '0m 0s';

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-green-400">🏃 Smart Runner - Live GPS Tracker</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Real-time GPS tracking using Web APIs: Geolocation • Canvas • Background Tasks • Intersection Observer • Network Information
        </p>
      
        <div className="mb-6 space-y-4">
          <button
            onClick={() => setTracking(!tracking)}
            className={`px-6 py-3 rounded-lg font-medium text-lg transition-all duration-300 transform hover:scale-105 ${
              tracking 
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/25" 
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 shadow-lg shadow-green-500/25"
            }`}
          >
            {tracking ? "🛑 Stop Tracking" : "▶️ Start Run"}
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
                <span className="text-2xl animate-pulse">📏</span>
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
                <span className="text-2xl animate-bounce">⚡</span>
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
                <span className="text-2xl">🏃‍♂️</span>
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
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <div className="text-cyan-400 font-semibold text-lg">{sessionPositions.length}</div>
            <div className="text-gray-400 text-sm">GPS Points</div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="text-yellow-400 font-semibold text-lg">
              {sessionPositions.length > 0 ? 
                `${sessionPositions[sessionPositions.length - 1].accuracy?.toFixed(0) || 'N/A'}m` : 
                'N/A'
              }
            </div>
            <div className="text-gray-400 text-sm">GPS Accuracy</div>
          </div>

          {networkInfo && (
            <>
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="text-blue-400 font-semibold text-lg">{networkInfo.effectiveType}</div>
                <div className="text-gray-400 text-sm">Network Type</div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-indigo-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="text-indigo-400 font-semibold text-lg">{networkInfo.rtt}ms</div>
                <div className="text-gray-400 text-sm">Network RTT</div>
              </div>
            </>
          )}
        </div>

        {/* Current Position Display */}
        {sessionPositions.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 mb-6 hover:border-green-400/50 transition-all duration-300">
            <h3 className="font-semibold mb-2 text-green-400">📍 Current Position</h3>
            <p className="font-mono text-sm text-gray-300">
              {sessionPositions[sessionPositions.length - 1].latitude.toFixed(6)}, {sessionPositions[sessionPositions.length - 1].longitude.toFixed(6)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {tracking ? "🔄 Live Updates" : "⏸️ Paused"} • Last updated: {new Date(sessionPositions[sessionPositions.length - 1].timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Map Canvas */}
        <div className="mb-6">
          <h3 className="font-bold mb-4 text-green-400 text-xl">🗺️ Live Tracking Map</h3>
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 hover:border-green-400/30 transition-all duration-300">
            <MapCanvas positions={sessionPositions} />
            <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
              <span>🟢 Start • 🔴 Path • 🔵 Current Position</span>
              <span>{tracking ? "📡 Live Updates" : "📍 Static View"}</span>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500">
          <details>
            <summary className="cursor-pointer hover:text-gray-400">Debug Info</summary>
            <pre className="mt-2 p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg overflow-auto max-h-40 border border-slate-700/50">
              {JSON.stringify(sessionPositions, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

export default App;