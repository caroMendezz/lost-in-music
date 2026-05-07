// Register.jsx
import { useState, useRef, useEffect } from 'react';
import './Register.css';
import MusicPlayerMini from './MusicPlayerMini';

export default function Register({ onLoginClick }) {
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword]   = useState(false);
  const [nombreValido, setNombreValido]   = useState(false);
  const [nombreTouched, setNombreTouched] = useState(false);
  const [isPlaying, setIsPlaying]         = useState(false);

  const bgMusicRef = useRef(null);

  useEffect(() => {
    bgMusicRef.current = new Audio('/background-music.mp3');
    bgMusicRef.current.volume = 0.2;
    bgMusicRef.current.loop = true;
    bgMusicRef.current.preload = 'auto';

    const playAttempt = bgMusicRef.current.play();
    if (playAttempt !== undefined) {
      playAttempt
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.log('Autoplay bloqueado: El usuario debe interactuar primero.');
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

  const validarNombreUsuario = (valor) => {
    const palabras = valor.trim().split(/\s+/).filter((p) => p.length >= 2);
    return palabras.length >= 2;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'nombreUsuario') setNombreValido(validarNombreUsuario(value));
  };

  const handleNombreBlur = () => setNombreTouched(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clickAudio = new Audio('/soundClick.mp3');
    clickAudio.volume = 0.1;
    clickAudio.play();
    console.log('Datos de registro:', formData);
  };

  const showNombreError = nombreTouched && !nombreValido && formData.nombreUsuario.length > 0;

  return (
    <div className="register-bg">

      {/* ── Reproductor Frutiger Aero ── */}
      <MusicPlayerMini
        audioRef={bgMusicRef}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

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
            <img src="/logoo.png" alt="Logo Lost In Music" className="register-logo-img" />
          </div>
        </div>

        <h1 className="register-title">Lost In Music</h1>
        <p className="register-subtitle">Tu red social musical</p>

        <form onSubmit={handleSubmit}>

          {/* ── Nombre de usuario ── */}
          <div className="register-field-group">
            <label className="register-label" htmlFor="nombreUsuario">Nombre de Usuario</label>
            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#7ab8d8" strokeWidth="2" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="nombreUsuario"
                name="nombreUsuario"
                type="text"
                className={`register-input ${showNombreError ? 'input-error' : ''}`}
                placeholder="Tu nombre de usuario"
                value={formData.nombreUsuario}
                onChange={handleChange}
                onBlur={handleNombreBlur}
                autoComplete="name"
              />
              {nombreValido && (
                <span className="input-status-icon input-check">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#4cce8a" />
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {showNombreError && (
                <span className="input-status-icon input-cross">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#f06060" />
                    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </div>
            <p className={`register-hint ${showNombreError ? 'hint-error' : ''}`}>
              {showNombreError
                ? 'Ingresá un nombre de usuario para que puedan buscarte tus amigos/as.'
                : 'Ingresá un nombre de usuario para que puedan buscarte tus amigos/as.'}
            </p>
          </div>

          {/* ── Email ── */}
          <div className="register-field-group">
            <label className="register-label" htmlFor="email">Email</label>
            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#7ab8d8" strokeWidth="2" />
                  <path d="M3 7l9 6 9-6" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
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
            <p className="register-hint">Te vamos a mantener al tanto de las novedades y alertas del sitio.</p>
          </div>

          {/* ── Contraseña con ojito ── */}
          <div className="register-field-group">
            <label className="register-label" htmlFor="password">Contraseña</label>
            <div className="register-input-wrapper">
              <span className="register-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="#7ab8d8" strokeWidth="2" />
                  <path d="M8 11V7a4 4 0 118 0v4" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="register-input input-with-toggle"
                placeholder="Crea una contraseña"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#7ab8d8" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
            <p className="register-hint">Usá 8 o más caracteres combinando letras y números.</p>
          </div>

          <button type="submit" className="register-btn">Crear Cuenta</button>
        </form>

        <p className="register-login-link">
          ¿Ya tenes cuenta?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); if (onLoginClick) onLoginClick(); }}>
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
