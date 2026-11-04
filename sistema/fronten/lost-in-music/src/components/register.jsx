import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/http';
import { useLang } from './LangContext';
import LangSelector from './LangSelector';
import '../styles/Register.css';
import MusicPlayerMini from './MusicPlayerMini';
import ImageCropperModal from './ImageCropperModal';

const calcPasswordStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthColor = ['', '#f06060', '#f0a060', '#f0d060', '#80cc60', '#4cce8a'];

// El modelo User guarda el género como ENUM con estos valores exactos.
const GENDER_BACKEND = {
  masculino  : 'Masculino',
  femenino   : 'Femenino',
  no_binario : 'NoBinario',
  otro       : 'Otro',
  no_decir   : 'PrefieroNoDecir',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function Register({ onLoginClick, goToLogin }) {
  // La pantalla de acceso le pasa el callback con dos nombres distintos según el lugar.
  const backToLogin = onLoginClick || goToLogin;
  const navigate = useNavigate();
  const { t } = useLang();

  //paso actual
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState('idle');

  const [formData, setFormData] = useState({
    nombreUsuario: '', email: '', password: '', confirmPwd: '',
    genero: '', dia: '', mes: '', anio: '', fotoPerfil: null, fotoPreview: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Archivo pendiente de recortar (abre la ventana de ajuste de la foto)
  const [cropFile, setCropFile] = useState(null);

  const bgMusicRef = useRef(null);
  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);

  // Listas dinámicas según el idioma
  const GENEROS = [
    { id: 'masculino', label: t.register.genderM, icon: '♂' },
    { id: 'femenino', label: t.register.genderF, icon: '♀' },
    { id: 'no_binario', label: t.register.genderNB, icon: '⚧' },
    { id: 'otro', label: t.register.genderO, icon: '✦' },
    { id: 'no_decir', label: t.register.genderND, icon: '—' },
  ];
  
  const strengthLabel = ['', t.register.strength1, t.register.strength2, t.register.strength3, t.register.strength4, t.register.strength5];

  useEffect(() => {
    bgMusicRef.current = new Audio('/background-music.mp3');
    bgMusicRef.current.volume = 0.2;
    bgMusicRef.current.loop = true;
    bgMusicRef.current.preload = 'auto';

    bgMusicRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));

    return () => bgMusicRef.current?.pause();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (name) => setTouched((p) => ({ ...p, [name]: true }));

  // Foto de perfil: se valida el archivo y se abre la ventana para ajustarla
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen (PNG, JPG, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5 MB.');
      return;
    }

    setCropFile(file);
  };

  // El modal devuelve la imagen ya recortada y ajustada (cuadrada)
  const handleCropConfirm = (croppedDataUrl) => {
    setFormData((p) => ({
      ...p,
      fotoPerfil: null,
      fotoPreview: croppedDataUrl,
    }));
    setCropFile(null);
  };

  // Si cancela el ajuste no se guarda la imagen elegida
  const handleCropCancel = () => setCropFile(null);

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
    setTimeout(() => { setStep(1); setSlideDir('idle'); }, 420);
  };

  const goToStep1 = () => {
    setSlideDir('toRight');
    setTimeout(() => { setStep(0); setSlideDir('idle'); }, 420);
  };

  // El backend exige género y fecha de nacimiento (columnas NOT NULL del modelo User).
  const missingProfileData = !formData.genero || !formData.dia || !formData.mes || !formData.anio;

  // Submit final: crea la cuenta en POST /register y deja la sesión iniciada.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const click = new Audio('/soundClick.mp3');
    click.volume = 0.1;
    click.play().catch(() => {});

    setTouched((p) => ({ ...p, genero: true, fecha: true }));
    setSubmitError('');

    if (missingProfileData) {
      setSubmitError('Completá el género y la fecha de nacimiento para crear la cuenta.');
      return;
    }

    const d = new Date(Number(formData.anio), Number(formData.mes) - 1, Number(formData.dia));
    if (d.getMonth() !== Number(formData.mes) - 1) {
      setSubmitError('La fecha de nacimiento no es válida.');
      return;
    }

    const birthDate = `${formData.anio}-${String(formData.mes).padStart(2, '0')}-${String(formData.dia).padStart(2, '0')}`;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username    : formData.nombreUsuario.trim(),
          email       : formData.email.trim(),
          password    : formData.password,
          gender      : GENDER_BACKEND[formData.genero],
          birthDate,
          // Si no eligió foto se manda vacío y el backend asigna la predeterminada.
          profilePhoto: formData.fotoPreview || '',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const details = Array.isArray(data.details) ? ` (${data.details.join(', ')})` : '';
        setSubmitError(`${data.message || 'No se pudo crear la cuenta'}${details}`);
        return;
      }

      // Cuenta creada: se inicia sesión para entrar directo a la app.
      const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.nombreUsuario.trim(),
          password: formData.password,
        }),
      });

      const loginData = await loginRes.json().catch(() => ({}));

      if (loginRes.ok && loginData.token) {
        localStorage.setItem('token', loginData.token);
        if (loginData.idRole) localStorage.setItem('idRole', loginData.idRole);
        navigate('/feed', { replace: true });
        return;
      }

      // La cuenta ya existe aunque el login automático falle: se manda al login.
      backToLogin?.();
    } catch {
      setSubmitError('No se pudo conectar con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const pwdStrength = calcPasswordStrength(formData.password);
  const sliderClass = `reg-slider ${slideDir !== 'idle' ? `reg-slider--${slideDir}` : ''}`;

  return (
    <div className="register-bg">
      <MusicPlayerMini audioRef={bgMusicRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />

      {[1,2,3,4,5,6].map((n) => <div key={n} className={`bubble bubble-${n}`} />)}

      <div className="register-card" style={{ position: 'relative' }}>
        {/* Selector de idioma en la esquina */}
        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
          <LangSelector />
        </div>

        <div className="reg-progress-wrap">
          <div className="reg-progress-track">
            <div className="reg-progress-fill" style={{ width: step === 0 ? '50%' : '100%' }} />
          </div>
          <div className="reg-step-labels">
            <span className={`reg-step-label ${step === 0 ? 'active' : 'done'}`}>
              {step > 0 ? '✓' : '1'} {t.register.step1}
            </span>
            <span className={`reg-step-label ${step === 1 ? 'active' : ''}`}>
              2 {t.register.step2}
            </span>
          </div>
        </div>

        <div className="register-logo-wrapper">
          <div className="register-logo">
            <img src="/logoo.png" alt="Logo" className="register-logo-img" />
          </div>
        </div>
        <h1 className="register-title">{t.register.title}</h1>
        <p className="register-subtitle">{t.register.subtitle}</p>

        <div className="reg-slider-viewport">
          <div className={sliderClass} data-step={step} ref={sliderRef}>
            
            {/* CARD 1 */}
            <div className="reg-panel">
              <form onSubmit={(e) => { e.preventDefault(); goToStep2(); }}>
                <Field
                  label={t.register.usernameLabel}
                  icon={<UserIcon />}
                  error={touched.nombreUsuario && errors.nombreUsuario ? t.register.usernameError : null}
                  valid={!errors.nombreUsuario && !!formData.nombreUsuario}
                >
                  <input
                    name="nombreUsuario" type="text"
                    className={`register-input ${touched.nombreUsuario && errors.nombreUsuario ? 'input-error' : ''}`}
                    placeholder={t.register.usernamePlaceholder}
                    value={formData.nombreUsuario} onChange={handleChange} onBlur={() => handleBlur('nombreUsuario')}
                  />
                </Field>

                <Field
                  label={t.register.emailLabel}
                  icon={<MailIcon />}
                  error={touched.email && errors.email ? t.register.emailError : null}
                  valid={!errors.email && !!formData.email}
                >
                  <input
                    name="email" type="email"
                    className={`register-input ${touched.email && errors.email ? 'input-error' : ''}`}
                    placeholder={t.register.emailPlaceholder}
                    value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')}
                  />
                </Field>

                <Field
                  label={t.register.passwordLabel}
                  icon={<LockIcon />}
                  error={touched.password && errors.password ? t.register.passwordError : null}
                  valid={!errors.password && !!formData.password}
                  hasToggle={!!formData.password}
                >
                  <input
                    name="password" type={showPassword ? 'text' : 'password'}
                    className={`register-input input-with-toggle ${touched.password && errors.password ? 'input-error' : ''}`}
                    placeholder={t.register.passwordPlaceholder}
                    value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')}
                  />
                  {formData.password && <EyeBtn show={showPassword} toggle={() => setShowPassword((p) => !p)} />}
                </Field>

                {formData.password && (
                  <div className="pwd-strength-wrap">
                    <div className="pwd-strength-bars">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="pwd-bar" style={{ background: i <= pwdStrength ? strengthColor[pwdStrength] : 'rgba(0,0,0,0.08)', transition: `background 0.3s ease ${i * 0.05}s` }} />
                      ))}
                    </div>
                    <span className="pwd-strength-label" style={{ color: strengthColor[pwdStrength] }}>
                      {strengthLabel[pwdStrength]}
                    </span>
                  </div>
                )}

                <Field
                  label={t.register.confirmLabel}
                  icon={<LockIcon />}
                  error={touched.confirmPwd && errors.confirmPwd ? t.register.confirmError : null}
                  valid={!errors.confirmPwd && !!formData.confirmPwd}
                  hasToggle={!!formData.confirmPwd}
                >
                  <input
                    name="confirmPwd" type={showConfirm ? 'text' : 'password'}
                    className={`register-input input-with-toggle ${touched.confirmPwd && errors.confirmPwd ? 'input-error' : ''}`}
                    placeholder={t.register.confirmPlaceholder}
                    value={formData.confirmPwd} onChange={handleChange} onBlur={() => handleBlur('confirmPwd')}
                  />
                  {formData.confirmPwd && <EyeBtn show={showConfirm} toggle={() => setShowConfirm((p) => !p)} />}
                </Field>
                
                <button type="submit" className="register-btn register-btn--continue">
                  {t.register.btnContinue}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>

              <p className="register-login-link">
                {t.register.alreadyAccount}
                <a href="#" onClick={(e) => { e.preventDefault(); backToLogin?.(); }}>{t.register.loginLink}</a>
              </p>
            </div>

            {/* CARD 2 */}
            <div className="reg-panel">
              <form onSubmit={handleSubmit}>
                <div className="reg-section-title">
                  {t.register.photoTitle} <span className="reg-optional">{t.register.photoOptional}</span>
                </div>
                <div className="photo-area">
                  <div className="photo-circle" onClick={() => fileInputRef.current?.click()} title={t.register.photoUpload}>
                    {formData.fotoPreview ? (
                      <img src={formData.fotoPreview} alt="preview" className="photo-preview" />
                    ) : (
                      <div className="photo-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" stroke="#a0c8e8" strokeWidth="1.8"/>
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a0c8e8" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div className="photo-overlay">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                  <div className="photo-actions">
                    <button type="button" className="photo-btn photo-btn--upload" onClick={() => fileInputRef.current?.click()}>
                      {t.register.photoUpload}
                    </button>
                    {formData.fotoPreview && (
                      <button type="button" className="photo-btn photo-btn--remove" onClick={removePhoto}>
                        {t.register.photoRemove}
                      </button>
                    )}
                    <p className="photo-hint">{t.register.photoHint}</p>
                  </div>
                </div>

                <div className="reg-section-title" style={{ marginTop: 18 }}>{t.register.genderTitle}</div>
                <div className="genero-grid">
                  {GENEROS.map((g) => (
                    <button
                      key={g.id} type="button"
                      className={`genero-btn ${formData.genero === g.id ? 'genero-btn--active' : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, genero: g.id }))}
                    >
                      <span className="genero-icon">{g.icon}</span>
                      <span className="genero-label">{g.label}</span>
                    </button>
                  ))}
                </div>
                {touched.genero && !formData.genero && (
                  <p className="register-hint hint-error">Elegí una opción de género</p>
                )}

                <div className="reg-section-title" style={{ marginTop: 18 }}>{t.register.birthTitle}</div>
                <div className="dob-row">
                  <div className="dob-select-wrap">
                    <label className="dob-label">{t.register.day}</label>
                    <div className="custom-select-wrap">
                      <select name="dia" className="custom-select" value={formData.dia} onChange={handleChange}>
                        <option value="">—</option>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  <div className="dob-select-wrap dob-select-wrap--mes">
                    <label className="dob-label">{t.register.month}</label>
                    <div className="custom-select-wrap">
                      <select name="mes" className="custom-select" value={formData.mes} onChange={handleChange}>
                        <option value="">—</option>
                        {t.register.months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  <div className="dob-select-wrap">
                    <label className="dob-label">{t.register.year}</label>
                    <div className="custom-select-wrap">
                      <select name="anio" className="custom-select" value={formData.anio} onChange={handleChange}>
                        <option value="">—</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </div>
                {touched.fecha && (!formData.dia || !formData.mes || !formData.anio) && (
                  <p className="register-hint hint-error">Completá día, mes y año</p>
                )}

                {submitError && <p className="register-hint hint-error">{submitError}</p>}

                <div className="reg-btns-row">
                  <button type="button" className="register-btn register-btn--back" onClick={goToStep1}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t.register.btnBack}
                  </button>
                  <button type="submit" className="register-btn register-btn--final" disabled={submitting}>
                    {submitting ? '...' : t.register.btnSubmit}
                  </button>
                </div>
              </form>
            </div>


          </div>{/* /reg-slider */}
        </div>{/* /reg-slider-viewport */}

      </div>{/* /register-card */}

      {/* Ventana para ajustar tamaño y posición de la foto de perfil */}
      {cropFile && (
        <ImageCropperModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#4cce8a"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        )}
        {error && (
          <span className="input-status-icon input-cross">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#f06060"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </span>
        )}
      </div>
      {error && <p className="register-hint hint-error">{error}</p>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" className="password-toggle" onClick={toggle} tabIndex={-1} title={show ? 'Ocultar' : 'Mostrar'}>
      {show ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="#7ab8d8" strokeWidth="2"/></svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/></svg>
      )}
    </button>
  );
}

function ChevronDown() {
  return (
    <span className="select-chevron">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#5a90b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#7ab8d8" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/></svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#7ab8d8" strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/></svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#7ab8d8" strokeWidth="2"/><path d="M8 11V7a4 4 0 118 0v4" stroke="#7ab8d8" strokeWidth="2" strokeLinecap="round"/></svg>
  );
}