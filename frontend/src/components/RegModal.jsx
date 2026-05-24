import { useState } from "react";

export default function RegModal({ open, onClose }) {
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [done, setDone]       = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 8) return;
    setDone(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setForm({ name: "", email: "", password: "" });
      setShowPass(false);
    }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .reg-input {
          width: 100%; padding: 11px 14px; font-size: 14px;
          border: 1.5px solid #E2E8F0; border-radius: 10px;
          outline: none; color: #0F172A; background: #F8FAFC;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit; box-sizing: border-box;
        }
        .reg-input:focus { border-color: #93C5FD; background: #fff; }
        .reg-input::placeholder { color: #94A3B8; }
        .reg-submit {
          width: 100%; padding: 12px; font-size: 15px; font-weight: 700;
          color: #fff; background: #1D4ED8; border: none; border-radius: 10px;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }
        .reg-submit:hover  { background: #1E40AF; transform: translateY(-1px); }
        .reg-submit:active { transform: translateY(0); }
        .reg-submit:disabled { background: #93C5FD; cursor: default; transform: none; }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }} />

      {/* Modal */}
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: "36px 32px 32px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", animation: "modalIn 0.2s ease" }}>

        {/* Close button */}
        <button onClick={handleClose} style={{ position: "absolute", top: 16, right: 16, background: "#F1F5F9", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {done ? (
          /* Success screen */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Готово!</h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
              Регистрация прошла успешно.<br/>
              На почту <strong>{form.email}</strong> отправлено письмо с подтверждением.
            </p>
            <button onClick={handleClose} className="reg-submit" style={{ marginTop: 24 }}>Закрыть</button>
          </div>
        ) : (
          /* Form */
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM2 18c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>Регистрация</h2>
              <p style={{ fontSize: 13, color: "#94A3B8" }}>Создайте аккаунт для доступа к сервисам</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>ФИО</label>
                <input className="reg-input" placeholder="Иванов Иван Иванович"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                <input className="reg-input" type="email" placeholder="example@mail.ru"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Пароль</label>
                <div style={{ position: "relative" }}>
                  <input className="reg-input"
                    type={showPass ? "text" : "password"}
                    placeholder="Минимум 8 символов"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    style={{ paddingRight: 42 }}
                    minLength={8} required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex", alignItems: "center" }}>
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.8 5.2 1.8 6.5 1.5 8c.8 3 3.5 5 6.5 5 1.4 0 2.7-.4 3.8-1.2M6 3.1C6.6 3 7.3 3 8 3c3 0 5.7 2 6.5 5-.3 1-.8 1.9-1.5 2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="reg-submit" style={{ marginTop: 6 }}
                disabled={!form.name || !form.email || form.password.length < 8}>
                Зарегистрироваться
              </button>

              <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
                Нажимая кнопку, вы соглашаетесь с{" "}
                <span style={{ color: "#1D4ED8", cursor: "pointer" }}>политикой конфиденциальности</span>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
