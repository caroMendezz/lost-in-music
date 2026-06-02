import { useState } from 'react';
import Login from '../../components/login';
import Register from '../../components/register';
import FondoAcceso from '../../components/FondoAcceso';

export default function Acceso() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <FondoAcceso>
      {showLogin ? (
        <Login goToRegister={() => setShowLogin(false)} />
      ) : (
        <Register goToLogin={() => setShowLogin(true)} />
      )}
    </FondoAcceso>
  );
}