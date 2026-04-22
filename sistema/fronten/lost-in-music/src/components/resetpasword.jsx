import React, { useState } from 'react';

const PasswordRecovery = () => {
  const [contact, setContact] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const contacto = contact.trim();
    
    if (contacto === "") {
      alert("Por favor ingresa tu correo electrónico o número de teléfono.");
      return;
    }
    
    const isEmailLike = contacto.includes('@') && contacto.includes('.');
    const isPhoneLike = /^[\+\d\s\-\(\)]{6,}$/.test(contacto) || /\d{6,}/.test(contacto);
    
    if (!isEmailLike && !isPhoneLike) {
      alert("Formato no reconocido. Asegúrate de usar un email válido o un número telefónico.");
      return;
    }
    
    alert(`✅ Hemos enviado un enlace de restablecimiento a ${contacto}.\n\nRevisa tu bandeja de entrada o mensajes.`);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    alert("🔐 Redirigiendo a la página de inicio de sesión.\n(Simulación - En una app real te llevaría al login)");
  };

  const styles = {
    // Reset global (usar en CSS global o módulo)
    container: {
      background: 'linear-gradient(145deg, #f3f5fc 0%, #eef2fa 100%)',
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1.5rem',
      margin: 0,
    },
    resetCard: {
      maxWidth: '500px',
      width: '100%',
      background: '#ffffff',
      borderRadius: '2rem',
      boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
    },
    cardInner: {
      padding: '2rem',
    },
    titleSection: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    mainTitle: {
      fontSize: '1.9rem',
      fontWeight: 700,
      color: '#121826',
      letterSpacing: '-0.3px',
      marginBottom: '0.5rem',
    },
    subMotto: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#4a5568',
      background: '#f0f4fe',
      display: 'inline-block',
      padding: '0.3rem 1rem',
      borderRadius: '40px',
      marginTop: '0.25rem',
    },
    dividerLight: {
      width: '60px',
      height: '3px',
      background: '#e2e8f0',
      margin: '1rem auto 1.5rem auto',
      borderRadius: '4px',
    },
    question: {
      textAlign: 'center',
      marginBottom: '1rem',
    },
    questionH2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1e293b',
      letterSpacing: '-0.2px',
    },
    helperText: {
      textAlign: 'center',
      color: '#5b6e8c',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
      marginBottom: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    resetForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: '#2d3a5e',
      marginLeft: '0.25rem',
    },
    inputField: {
      width: '100%',
      padding: '0.9rem 1.2rem',
      fontSize: '1rem',
      fontFamily: "'Inter', monospace",
      border: focused ? '1.5px solid #ff6b4a' : '1.5px solid #e2edf2',
      borderRadius: '1.5rem',
      backgroundColor: '#fefefe',
      transition: 'all 0.2s ease',
      outline: 'none',
      color: '#0f172a',
      fontWeight: 500,
      boxShadow: focused ? '0 0 0 3px rgba(255, 107, 74, 0.2)' : 'none',
    },
    fieldHint: {
      fontSize: '0.75rem',
      color: '#8596b5',
      marginLeft: '0.75rem',
      marginTop: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      opacity: focused ? 0.7 : 1,
    },
    submitBtn: {
      background: 'linear-gradient(95deg, #1e2f3f 0%, #16212e 100%)',
      border: 'none',
      padding: '0.9rem 1.5rem',
      borderRadius: '3rem',
      fontWeight: 700,
      fontSize: '1rem',
      fontFamily: "'Inter', sans-serif",
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.25s',
      marginTop: '0.5rem',
      letterSpacing: '0.3px',
      boxShadow: '0 6px 14px rgba(0, 0, 0, 0.08)',
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.9rem',
      color: '#334155',
      borderTop: '1px solid #ecf3f9',
      paddingTop: '1.5rem',
    },
    loginLinkA: {
      color: '#ff5e3a',
      fontWeight: 700,
      textDecoration: 'none',
      marginLeft: '0.3rem',
      transition: 'color 0.2s',
      borderBottom: '1px dashed #ffb6a5',
      cursor: 'pointer',
    },
    musicFooter: {
      background: '#fafcff',
      padding: '1.2rem 1.5rem',
      textAlign: 'center',
      borderTop: '1px solid #eef3fc',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '1.2rem',
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#3f5579',
      letterSpacing: '0.2px',
    },
    musicFooterSpan: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.resetCard}>
        <div style={styles.cardInner}>
          <div style={styles.titleSection}>
            <div style={styles.mainTitle}>Recuperar contraseña</div>
            <div style={styles.subMotto}>No te preocupes, te ayudaremos</div>
            <div style={styles.dividerLight}></div>
          </div>

          <div style={styles.question}>
            <h2 style={styles.questionH2}>¿Olvidaste tu contraseña?</h2>
          </div>
          <div style={styles.helperText}>
            Ingresa tu correo o teléfono para recibir un enlace de restablecimiento
          </div>

          <form style={styles.resetForm} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label htmlFor="contact" style={styles.label}>
                Correo electrónico o Número de teléfono
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                style={styles.inputField}
                placeholder="ejemplo@correo.com o +54 9 11 1234-5678"
                autoComplete="off"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <div style={styles.fieldHint}>
                <span>💡</span> tu@email.com o teléfono?
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>
              Enviar
            </button>
          </form>

          <div style={styles.loginLink}>
            ¿Recordaste la contraseña?{' '}
            <a href="#" onClick={handleLoginClick} style={styles.loginLinkA}>
              Inicia sesión
            </a>
          </div>
        </div>

        <div style={styles.musicFooter}>
          <span style={styles.musicFooterSpan}>🎵 Comparte música</span>
          <span style={styles.musicFooterSpan}>🎤 Conecta con artistas</span>
          <span style={styles.musicFooterSpan}>🔊 Descubre nuevos sonidos</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecovery;