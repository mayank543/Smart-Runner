import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const History = () => {
  const { getToken } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const token = await getToken();
        const res = await fetch("http://localhost:5000/api/runs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setRuns(data);
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [getToken]);

  if (loading) return <div className="p-4 text-center">Loading runs...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🏃‍♂️ Your Run History</h2>

      {runs.length === 0 ? (
        <p>No runs yet. Start running!</p>
      ) : (
        <div className="space-y-4">
          {runs.map((run, idx) => (
            <div
              key={run._id || idx}
              className="bg-white shadow-md rounded-xl p-4 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">
                    {run.distance} km @ {run.averageSpeed} km/h
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {(run.duration / 60).toFixed(2)} mins
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(run.date).toLocaleString()}
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