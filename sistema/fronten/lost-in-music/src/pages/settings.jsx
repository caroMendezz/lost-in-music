// File: src/pages/Configuracion.jsx
import React, { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";

import ChangeEmail from "../components/settings/ChangeEmail";
import ChangePassword from "../components/settings/ChangePassword";
import DeleteAccount from "../components/settings/DeleteAccount";

import "../styles/settings.css";

function Configuracion() {
  const [user] = useState(null);

  return (
    <div className="pagina-configuracion">
      <Header user={user} />

      <main className="config-wrapper">
        <div className="config-main-card">
          <div className="config-header">
            <div className="config-title">
              <h1>Configuración</h1>
              <p className="subtitle">
                Ajusta tu cuenta y la seguridad de tu perfil.
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
                  <h4>Ayuda rápida</h4>
                  <p className="muted small">
                    Desde esta sección podrás modificar la información de tu
                    cuenta cuando estas funciones estén disponibles.
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