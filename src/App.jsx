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

function App() {
  const [tracking, setTracking] = useState(false);
  const { positions, error, status, networkInfo } = useGeoTracker(tracking);
  
  // Clear positions when starting new tracking session
  const [sessionPositions, setSessionPositions] = useState([]);
  
  useEffect(() => {
    if (tracking && positions.length === 0) {
      setSessionPositions([]);
    } else {
      setSessionPositions(positions);
    }
  }, [tracking, positions]);
  
  // Calculate total distance
  const totalDistance = sessionPositions.reduce((total, pos, i) => {
    if (i === 0) return 0;
    return total + calculateDistance(sessionPositions[i-1], pos);
  }, 0);

  // Handle manual position addition for testing
  const [manualLat, setManualLat] = useState("12.9716");
  const [manualLon, setManualLon] = useState("77.5946");
  const [testPositions, setTestPositions] = useState([]);
  
  const addManualPosition = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      const newPos = {
        latitude: lat,
        longitude: lon,
        accuracy: 10,
        timestamp: Date.now()
      };
      
      setTestPositions(prev => [...prev, newPos]);
      console.log("📍 Adding manual position:", newPos);
      
      // Clear inputs for next point
      setManualLat("");
      setManualLon("");
    }
  };
  
  const clearTestPositions = () => {
    setTestPositions([]);
  };
  
  // Use test positions if available, otherwise use real positions
  const displayPositions = testPositions.length > 0 ? testPositions : sessionPositions;

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🏃 Smart Runner - Live GPS Tracker</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Real-time GPS tracking using Web APIs: Geolocation • Canvas • Background Tasks • Intersection Observer • Network Information
        </p>
      
      <div className="mb-4 space-y-2">
        <button
          onClick={() => setTracking(!tracking)}
          className={`px-4 py-2 rounded font-medium ${
            tracking 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {tracking ? "Stop Tracking" : "Start Run"}
        </button>
        
        <div className="text-sm">
          <p>Status: <span className={`font-bold ${
            status === 'tracking' ? 'text-green-400' : 
            status === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>{status}</span></p>
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-800 rounded">
        <h3 className="font-bold mb-2">📊 Real-time Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>Points Tracked: <span className="font-bold text-green-400">{displayPositions.length}</span></p>
            <p>Total Distance: <span className="font-bold text-blue-400">{totalDistance.toFixed(2)}m</span></p>
            {displayPositions.length > 0 && (
              <p>Current Speed: <span className="font-bold text-yellow-400">
                {displayPositions[displayPositions.length - 1].speed?.toFixed(1) || 0} m/s
              </span></p>
            )}
          </div>
          <div>
            {networkInfo && (
              <div className="text-sm">
                <p>Network: <span className="font-bold text-purple-400">{networkInfo.effectiveType}</span></p>
                <p>RTT: <span className="text-gray-400">{networkInfo.rtt}ms</span></p>
                <p>Downlink: <span className="text-gray-400">{networkInfo.downlink} Mbps</span></p>
              </div>
            )}
          </div>
        </div>
        {displayPositions.length > 0 && (
          <p className="text-xs mt-2">Latest Position: <span className="font-mono text-xs text-gray-400">
            {displayPositions[displayPositions.length - 1].latitude.toFixed(6)}, {displayPositions[displayPositions.length - 1].longitude.toFixed(6)}
          </span></p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Mode: {testPositions.length > 0 ? "🧪 Test Mode" : "🌍 Live GPS"} | 
          Updates: {tracking ? "🔄 Real-time" : "⏸️ Paused"}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">🗺️ Live Tracking Map</h3>
        <div className="bg-gray-800 p-2 rounded">
          <MapCanvas positions={displayPositions} />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>🟢 Start • 🔴 Path • 🔵 Current Position</span>
            <span>{tracking ? "📡 Live Updates" : "📍 Static View"}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <h3 className="font-bold mb-2">🧪 Testing Tools</h3>
        <p className="text-sm text-gray-400 mb-2">
          Add test points manually to see the line drawing. Try different coordinates around Bangalore:
        </p>
        <div className="flex gap-2 items-center mb-2">
          <input
            type="number"
            step="0.000001"
            placeholder="Latitude (e.g., 12.9716)"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="px-2 py-1 bg-gray-700 rounded text-sm flex-1"
          />
          <input
            type="number"
            step="0.000001"
            placeholder="Longitude (e.g., 77.5946)"
            value={manualLon}
            onChange={(e) => setManualLon(e.target.value)}
            className="px-2 py-1 bg-gray-700 rounded text-sm flex-1"
          />
          <button
            onClick={addManualPosition}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Add Point
          </button>
          <button
            onClick={clearTestPositions}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear
          </button>
        </div>
        <div className="text-xs text-gray-400">
          <p>Sample Bangalore coordinates:</p>
          <p>• MG Road: 12.9716, 77.5946</p>
          <p>• Koramangala: 12.9352, 77.6245</p>
          <p>• Whitefield: 12.9698, 77.7500</p>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <details>
          <summary>Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-800 rounded overflow-auto max-h-40">
            {JSON.stringify(displayPositions, null, 2)}
          </pre>
        </details>
      </div>
      </div>
      </div>
  );
}

export default App;