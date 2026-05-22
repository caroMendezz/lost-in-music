import { useState } from 'react';
import Login from '../../components/Login';
import Register from '../../components/Register';

export default function Acceso() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <>
      {showLogin ? (
        <Login goToRegister={() => setShowLogin(false)} />
      ) : (
        <Register goToLogin={() => setShowLogin(true)} />
      )}
    </>
  );
}