import React, { useState } from 'react';

function ChangeEmail() {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <section className="config-section">
      <h3>Cambiar correo electrónico</h3>

      <form className="config-form">
        <label>
          Nuevo correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </label>

        <label>
          Confirmar correo
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Solicitar cambio
          </button>
        </div>
      </form>
    </section>
  );
}

export default ChangeEmail;