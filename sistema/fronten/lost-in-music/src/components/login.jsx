import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, fetchSession } from "../services/session";
import { useLang } from "./LangContext";
import LangSelector from "./LangSelector";
import "../styles/login.css";

function Login({ goToRegister, goToResetPassword }) {
  const navigate = useNavigate();
  const { t } = useLang();

  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Solo se redirige si la sesión guardada sigue siendo válida. Si la cuenta
    // está sancionada (403 BANNED), se queda en el login y el backend informa
    // el motivo y la duración al intentar ingresar.
    const checkStoredSession = async () => {
      if (!localStorage.getItem("token")) return;

      const result = await fetchSession();
      if (cancelled) return;

      if (result.ok) {
        window.location.href = "/feed";
      } else if (result.status === 401 || result.status === 404) {
        clearSession();
      }
    };

    checkStoredSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ emailUser: true, password: true });
    if (errors.emailUser || errors.password) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: emailUser, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.message || t.login.errorCredentials);
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.idRole) localStorage.setItem("idRole", data.idRole);
      navigate("/feed", { replace: true });
    } catch {
      setSubmitError(t.login.errorConnection);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = (name) => {
    setTouched((p) => ({ ...p, [name]: true }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    goToResetPassword();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    goToRegister();
  };

  const errors = {
    emailUser: emailUser.trim() === "",
    password: password.trim() === "",
  };

  return (
    <div className="login-card" style={{ position: 'relative' }}>
      {/* Selector de idioma en la esquina */}
      <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
        <LangSelector />
      </div>

      <div className="login-shine"></div>

      <div className="login-inner">
        <div className="login-logo">
          <img
            src="/logoo.png"
            alt="Logo Lost In Music"
            className="login-logo-img"
          />
        </div>

        <h1 className="login-logo-title">Lost In Music</h1>

        <div className="login-welcome">{t.login.welcome}</div>

        <h2 className="login-section-title">{t.login.title}</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">{t.login.emailLabel}</label>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                className={`login-input ${touched.emailUser && errors.emailUser ? "input-error" : ""}`}
                onBlur={() => handleBlur("emailUser")}
                placeholder={t.login.emailPlaceholder}
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
              />

              {touched.emailUser && errors.emailUser && (
                <span className="login-status-icon login-input-cross">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#f06060" />
                    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </div>

            {touched.emailUser && errors.emailUser && (
              <div className="login-error-text">
                {t.login.emailError}
              </div>
            )}

            <div className="login-hint-text">
              {t.login.emailHint}
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">{t.login.passwordLabel}</label>

            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`login-input login-password-input ${touched.password && errors.password ? "input-error" : ""}`}
                onBlur={() => handleBlur("password")}
                placeholder={t.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {touched.password && errors.password && (
                <span className="login-status-icon login-input-cross password-error-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#f06060" />
                    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
              )}
              {password && (
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? t.login.hidePassword : t.login.showPassword}
                >
                  {showPassword ? (
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
              )}
            </div>

            {touched.password && errors.password && (
              <div className="login-error-text-pass">
                {t.login.passwordError}
              </div>
            )}
          </div>
          <div className="login-hint-text">{t.login.passwordHint}</div>

          <div className="login-forgot-link">
            <a href="#" onClick={handleForgotPassword} className="login-link">
              {t.login.forgotPassword}
            </a>
          </div>

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? t.login.submitting : t.login.submit}
          </button>

          {submitError && (
            <div className="login-error-text" style={{ textAlign: "center", marginTop: 10 }}>
              {submitError}
            </div>
          )}
        </form>

        <div className="login-register-link">
          <span>{t.login.noAccount}</span>
          <a href="#" onClick={handleRegister} className="login-link">
            {t.login.registerLink}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;