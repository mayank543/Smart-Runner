import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";


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
      <div className="min-h-screen p-6 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-white flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Smart Runner
          </h1>

          <Routes>
            {/* Public routes */}
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );

  // Home page component
  function HomePage() {
    return (
      <>
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-6 text-sm text-gray-300">
            <Link to="/" className="hover:underline">
              Live Tracker
            </Link>
            <Link to="/history" className="hover:underline">
              Run History
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </div>
        </div>

        <TrackerDashboard
          tracking={tracking}
          setTracking={setTracking}
          sessionStartTime={sessionStartTime}
          sessionPositions={sessionPositions}
          error={error}
          status={status}
          networkInfo={networkInfo}
        />
      </>
    );
  }
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return children;
}

// Landing page for non-authenticated users
function LandingPage() {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome to Smart Runner</h2>
        <p className="text-gray-300 mb-8">
          Track your runs with precision. Sign in to get started.
        </p>
      </div>
      <div className="flex gap-4 justify-center">
        <Link
          to="/sign-in"
          className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Sign In
        </Link>
        <Link
          to="/sign-up"
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

// Sign in page component
function SignInPage() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: "bg-white hover:bg-gray-200 text-black",
              card: "bg-zinc-900 border-zinc-800",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-300",
              socialButtonsBlockButton:
                "border-zinc-700 text-white hover:bg-zinc-800",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              footerActionLink: "text-white hover:text-gray-300",
            },
          }}
        />
      </div>
    </div>
  );
}

// Sign up page component
function SignUpPage() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: "bg-white hover:bg-gray-200 text-black",
              card: "bg-zinc-900 border-zinc-800",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-300",
              socialButtonsBlockButton:
                "border-zinc-700 text-white hover:bg-zinc-800",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              footerActionLink: "text-white hover:text-gray-300",
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
