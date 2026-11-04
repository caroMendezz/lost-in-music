import React, { useState } from "react";
import { useLang } from "../LangContext";

function ChangeEmail() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const API_URL = "http://localhost:3000";

  const getToken = () => localStorage.getItem("token");

  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (email.trim().toLowerCase() !== confirm.trim().toLowerCase()) {
      setMessage({
        text: t.settings.changeEmail.errorMismatch,
        type: "error",
      });
      return;
    }

    const token = getToken();

    if (!token) {
      setMessage({
        text: t.settings.changeEmail.errorSession,
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/email/change/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: password,
            newEmail: email.trim().toLowerCase(),
            confirmEmail: confirm.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.settings.changeEmail.errorGeneric);
      }

      setCodeSent(true);
      setPassword("");
      setMessage({
        text: data.message,
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error.message || t.settings.changeEmail.errorGeneric,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const token = getToken();

    if (!token) {
      setMessage({
        text: t.settings.changeEmail.errorSession,
        type: "error",
      });
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setMessage({
        text: t.settings.changeEmail.errorCode,
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/email/change/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: code.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.settings.changeEmail.errorGeneric);
      }

      setEmail("");
      setConfirm("");
      setPassword("");
      setCode("");
      setCodeSent(false);

      setMessage({
        text: data.message,
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error.message || t.settings.changeEmail.errorGeneric,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="config-section">
      <h3>{t.settings.changeEmail.title}</h3>

      {message.text && (
        <p
          className={`form-message ${message.type}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </p>
      )}

      {!codeSent ? (
        <form className="config-form" onSubmit={handleRequest}>
          <label>
            {t.settings.changeEmail.currentPass}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label>
            {t.settings.changeEmail.newEmail}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.settings.changeEmail.placeholderEmail}
              autoComplete="email"
              required
            />
          </label>

          <label>
            {t.settings.changeEmail.confirmEmail}
            <input
              type="email"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t.settings.changeEmail.placeholderEmail}
              autoComplete="off"
              required
            />
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t.settings.changeEmail.sending : t.settings.changeEmail.btnRequest}
            </button>
          </div>
        </form>
      ) : (
        <form className="config-form" onSubmit={handleConfirm}>
          <p>{t.settings.changeEmail.codeInstruction}</p>

          <label>
            {t.settings.changeEmail.codeLabel}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={t.settings.changeEmail.placeholderCode}
              autoComplete="one-time-code"
              required
            />
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t.settings.changeEmail.verifying : t.settings.changeEmail.btnConfirm}
            </button>

            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setMessage({ text: "", type: "" });
              }}
            >
              {t.settings.changeEmail.btnCancel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ChangeEmail;