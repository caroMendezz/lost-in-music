import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/help.css";

// Único medio de contacto con el equipo de desarrollo.
const CONTACT_EMAIL = "asan.santiagoet36@gmail.com";

/**
 * Página de ayuda con la información de contacto de los desarrolladores.
 * Se llega desde el enlace de /acceso o desde el botón del header.
 */
export default function HelpPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const loggedIn = Boolean(localStorage.getItem("token"));

  const handleBack = () => {
    // Si se llegó desde otra pantalla de la app, volvemos ahí; si se abrió
    // el link directamente, vamos al inicio que corresponda.
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(loggedIn ? "/feed" : "/acceso");
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      } else {
        // Alternativa para navegadores sin Clipboard API.
        const input = document.createElement("textarea");
        input.value = CONTACT_EMAIL;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, el mailto sigue disponible.
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  return (
    <main className="help-page">
      <div className="help-glow help-glow--one" aria-hidden="true" />
      <div className="help-glow help-glow--two" aria-hidden="true" />

      <button type="button" className="help-back" onClick={handleBack}>
        ← Volver
      </button>

      <section className="help-card" aria-labelledby="help-title">
        <div className="help-icon" aria-hidden="true">
          🎧
        </div>

        <h1 id="help-title">Ayuda y contacto</h1>

        <p className="help-intro">
          ¿Tenés un problema con tu cuenta, una publicación o un reporte? El
          equipo de desarrollo de Lost In Music puede ayudarte.
        </p>

        <div className="help-contact">
          <span className="help-contact-label">
            Contacto con los desarrolladores
          </span>

          <a
            className="help-email"
            href={`mailto:${CONTACT_EMAIL}`}
            title="Escribinos por correo"
          >
            {CONTACT_EMAIL}
          </a>

          <div className="help-contact-actions">
            <a className="help-btn help-btn--primary" href={`mailto:${CONTACT_EMAIL}`}>
              ✉️ Enviar correo
            </a>

            <button type="button" className="help-btn" onClick={handleCopy}>
              {copied ? "✔ Copiado" : "Copiar dirección"}
            </button>
          </div>
        </div>

        <ul className="help-topics">
          <li>Problemas para iniciar sesión o recuperar tu cuenta.</li>
          <li>Consultas sobre reportes y sanciones.</li>
          <li>Errores técnicos o contenido que no carga.</li>
          <li>Sugerencias para mejorar la red social.</li>
        </ul>

        <p className="help-note">
          Cuando escribas, contanos tu nombre de usuario y una descripción del
          problema para poder ayudarte más rápido.
        </p>
      </section>
    </main>
  );
}
