import { useState } from 'react';
import Login from '../../components/login';
import Register from '../../components/register';
import PasswordRecovery from '../../components/resetpassword';

export default function Acceso() {
  const [screen, setScreen] = useState('login');

  return (
    <>
      {screen === 'login' && (
        <Login
          goToRegister={() => setScreen('register')}
          goToResetPassword={() => setScreen('reset')}
        />
      )}

      {screen === 'register' && (
        <Register
          goToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'reset' && (
        <PasswordRecovery
          goToLogin={() => setScreen('login')}
        />
      )}
    </>
  );
}