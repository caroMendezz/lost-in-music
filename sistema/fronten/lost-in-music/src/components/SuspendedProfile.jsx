import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SuspendedProfile.css';

function SuspendedProfile() {
  const navigate = useNavigate();

  return (
    <main className="suspended-container">
      <div className="suspended-card">
        <div className="suspended-icon">🚫</div>
        <h1>Cuenta suspendida</h1>
        <p>
          Esta cuenta ha sido suspendida temporalmente por infringir las normas de la comunidad.
          Sus publicaciones y mensajes están ocultos.
        </p>
        <button className="suspended-btn" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    </main>
  );
}

export default SuspendedProfile;