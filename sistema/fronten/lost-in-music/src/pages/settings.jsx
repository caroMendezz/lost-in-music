import React, { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { useLang } from "../components/Langcontext"; // Ajustá la ruta si es necesario

import ChangeEmail from "../components/settings/changeEmail";
import ChangePassword from "../components/settings/changePassword";
import DeleteAccount from "../components/settings/deleteAccount";

import "../styles/settings.css";

function Configuracion() {
  const { t } = useLang();
  const [user] = useState(null);

  return (
    <div className="pagina-configuracion">
      <Header user={user} />

      <main className="config-wrapper">
        <div className="config-main-card">
          <div className="config-header">
            <div className="config-title">
              <h1>{t.settings.title}</h1>
              <p className="subtitle">
                {t.settings.subtitle}
              </p>
            </div>
          </div>

          <div className="config-grid">
            <div className="left-col">
              <ChangeEmail />
              <ChangePassword />
              <DeleteAccount />
            </div>

            <aside className="right-col" aria-label="Panel secundario">
              <div className="sticky-aside">
                <div className="card help-card">
                  <h4>{t.settings.helpTitle}</h4>
                  <p className="muted small">
                    {t.settings.helpText}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Configuracion;