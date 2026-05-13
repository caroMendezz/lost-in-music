import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';


import Acceso from './pages/registerlogin/registerlogin';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
//import { ToastProvider } from './components/ToastProvider';

// Componente que gestiona el título de la página
function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/libro/")) {
      document.title = "NextRead - Detalle del libro";
    } else if (path === "/acceso") {
      document.title = "Lost-in-Vivo - Access";
    } else if (path === "/principal") {
      document.title = "NextRead - Página principal";
    } else if (path === "/perfil") {
      document.title = "NextRead - Mi perfil";
    } else if (path === "/perfil/editar") {
      document.title = "NextRead - Editar perfil";
    } else if (path === "/seguidores") {
      document.title = "NextRead - Seguidores";
    } else if (path === "/configuracion") {
      document.title = "NextRead - Configuracion";
    } else if (path === "/seguidos") {
      document.title = "NextRead - Seguidos";
    } else if (path === "/") {
      document.title = "NextRead - Inicio";
    } else if (path === "/reset-password") {
      document.title = "NextRead - Restablecer Contraseña";
    } else if (path === "/cookies") {
      document.title = "NextRead - Cookies";
    } else {
      document.title = "NextRead 📚";
    }
  }, [location]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <TitleManager />,
    children: [
      { path: "/acceso", element: <Acceso /> },
      // { path: "/acceso", element: <Acceso /> },
      
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <ToastProvider> */}
      <RouterProvider router={router} />
    {/* </ToastProvider> */}
  </React.StrictMode>
);