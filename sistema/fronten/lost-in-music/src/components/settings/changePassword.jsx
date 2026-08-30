// File: src/components/settings/ChangePassword.jsx
import React, { useState } from 'react';

function ChangePassword() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  return (
    <section className="config-section">
      <h3>Cambiar contraseña</h3>

      <form className="config-form">
        <label>
          Contraseña actual
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Confirmar nueva contraseña
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Cambiar contraseña
          </button>
        </div>
      </form>
    </section>
  );
}

export default ChangePassword;