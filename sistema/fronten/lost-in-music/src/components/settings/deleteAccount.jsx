// File: src/components/settings/DeleteAccount.jsx
import React, { useState } from 'react';

function DeleteAccount() {
  const [confirmText, setConfirmText] = useState('');

  return (
    <section className="config-section danger">
      <h3>Eliminar cuenta</h3>

      <p className="muted">
        Eliminar tu cuenta es irreversible. Recomendamos desactivarla o exportar
        los datos antes.
      </p>

      <form className="config-form">
        <label>
          Escribe <strong>ELIMINAR</strong> para confirmar
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-danger">
            Eliminar cuenta
          </button>
        </div>
      </form>
    </section>
  );
}

export default DeleteAccount;