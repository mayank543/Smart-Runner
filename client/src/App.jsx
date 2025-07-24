import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { SignIn, SignUp, SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/clerk-react";

import MapCanvas from "./components/MapCanvas";
import TrackerDashboard from "./components/TrackerDashboard";
import useGeoTracker from "./hooks/useGeoTracker";
import History from "./components/History";

function App() {
  const [tracking, setTracking] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const { positions, error, status, networkInfo } = useGeoTracker(tracking);
  const [sessionPositions, setSessionPositions] = useState([]);

  useEffect(() => {
    if (tracking) {
      if (sessionPositions.length === 0 && positions.length === 0) {
        setSessionStartTime(Date.now());
      }
      setSessionPositions(positions);
    } else {
      setSessionPositions([]);
    }
  }, [tracking, positions]);

  return (
    <Router>
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-green-400 flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Smart Runner
          </h1>

          {/* Show different content based on authentication status */}
          <SignedIn>
            {/* Navigation for authenticated users */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-6 text-sm text-gray-300">
                <Link to="/" className="hover:underline">
                  Live Tracker
                </Link>
                <Link to="/history" className="hover:underline">
                  Run History
                </Link>
              </div>
              
              {/* User button for sign out */}
              <div className="flex items-center gap-4">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
            </div>

            {/* Protected Routes */}
            <Routes>
              <Route
                path="/"
                element={
                  <TrackerDashboard
                    tracking={tracking}
                    setTracking={setTracking}
                    sessionStartTime={sessionStartTime}
                    sessionPositions={sessionPositions}
                    error={error}
                    status={status}
                    networkInfo={networkInfo}
                  />
                }
              />
              <Route path="/history" element={<History />} />
              {/* Redirect auth routes to home when signed in */}
              <Route path="/sign-in/*" element={<RedirectToHome />} />
              <Route path="/sign-up/*" element={<RedirectToHome />} />
            </Routes>
          </SignedIn>

          <SignedOut>
            {/* Authentication Routes */}
            <Routes>
              <Route
                path="/"
                element={
                  <div className="text-center py-12">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold mb-4">Welcome to Smart Runner</h2>
                      <p className="text-gray-300 mb-8">Track your runs with precision. Sign in to get started.</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <Link 
                        to="/sign-in" 
                        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/sign-up" 
                        className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                }
              />
              <Route
                path="/sign-in/*"
                element={
                  <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="w-full max-w-md">
                      <SignIn 
                        routing="path" 
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        redirectUrl="/"
                        appearance={{
                          elements: {
                            formButtonPrimary: "bg-green-600 hover:bg-green-700",
                            card: "bg-slate-800 border-slate-700",
                            headerTitle: "text-white",
                            headerSubtitle: "text-gray-300",
                            socialButtonsBlockButton: "border-slate-600 text-white hover:bg-slate-700",
                            formFieldLabel: "text-gray-300",
                            formFieldInput: "bg-slate-700 border-slate-600 text-white",
                            footerActionLink: "text-green-400 hover:text-green-300"
                          }
                        }}
                      />
                    </div>
                  </div>
                }
              />
              <Route
                path="/sign-up/*"
                element={
                  <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="w-full max-w-md">
                      <SignUp 
                        routing="path" 
                        path="/sign-up"
                        signInUrl="/sign-in"
                        redirectUrl="/"
                        appearance={{
                          elements: {
                            formButtonPrimary: "bg-green-600 hover:bg-green-700",
                            card: "bg-slate-800 border-slate-700",
                            headerTitle: "text-white",
                            headerSubtitle: "text-gray-300",
                            socialButtonsBlockButton: "border-slate-600 text-white hover:bg-slate-700",
                            formFieldLabel: "text-gray-300",
                            formFieldInput: "bg-slate-700 border-slate-600 text-white",
                            footerActionLink: "text-green-400 hover:text-green-300"
                          }
                        }}
                      />
                    </div>
                  </div>
                }
              />
              {/* Redirect protected routes to sign-in when not authenticated */}
              <Route path="/history" element={<RedirectToSignIn />} />
              <Route path="*" element={<RedirectToSignIn />} />
            </Routes>
          </SignedOut>
        </div>
      </div>
    </Router>
  );
}

// Helper component to redirect to home when already signed in
function RedirectToHome() {
  useEffect(() => {
    window.location.href = '/';
  }, []);
  return null;
}

export default App;