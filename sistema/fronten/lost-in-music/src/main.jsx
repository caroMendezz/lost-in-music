import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';

import './index.css';

import App from './App.jsx';
import { LangProvider } from './components/LangContext';

import AccesoLayout from './pages/AccesoLayout';
import Acceso from './pages/registerlogin/registerlogin';
import UserProfilePage from './pages/userProfilePage';
import UserOtherProfilePage from './pages/UserOtherProfilePage';
import UserOtherProfilePageAdmin from './pages/OtherUserProfilePageAdmin';

// --- INTERCEPTOR GLOBAL DE FETCH (Para expulsar baneados) ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  // Si el backend responde 403 y el código es USER_BANNED
  if (response.status === 403) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.code === 'USER_BANNED') {
        alert(data.message); // Le mostramos por qué lo echamos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('idRole');
        window.location.href = '/acceso'; // Lo mandamos al login
      }
    } catch (e) {
      // Si la respuesta no es un JSON válido (ej. error de red), ignoramos
    }
  }
  return response;
};
// -------------------------------------------------------------

function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path === '/acceso') {
      document.title = 'Lost In Music - Acceso';
    } else if (path === '/reset-password') {
      document.title = 'Lost In Music - Recuperar contraseña';
    } else if (path === '/perfil') {
      document.title = 'Lost In Music - Mi perfil';
    } else if (path.startsWith('/perfil/')) {
      document.title = 'Lost In Music - Perfil de usuario';
    } else if (path.startsWith('/admin/perfil/')) {
      document.title = 'Lost In Music - Admin · Perfil de usuario';
    }
    else {
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
        path: '/perfil/:userId',
        element: <UserOtherProfilePage />,
      },
      {
        path: '/admin/perfil/:userId',
        element: <UserOtherProfilePageAdmin />,
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