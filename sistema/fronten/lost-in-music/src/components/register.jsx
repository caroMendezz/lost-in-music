import { useState, useRef, useEffect } from 'react';
import "../styles/register.css";

import FondoAcceso from "./FondoAcceso";

const calcPasswordStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabel = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const strengthColor = ['', '#f06060', '#f0a060', '#f0d060', '#80cc60', '#4cce8a'];

const GENEROS = [
  { id: 'Masculino', label: 'Masculino', icon: '♂' },
  { id: 'Femenino', label: 'Femenino', icon: '♀' },

  { id: 'Otro', label: 'Otro', icon: '✦' },
  { id: 'PrefieroNoDecir', label: 'Prefiero no decir', icon: '—' },
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function Register({ goToLogin }) {

  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState('idle');


  const [formData, setFormData] = useState({
    nombreUsuario: '',
    email: '',
    password: '',
    confirmPwd: '',
    genero: '',
    dia: '',
    mes: '',
    anio: '',
    fotoPerfil: null,
    fotoPreview: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});


  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (name) => setTouched((p) => ({ ...p, [name]: true }));


  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setFormData((p) => ({ ...p, fotoPerfil: file, fotoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removePhoto = () =>
    setFormData((p) => ({ ...p, fotoPerfil: null, fotoPreview: null }));


  const errors = {
    nombreUsuario: formData.nombreUsuario.trim().length < 3,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    password: formData.password.length < 8,
    confirmPwd: formData.password !== formData.confirmPwd || !formData.confirmPwd,
  };

  const card1Valid = !Object.values(errors).some(Boolean);


  const goToStep2 = () => {
    setTouched({ nombreUsuario: true, email: true, password: true, confirmPwd: true });
    if (!card1Valid) return;

    setSlideDir('toLeft');
    setTimeout(() => {
      setStep(1);
      setSlideDir('idle');
    }, 420);
  };

  const goToStep1 = () => {
    setSlideDir('toRight');
    setTimeout(() => {
      setStep(0);
      setSlideDir('idle');
    }, 420);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const click = new Audio('/soundClick.mp3');
    click.volume = 0.1;
    click.play();

    const birthDate =
      `${formData.anio}-${String(formData.mes).padStart(2, '0')}-${String(formData.dia).padStart(2, '0')}`;

    console.log(birthDate);

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.nombreUsuario,
          email: formData.email,
          password: formData.password,
          gender: formData.genero,
          birthDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Usuario registrado correctamente");
      goToLogin();

    } catch (error) {
      console.error(error);
      alert("Error al registrar usuario");
    }
  };

  const pwdStrength = calcPasswordStrength(formData.password);

  const sliderClass = `reg-slider ${slideDir !== 'idle' ? `reg-slider--${slideDir}` : ''}`;

  return (
    <div className="register-card">


      <div className="reg-progress-wrap">
        <div className="reg-progress-track">
          <div
            className="reg-progress-fill"
            style={{ width: step === 0 ? '50%' : '100%' }}
          />
        </div>
        <div className="reg-step-labels">
          <span className={`reg-step-label ${step === 0 ? 'active' : 'done'}`}>
            {step > 0 ? '✓' : '1'} Crear cuenta
          </span>
          <span className={`reg-step-label ${step === 1 ? 'active' : ''}`}>
            2 Perfil
          </span>
        </div>
      </div>


      <div className="register-logo-wrapper">
        <div className="register-logo">
          <img src="/logoo.png" alt="Logo" className="register-logo-img" />
        </div>
      </div>
      <h1 className="register-title">Lost In Music</h1>
      <p className="register-subtitle">Tu red social musical</p>
      <h2 class="register-section-title">Registrate</h2>


      <div className="reg-slider-viewport">
        <div className={sliderClass} data-step={step} ref={sliderRef}>

          {/*CARD 1 - CREAR CUENTA*/}
          <div className="reg-panel">
            <form onSubmit={(e) => { e.preventDefault(); goToStep2(); }}>


              <Field
                label="Nombre de usuario"
                icon={<UserIcon />}
                error={touched.nombreUsuario && errors.nombreUsuario ? 'Mínimo 3 caracteres' : null}
                valid={!errors.nombreUsuario && !!formData.nombreUsuario}
              >
                <input
                  name="nombreUsuario"
                  type="text"
                  className={`register-input ${touched.nombreUsuario && errors.nombreUsuario ? 'input-error' : ''}`}
                  placeholder="Tu nombre de usuario"
                  value={formData.nombreUsuario}
                  onChange={handleChange}
                  onBlur={() => handleBlur('nombreUsuario')}
                  autoComplete="username"
                />
              </Field>


              <Field
                label="Email"
                icon={<MailIcon />}
                error={touched.email && errors.email ? 'Email inválido' : null}
                valid={!errors.email && !!formData.email}
              >
                <input
                  name="email"
                  type="email"
                  className={`register-input ${touched.email && errors.email ? 'input-error' : ''}`}
                  placeholder="hola@musica.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  autoComplete="email"
                />
              </Field>


              <Field
                label="Contraseña"
                icon={<LockIcon />}
                error={touched.password && errors.password ? 'Usá 8+ caracteres, mayúscula, número y símbolo' : null}
                valid={!errors.password && !!formData.password}
                hasToggle={!!formData.password}
              >
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`register-input input-with-toggle ${touched.password && errors.password ? 'input-error' : ''
                    }`}
                  placeholder="Crea una contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  autoComplete="new-password"
                />

                {formData.password && (
                  <EyeBtn
                    show={showPassword}
                    toggle={() => setShowPassword((p) => !p)}
                  />
                )}
              </Field>


              {formData.password && (
                <div className="pwd-strength-wrap">
                  <div className="pwd-strength-bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="pwd-bar"
                        style={{
                          background: i <= pwdStrength ? strengthColor[pwdStrength] : 'rgba(0,0,0,0.08)',
                          transition: `background 0.3s ease ${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="pwd-strength-label"
                    style={{ color: strengthColor[pwdStrength] }}
                  >
                    {strengthLabel[pwdStrength]}
                  </span>
                </div>
              )}



              <Field
                label="Confirmar contraseña"
                icon={<LockIcon />}
                error={
                  touched.confirmPwd && errors.confirmPwd
                    ? 'Las contraseñas no coinciden'
                    : null
                }
                valid={!errors.confirmPwd && !!formData.confirmPwd}
                hasToggle={!!formData.confirmPwd}
              >
                <input
                  name="confirmPwd"
                  type={showConfirm ? 'text' : 'password'}
                  className={`register-input input-with-toggle ${touched.confirmPwd && errors.confirmPwd ? 'input-error' : ''
                    }`}
                  placeholder="Repetí la contraseña"
                  value={formData.confirmPwd}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPwd')}
                  autoComplete="new-password"
                />

                {formData.confirmPwd && (
                  <EyeBtn
                    show={showConfirm}
                    toggle={() => setShowConfirm((p) => !p)}
                  />
                )}
              </Field>
              <button type="submit" className="register-btn register-btn--continue">
                Continuar
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            <p className="register-login-link">
              ¿Ya tenes cuenta?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goToLogin();
                }}
              >
                Inicia sesión
              </a>
            </p>
          </div>


          {/* CARD 2 — PERFIL */}
          <div className="reg-panel">
            <form onSubmit={handleSubmit}>


              <div className="reg-section-title">Foto de perfil <span className="reg-optional">(opcional)</span></div>
              <div className="photo-area">
                <div
                  className="photo-circle"
                  onClick={() => fileInputRef.current?.click()}
                  title="Subir foto"
                >
                  {formData.fotoPreview ? (
                    <img src={formData.fotoPreview} alt="preview" className="photo-preview" />
                  ) : (
                    <div className="photo-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="#a0c8e8" strokeWidth="1.8" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a0c8e8" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  <div className="photo-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFile}
                />
                <div className="photo-actions">
                  <button type="button" className="photo-btn photo-btn--upload" onClick={() => fileInputRef.current?.click()}>
                    Subir imagen
                  </button>
                  {formData.fotoPreview && (
                    <button type="button" className="photo-btn photo-btn--remove" onClick={removePhoto}>
                      Quitar
                    </button>
                  )}
                  <p className="photo-hint">PNG, JPG hasta 5MB</p>
                </div>
              </div>


              <div className="reg-section-title" style={{ marginTop: 18 }}>Género</div>
              <div className="genero-grid">
                {GENEROS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`genero-btn ${formData.genero === g.id ? 'genero-btn--active' : ''}`}
                    onClick={() => setFormData((p) => ({ ...p, genero: g.id }))}
                  >
                    <span className="genero-icon">{g.icon}</span>
                    <span className="genero-label">{g.label}</span>
                  </button>
                ))}
              </div>

              <div className="reg-section-title" style={{ marginTop: 18 }}>
                Fecha de nacimiento
              </div>
              <div className="dob-row">

                <div className="dob-select-wrap">
                  <label className="dob-label">Día</label>
                  <div className="custom-select-wrap">
                    <select
                      name="dia"
                      className="custom-select"
                      value={formData.dia}
                      onChange={handleChange}
                    >
                      <option value="">—</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </div>
                </div>


                <div className="dob-select-wrap dob-select-wrap--mes">
                  <label className="dob-label">Mes</label>
                  <div className="custom-select-wrap">
                    <select
                      name="mes"
                      className="custom-select"
                      value={formData.mes}
                      onChange={handleChange}
                    >
                      <option value="">—</option>
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </div>
                </div>


                <div className="dob-select-wrap">
                  <label className="dob-label">Año</label>
                  <div className="custom-select-wrap">
                    <select
                      name="anio"
                      className="custom-select"
                      value={formData.anio}
                      onChange={handleChange}
                    >
                      <option value="">—</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              </div>


              <div className="reg-btns-row">
                <button type="button" className="register-btn register-btn--back" onClick={goToStep1}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                    <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Volver
                </button>
                <button type="submit" className="register-btn register-btn--final">
                  Crear cuenta ✦
                </button>
              </div>

            </form>
          </div>


        </div>
      </div>

    </div>

  );
}

function Field({ label, icon, error, valid, children, hasToggle }) {
  return (
    <div className="register-field-group">
      <label className="register-label">{label}</label>

      <div className={`register-input-wrapper ${hasToggle ? 'has-toggle' : ''}`}>
        <span className="register-input-icon">{icon}</span>

        {children}

        {valid && (
          <span className="input-status-icon input-check">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#4cce8a" />
              <path
                d="M7 12.5l3.5 3.5 6.5-7"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}

        {error && (
          <span className="input-status-icon input-cross">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#f06060" />
              <path
                d="M8 8l8 8M16 8l-8 8"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </div>

      {error && <p className="register-hint hint-error">{error}</p>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" className="password-toggle" onClick={toggle} tabIndex={-1}
      title={show ? 'Ocultar' : 'Mostrar'}>
      {show ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" stroke="#7ab8d8" strokeWidth="2" />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
          <line x1="1" y1="1" x2="23" y2="23" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function ChevronDown() {
  return (
    <span className="select-chevron">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="#5a90b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#7ab8d8" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#7ab8d8" strokeWidth="2" />
      <path d="M3 7l9 6 9-6" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#7ab8d8" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 118 0v4" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}