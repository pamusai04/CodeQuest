import { Routes, Route, Navigate } from 'react-router';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Homepage from './pages/Homepage';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './authSlice';
import { useEffect, useRef } from 'react';
import AdminPanel from './components/AdminPanel';
import ProblemPage from './pages/ProblemPage';
import Admin from './pages/Admin';
import AdminDelete from './components/AdminDelete';
import UpdateProblem from './components/UpdateProblem';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      dispatch(checkAuth());
    }
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-ping absolute"></div>
            <div className="w-20 h-20 border-4 border-t-blue-600 border-r-purple-600 border-b-blue-600 border-l-purple-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CodeQuest
            </h2>
            <p className="text-gray-600 font-medium">Loading your experience...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Homepage /> : <Navigate to="/signup" />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route
        path="/admin/create"
        element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />}
      />
      <Route
        path="/admin/delete"
        element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />}
      />
      <Route path="/problem/:problemId" element={<ProblemPage />} />
      <Route
        path="/admin/update/:id"
        element={isAuthenticated && user?.role === 'admin' ? <UpdateProblem /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;