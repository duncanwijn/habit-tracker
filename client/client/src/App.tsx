import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import ProgressTracker from './pages/ProgressTracker.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/Signup.jsx'
import HomePage from './pages/HomePage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />, // Redirects the root path to /login
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />, // Placeholder for the dashboard page
  },
  {
    path: "/progress-tracker",
    element: <ProgressTracker />, // Placeholder for the progress tracker page
  },
  {
    path: "*",
    element: <div>404 Not Found</div>, // Fallback for undefined routes
  }
]);

function App() {
  console.log('[App] rendering');
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
  
}

export default App
