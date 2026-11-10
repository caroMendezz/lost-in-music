import React, { useState } from 'react';
import { useLang } from '../Langcontext';

function DeleteAccount() {
  const { t } = useLang();
  const [confirmText, setConfirmText] = useState('');

  return (
    <section className="config-section danger">
      <h3>{t.settings.deleteAccount.title}</h3>

      <p className="muted">
        {t.settings.deleteAccount.warning}
      </p>

      <form className="config-form">
        <label>
          <span dangerouslySetInnerHTML={{ __html: t.settings.deleteAccount.typeToConfirm }} />
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t.settings.deleteAccount.placeholderConfirm}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-danger">
            {t.settings.deleteAccount.btnDelete}
          </button>
        </div>
      </form>
    </section>
  );
}

export default DeleteAccount;