import React from 'react';
import ReactDOM from 'react-dom/client';
import AccesoLayout from './pages/AccesoLayout';
import './index.css';

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';

import Acceso from './pages/registerlogin/registerlogin';
import PasswordRecovery from './components/resetpassword';

import { useEffect } from 'react';


function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path === '/acceso') {
      document.title = 'Lost In Music - Acceso';
    } else if (path === '/reset-password') {
      document.title = 'Lost In Music - Recuperar contraseña';
    } else {
      document.title = 'Lost In Music';
    }
  }, [location]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <TitleManager />,
    children: [
      {
        element: <AccesoLayout />,
        children: [
          {
            path: '/acceso',
            element: <Acceso />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);