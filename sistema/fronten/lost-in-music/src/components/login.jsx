import React, { useState, useEffect } from 'react';

function Login() {
  const [emailUser, setEmailUser] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    const originalMargin = document.body.style.margin;
    const originalPadding = document.body.style.padding;
    const originalBackground = document.body.style.backgroundColor;

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#8fd3ff';

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

    passwordWrapper: {
      position: 'relative',
      width: '100%',
    },

    passwordInput: {
      paddingRight: '3rem',
    },
    passwordToggle: {
      position: 'absolute',
      right: '0.85rem',
      top: '50%',
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },


    container: {
      minHeight: '100vh',
      width: '100%',
      background:
        'linear-gradient(180deg, #d9f2ff 0%, #83cff6 42%, #bfeeff 74%, #e9fff5 100%)',
      fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    },
    card: {
      maxWidth: '440px',
      width: '100%',
      position: 'relative',
      borderRadius: '28px',
      overflow: 'hidden',
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(220,245,255,0.82) 25%, rgba(190,232,252,0.78) 55%, rgba(210,242,255,0.92) 85%)',
      border: '1px solid rgba(140,190,235,0.60)',
      boxShadow:
        'inset 0 4px 22px rgba(255,255,255,0.95), inset 0 -8px 14px rgba(70,130,180,0.08), 0 12px 40px rgba(60,120,190,0.22)',
    },
    shine: {
      position: 'absolute',
      top: '8px',
      left: '5%',
      width: '90%',
      height: '22%',
      background: 'linear-gradient(180deg, rgba(230,244,252,0.72) 0%, transparent 100%)',
      borderRadius: '999px',
      filter: 'blur(2px)',
      pointerEvents: 'none',
    },
    bubbleOne: {
      position: 'absolute',
      width: '120px',
      height: '120px',
      top: '24px',
      left: '28px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0.05))',
      pointerEvents: 'none',
    },
    bubbleTwo: {
      position: 'absolute',
      width: '90px',
      height: '90px',
      top: '35px',
      right: '34px',
      borderRadius: '50%',
      background:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0.04))',
      pointerEvents: 'none',
    },
    inner: {
      position: 'relative',
      zIndex: 2,
      padding: '2rem 2rem 1.5rem',
    },
    logo: {
      width: '58px',
      height: '58px',
      margin: '0 auto 0.8rem',
      borderRadius: '50%',
      background:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.15)), linear-gradient(180deg, #9fe8ff 0%, #5fcdf5 45%, #60ccfb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid rgb(189,224,254)',
      boxShadow:
        'inset 0 2px 8px rgba(255,255,255,0.65), inset 0 -6px 10px rgba(0,0,0,0.08), 0 8px 18px rgba(80,180,240,0.30)',
      fontSize: '1.8rem',
    },
    logoTitle: {
      textAlign: 'center',
      fontSize: '1.65rem',
      fontWeight: 800,
      color: '#0b2a4c',
      margin: '0',
    },
    welcome: {
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#2874aa',
      marginTop: '0.15rem',
      fontWeight: 500,
    },
    sectionTitle: {
      fontSize: '1.35rem',
      fontWeight: 800,
      color: '#084c9b',
      marginBottom: '1.2rem',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: 700,
      color: '#084c9b',
    },
    input: {
      width: '100%',
      padding: '0.85rem 1rem',
      fontSize: '0.95rem',
      border: '1px solid rgba(140,190,230,0.35)',
      borderRadius: '13px',
      backgroundColor: 'rgba(255,255,255,0.68)',
      color: '#1a3a5c',
      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    inputFocus: {
      borderColor: '#5ab3e0',
      boxShadow: '0 0 0 3px rgba(90,179,224,0.14)',
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    hintText: {
      fontSize: '0.78rem',
      color: '#064979',
      marginTop: '0.1rem',
      fontWeight: 600,
    },
    forgotLink: {
      textAlign: 'right',
      marginTop: '-0.2rem',
    },
    link: {
      color: '#1e9fd4',
      fontSize: '0.86rem',
      fontWeight: 700,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    button: {
      width: '100%',
      marginTop: '0.45rem',
      padding: '0.9rem',
      border: 'none',
      borderRadius: '16px',
      background:
        'linear-gradient(180deg, #7fe3ff 0%, #45c8f4 35%, #1ea6df 70%, #1492cc 100%)',
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: 800,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow:
        'inset 0 2px 10px rgba(255,255,255,0.50), inset 0 -5px 10px rgba(0,0,0,0.07), 0 8px 18px rgba(20,146,204,0.26)',
    },
    registerLink: {
      textAlign: 'center',
      marginTop: '1.1rem',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(140,190,230,0.32)',
      fontSize: '0.88rem',
      color: '#2f536d',
    },
    footer: {
      position: 'relative',
      zIndex: 2,
      background: 'rgba(255,255,255,0.32)',
      padding: '1rem',
      textAlign: 'center',
      borderTop: '1px solid rgba(140,190,230,0.28)',
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      fontSize: '0.76rem',
      fontWeight: 700,
      color: '#3f5579',
    },
  };
  const getEmailInputStyle = () => ({
    ...styles.input,
  });

  const getPasswordInputStyle = () => ({
    ...styles.input,
    ...(isPasswordFocused ? styles.inputFocus : {}),
  });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.shine}></div>
        <div style={styles.bubbleOne}></div>
        <div style={styles.bubbleTwo}></div>

        <div style={styles.inner}>
          <div style={styles.logo}>♪</div>

          <h1 style={styles.logoTitle}>Lost In Music</h1>
          <div style={styles.welcome}>Tu red social musical</div>

          <h2 style={styles.sectionTitle}>Inicia Sesión</h2>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo electrónico o Usuario</label>
              <input
                type="text"
                style={getEmailInputStyle()}
                placeholder="tu@email.com"
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
                required
              />
              <div style={styles.hintText}>
                Usá tu email o nombre de usuario.
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>

              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{
                    ...getPasswordInputStyle(),
                    ...styles.passwordInput,
                  }}
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                />

                {password && (
                  <button
                    type="button"
                    style={styles.passwordToggle}
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="12" r="3" stroke="#7ab8d8" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <div style={styles.hintText}>Escribe tu contraseña</div>
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
      </div>
    </div>
  );
}

export default Login;