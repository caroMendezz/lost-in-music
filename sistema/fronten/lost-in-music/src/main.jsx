
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';

import './index.css';

import App from './App.jsx';
import { LangProvider } from './components/LangContext';

import AccesoLayout from './pages/AccesoLayout';
import Acceso from './pages/registerlogin/registerlogin';
import UserProfilePage from './pages/userProfilePage';

function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path === '/acceso') {
      document.title = 'Lost In Music - Acceso';
    } else if (path === '/reset-password') {
      document.title = 'Lost In Music - Recuperar contraseña';
    } else if (path === '/perfil') {
      document.title = 'Lost In Music - Perfil';
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
      {
        path: '/perfil',
        element: <UserProfilePage />,
      },
      {
        path: '/*',
        element: <App />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <RouterProvider router={router} />
    </LangProvider>
  </React.StrictMode>
);
