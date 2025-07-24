// components/History.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react"; // 👈 Import useAuth from Clerk
import { 
  Clock, 
  Gauge, 
  MapPin, 
  Timer, 
  Activity, 
  TrendingUp,
  Calendar,
  Route,
  BarChart3,
  Zap,
  Navigation2
} from "lucide-react";
import MapCanvas from "./MapCanvas";

// Utility functions (same as in TrackerDashboard)
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

function formatSpeed(kmh) {
  // Handle undefined, null, or NaN values
  if (!kmh || isNaN(kmh)) return '0.0 km/h';
  return `${kmh.toFixed(1)} km/h`;
}

function formatDuration(durationInSeconds) {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

function calculatePace(distance, duration) {
  // Calculate pace in min/km
  if (distance <= 0) return "N/A";
  const paceMinutes = duration / 60 / (distance / 1000);
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.floor((paceMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

function RunCard({ run, index, onToggleDetails, isExpanded }) {
  const runDate = new Date(run.createdAt);
  
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
      <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-400/50 transition-all duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Run #{index + 1}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <Calendar className="h-4 w-4" />
                {runDate.toLocaleDateString()} at {runDate.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => onToggleDetails(run._id)}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatDistance(run.distance)}
              </div>
              <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                Distance
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatDuration(run.duration)}
              </div>
              <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                <Timer className="h-4 w-4" />
                Duration
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatSpeed(run.avgSpeed)}
              </div>
              <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                <Gauge className="h-4 w-4" />
                Avg Speed
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {calculatePace(run.distance, run.duration)}
              </div>
              <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Pace
              </div>
            </div>
          </div>
        </div>

        {/* Detailed View */}
        {isExpanded && (
          <div className="p-6 space-y-6">
            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{backgroundColor: '#181818'}} className="rounded-lg p-4 border border-slate-700/50">
                <div className="text-purple-400 font-semibold text-lg flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  {run.path ? run.path.length : 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">GPS Points</div>
              </div>
              
              <div style={{backgroundColor: '#181818'}} className="rounded-lg p-4 border border-slate-700/50">
                <div className="text-blue-400 font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {run.maxSpeed ? formatSpeed(run.maxSpeed) : 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">Max Speed</div>
              </div>
              
              <div style={{backgroundColor: '#181818'}} className="rounded-lg p-4 border border-slate-700/50">
                <div className="text-orange-400 font-semibold text-lg flex items-center gap-2">
                  <Navigation2 className="h-5 w-5" />
                  {run.calories ? `${run.calories} cal` : 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">Est. Calories</div>
              </div>
            </div>

            {/* Route Map */}
            {run.path && run.path.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-green-400 text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Map
                </h4>
                <div style={{backgroundColor: '#181818'}} className="rounded-lg p-4 border border-slate-700/50">
                  <MapCanvas positions={run.path} />
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Start</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Route</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Finish</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      {run.path.length} GPS points recorded
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Breakdown */}
            <div className="space-y-4">
              <h4 className="font-bold text-green-400 text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Summary
              </h4>
              <div style={{backgroundColor: '#181818'}} className="rounded-lg p-4 border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-2">Session Details:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Start Time:</span>
                        <span className="text-white">{runDate.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">End Time:</span>
                        <span className="text-white">
                          {new Date(runDate.getTime() + run.duration * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Points:</span>
                        <span className="text-white">{run.path ? run.path.length : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-2">Calculated Stats:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Avg Pace:</span>
                        <span className="text-white">{calculatePace(run.distance, run.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Distance Type:</span>
                        <span className="text-white">
                          {run.distance >= 5000 ? 'Long Run' : run.distance >= 2000 ? 'Medium Run' : 'Short Run'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Performance:</span>
                        <span className={`${run.avgSpeed >= 12 ? 'text-green-400' : run.avgSpeed >= 8 ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {run.avgSpeed >= 12 ? 'Excellent' : run.avgSpeed >= 8 ? 'Good' : 'Moderate'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const { getToken } = useAuth(); // 👈 Call useAuth at component level
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState(null);
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    avgSpeed: 0
  });

  useEffect(() => {
    async function fetchRuns() {
      try {
        const token = await getToken(); // 👈 Now getToken is available

        const response = await fetch("http://localhost:3000/api/runs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch runs");
        const data = await response.json();
        setRuns(data);

        // Calculate overall stats
        if (data.length > 0) {
          const totalDistance = data.reduce((sum, run) => sum + run.distance, 0);
          const totalDuration = data.reduce((sum, run) => sum + run.duration, 0);
          const avgSpeed = data.reduce((sum, run) => sum + run.avgSpeed, 0) / data.length;

          setStats({
            totalRuns: data.length,
            totalDistance,
            totalDuration,
            avgSpeed,
          });
        }
      } catch (error) {
        console.error("Fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, [getToken]); // 👈 Add getToken to dependency array

  const handleToggleDetails = (runId) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 flex items-center gap-2">
          <Activity className="h-5 w-5 animate-spin" />
          Loading run history...
        </div>
      </div>
    );
  }

  if (!runs.length) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-2">No runs recorded yet!</p>
        <p className="text-gray-500 text-sm">Start your first running session to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-xl blur opacity-30"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-green-400 mb-1">{stats.totalRuns}</div>
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Total Runs
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-cyan-500/20 rounded-xl blur opacity-30"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-blue-400 mb-1">{formatDistance(stats.totalDistance)}</div>
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Total Distance
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-30"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-purple-400 mb-1">{formatDuration(stats.totalDuration)}</div>
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <Timer className="h-4 w-4" />
              Total Time
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-xl blur opacity-30"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold text-orange-400 mb-1">{formatSpeed(stats.avgSpeed)}</div>
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              Avg Speed
            </div>
          </div>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Recent Runs
        </h2>
        
        {runs.map((run, index) => (
          <RunCard
            key={run._id}
            run={run}
            index={index}
            onToggleDetails={handleToggleDetails}
            isExpanded={expandedRun === run._id}
          />
        ))}
      </div>
    </div>
  );
}