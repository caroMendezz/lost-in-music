import React, { useState, useEffect } from 'react';

function Login() {
  const [emailUser, setEmailUser] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Elimina el margen y padding del body al montar el componente
  useEffect(() => {
    // Guardar estilos originales por si acaso (opcional)
    const originalMargin = document.body.style.margin;
    const originalPadding = document.body.style.padding;
    const originalBackground = document.body.style.backgroundColor;
    
    // Forzar estilos para eliminar el borde blanco
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#0f0c29'; // Color que combine con el fondo del gradiente
    
    // Restaurar al desmontar (opcional, pero limpio)
    return () => {
      document.body.style.margin = originalMargin;
      document.body.style.padding = originalPadding;
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailUser || !password) {
      alert('Por favor completa todos los campos.');
      return;
    }
    alert(`Iniciando sesión como: ${emailUser}\n¡Bienvenid@ a Lost In Music!`);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Redirigiendo a la recuperación de contraseña...');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert('Redirigiendo al registro de nueva cuenta...');
  };

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1.5rem',
      margin: 0,
    },
    card: {
      maxWidth: '480px',
      width: '100%',
      background: '#000000cc',
      borderRadius: '2rem',
      boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
    },
    inner: {
      padding: '2rem 1.5rem 1.8rem',
    },
    logo: {
      textAlign: 'center',
      marginBottom: '0.5rem',
    },
    logoTitle: {
      fontSize: '2rem',
      fontWeight: 800,
      background: 'linear-gradient(135deg, #b224ef 0%, #7579ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.5px',
    },
    welcome: {
      textAlign: 'center',
      fontSize: '1.1rem',
      color: '#e2e8f0',
      marginBottom: '1.8rem',
      fontWeight: 500,
    },
    sectionTitle: {
      fontSize: '1.6rem',
      fontWeight: 700,
      color: '#ffffff',
      marginBottom: '1.5rem',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      alignItems: 'center',
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#cbd5e1',
      marginLeft: '0.25rem',
      alignSelf: 'flex-start',
      width: '90%',
    },
    input: {
      width: '90%',
      padding: '0.8rem 1.2rem',
      fontSize: '0.95rem',
      border: '1.5px solid #4a5568',
      borderRadius: '1.2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
      transition: 'all 0.2s',
      outline: 'none',
      margin: '0 auto',
    },
    inputFocus: {
      borderColor: '#b224ef',
      boxShadow: '0 0 0 3px rgba(178, 36, 239, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    hintText: {
      fontSize: '0.75rem',
      color: '#fbbf24',
      marginLeft: '0.75rem',
      marginTop: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      width: '90%',
    },
    forgotLink: {
      textAlign: 'right',
      marginTop: '-0.5rem',
      marginBottom: '0.5rem',
      width: '90%',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    link: {
      color: '#b224ef',
      fontSize: '0.85rem',
      fontWeight: 500,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    button: {
      background: 'linear-gradient(95deg, #b224ef 0%, #7579ff 100%)',
      border: 'none',
      padding: '0.9rem',
      borderRadius: '2rem',
      fontWeight: 700,
      fontSize: '1rem',
      color: 'white',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      marginTop: '0.5rem',
      width: '90%',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    registerLink: {
      textAlign: 'center',
      marginTop: '1.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid #334155',
      fontSize: '0.9rem',
      color: '#cbd5e1',
      width: '100%',
    },
    footer: {
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '1rem',
      textAlign: 'center',
      borderTop: '1px solid #334155',
      display: 'flex',
      justifyContent: 'center',
      gap: '1.2rem',
      flexWrap: 'wrap',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: '#a0aec0',
    },
  };

  const getInputStyle = () => ({
    ...styles.input,
    ...(isEmailFocused ? styles.inputFocus : {}),
  });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.inner}>
          <div style={styles.logo}>
            <h1 style={styles.logoTitle}>Lost In Music</h1>
          </div>
          <div style={styles.welcome}>Bienvenido/a de nuevo</div>
          <h2 style={styles.sectionTitle}>Inicia Sesión</h2>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo electrónico o Usuario</label>
              <input
                type="text"
                style={getInputStyle()}
                placeholder="tu@email.com"
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                required
              />
              {isEmailFocused && (
                <div style={styles.hintText}>
                  <span>💡</span> Completa este campo
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                style={styles.input}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={styles.forgotLink}>
              <a href="#" onClick={handleForgotPassword} style={styles.link}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" style={styles.button}>
              Iniciar Sesión
            </button>
          </form>

          <div style={styles.registerLink}>
            <span>¿No tenes cuenta? </span>
            <a href="#" onClick={handleRegister} style={styles.link}>
              Registrate
            </a>
          </div>
        </div>

        <div style={styles.footer}>
          <span>🎵 Comprar música</span>
          <span>🎤 Conecta con artistas</span>
          <span>🔊 Descubre nuevos sonidos</span>
        </div>
      </div>
    </div>
  );
}

export default Login;