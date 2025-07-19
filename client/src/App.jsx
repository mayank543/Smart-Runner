import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import MapCanvas from './components/MapCanvas';
import TrackerDashboard from './components/TrackerDashboard';
import useGeoTracker from './hooks/useGeoTracker';

function App() {
  const [tracking, setTracking] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const { positions, error, status, networkInfo } = useGeoTracker(tracking);
  
  // Clear positions when starting new tracking session
  const [sessionPositions, setSessionPositions] = useState([]);
  
  useEffect(() => {
    if (tracking) {
      // Clear session when starting new tracking
      if (sessionPositions.length === 0 && positions.length === 0) {
        setSessionStartTime(Date.now());
      }
      setSessionPositions(positions);
    } else {
      // Clear positions when stopping tracking
      setSessionPositions([]);
    }
  }, [tracking, positions]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-green-400 flex items-center gap-3">
          <Activity className="h-8 w-8" />
          Smart Runner - Live GPS Tracker
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          Real-time GPS tracking using Web APIs: Geolocation • Canvas • Background Tasks • Intersection Observer • Network Information
        </p>
      
        <TrackerDashboard 
          tracking={tracking}
          setTracking={setTracking}
          sessionStartTime={sessionStartTime}
          sessionPositions={sessionPositions}
          error={error}
          status={status}
          networkInfo={networkInfo}
        />

        {/* <MapCanvas positions={sessionPositions} /> */}
      </div>
    </div>
  );
}

export default App;