import { useEffect, useState } from "react";
import { Map, Zap, Timer, Navigation } from "lucide-react";
import axios from "axios";

const History = () => {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await axios.get("/api/runs", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setRuns(res.data);
      } catch (err) {
        console.error("Error fetching runs:", err);
      }
    };

    fetchRuns();
  }, []);

  const formatDistance = (km) => `${km.toFixed(2)} km`;
  const formatSpeed = (kmh) => `${kmh.toFixed(1)} km/h`;
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-white">
      <h2 className="text-3xl font-bold mb-6 text-green-400 flex items-center gap-3">
        <Map className="h-7 w-7" />
        Run History
      </h2>

      {runs.length === 0 ? (
        <p className="text-gray-400">No runs yet. Go track one!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {runs.map((run) => (
            <div
              key={run._id}
              className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 hover:border-green-400/50 transition duration-300"
            >
              <p className="text-gray-400 text-sm mb-2">
                {new Date(run.date).toLocaleString()}
              </p>
              <div className="text-white text-lg font-semibold mb-1 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-400" />
                {formatDistance(run.distance)}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Avg Speed: {formatSpeed(run.averageSpeed)}
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-400" />
                  Time: {formatDuration(run.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;