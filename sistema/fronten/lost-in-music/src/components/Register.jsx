// Register.jsx
import { useState, useRef, useEffect } from 'react';
import './Register.css';

export default function Register({ onLoginClick }) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const bgMusicRef = useRef(null);

  useEffect(() => {
    // Inicialización del audio de fondo 
    bgMusicRef.current = new Audio('/background-music.mp3');
    bgMusicRef.current.volume = 0.2;
    bgMusicRef.current.loop = true;
    bgMusicRef.current.preload = 'auto';

    // Intento de reproducción automática (puede ser bloqueado por el navegador)
    const playAttempt = bgMusicRef.current.play();
    if (playAttempt !== undefined) {
      playAttempt
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.log("Autoplay bloqueado: El usuario debe interactuar primero.");
          setIsPlaying(false);
        });
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      bgMusicRef.current.pause();
    } else {
      bgMusicRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const clickAudio = new Audio('/soundClick.mp3');
    clickAudio.volume = 0.10;
    clickAudio.play();

    console.log('Datos de registro:', formData);
  };

  return (
    <div className="register-bg">
    {/* --- REPRODUCTOR MINI ESTILO RETRO --- */}
      <div className="music-player-mini">
        <div className="player-left-section">
          <button className="player-main-btn" onClick={toggleMusic} title={isPlaying ? "Pausar" : "Reproducir"}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="player-sub-controls">
            <span className="control-icon">+</span>
            <span className="control-icon">-</span>
          </div>
        </div>

        <div className="player-display-screen">
          <div className="screen-content">
            <span className="song-title">Speed of Sound</span>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-knob"></div>
              </div>
            </div>
            <div className="screen-footer">
              <span className="footer-icon">⇄</span>
              <span className="time-stamp">1:38</span>
              <span className="footer-icon">↻</span>
            </div>
          </div>
        </div>
      </div>
      {/* Bubbles decorativas */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />
      <div className="bubble bubble-4" />
      <div className="bubble bubble-5" />
      <div className="bubble bubble-6" />

      <div className="register-card">
        {/* Logo */}
        <div className="register-logo-wrapper">
          <div className="register-logo">
            <img
              src="/logoo.png"
              alt="Logo Lost In Music"
              className="register-logo-img"
            />
          </div>
        </div>

        {/* Encabezado */}
        <h1 className="register-title">Lost In Music</h1>
        <p className="register-subtitle">Tu red social musical</p>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="register-field-group">
            <label
              className="register-label"
              htmlFor="nombreCompleto"
            >
              Nombre Completo
            </label>

            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                className="register-input"
                placeholder="Tu nombre completo"
                value={formData.nombreCompleto}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            <p className="register-hint">
              Ingresá nombre y apellido para que tus amigos te reconozcan.
            </p>
          </div>

          {/* Email */}
          <div className="register-field-group">
            <label
              className="register-label"
              htmlFor="email"
            >
              Email
            </label>

            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                  />
                  <path
                    d="M3 7l9 6 9-6"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                id="email"
                name="email"
                type="email"
                className="register-input"
                placeholder="hola@hola.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <p className="register-hint">
              Te enviaremos novedades y alertas de actividad musical.
            </p>
          </div>

          {/* Password */}
          <div className="register-field-group">
            <label
              className="register-label"
              htmlFor="password"
            >
              Password
            </label>

            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="11"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 11V7a4 4 0 118 0v4"
                    stroke="#7ab8d8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                id="password"
                name="password"
                type="password"
                className="register-input"
                placeholder="Crea una contraseña"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <p className="register-hint">
              Usá 8 o más caracteres combinando letras y números.
            </p>
          </div>

          {/* Botón */}
          <button
            type="submit"
            className="register-btn"
          >
            Crear Cuenta
          </button>
        </form>

        {/* Link login */}
        <p className="register-login-link">
          ¿Ya tenes cuenta?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onLoginClick) onLoginClick();
            }}
          >
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}