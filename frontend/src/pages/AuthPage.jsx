import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authenticate, canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin, mergeTestUserProfile } from "../auth.js";
import { API_BASE } from "../constants/index.js";

export default function AuthPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState(initialTab);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z\u0410-\u042F\u0401]/.test(pass) && /[a-z\u0430-\u044F\u0451]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z\u0410-\u044F\u0401\u04510-9]/.test(pass)) score += 1;
    if (pass.length >= 12) score += 1;
    return Math.min(score, 4);
  };

  const passScore = getPasswordStrength(regForm.password);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    let backendError = "";
    try {
      const formData = new URLSearchParams();
      formData.set("username", loginForm.email);
      formData.set("password", loginForm.password);
      const tokenResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      if (tokenResponse.ok) {
        const token = await tokenResponse.json();
        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (meResponse.ok) {
          const me = await meResponse.json();
          onLogin?.(mergeTestUserProfile({ ...me, access_token: token.access_token }));
          return;
        }
        backendError = "Не удалось получить профиль пользователя после входа.";
      } else {
        const data = await tokenResponse.json().catch(() => null);
        backendError = typeof data?.detail === "string" ? data.detail : "Неверный логин или пароль.";
      }
    } catch (err) {
      backendError = err?.message || "Backend авторизации недоступен.";
    }
    const user = authenticate(loginForm.email, loginForm.password);
    if (!user) {
      setError(backendError || "Неверный логин или пароль.");
      return;
    }
    if (canAccessAdmin(user) || canAccessTpmpkAdmin(user) || canAccessDomuAdmin(user)) {
      setError(`${backendError || "Backend не выдал access token."} Для административных разделов нужен реальный серверный вход.`);
      return;
    }
    onLogin?.(user);
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (!regForm.name || !regForm.email || regForm.password.length < 8) return;
    setDone(true);
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #0F172A;
          background:
            radial-gradient(circle at 84% 6%, rgba(255, 255, 255, 0.16), transparent 28rem),
            radial-gradient(circle at 10% 18%, rgba(255, 255, 255, 0.12), transparent 30rem),
            #477799;
        }
        .auth-top {
          position: relative;
          z-index: 2;
          min-height: 72px;
          padding: 18px 24px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
        }
        .back-btn {
          justify-self: start;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255,255,255,.76);
          backdrop-filter: blur(10px);
          color: #475569;
          border-radius: 14px;
          min-height: 42px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all .18s ease;
        }
        .back-btn:hover { border-color: #1F5073; color: #1F5073; transform: translateY(-1px); }
        .auth-logo { height: 46px; object-fit: contain; cursor: pointer; }
        .auth-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: grid;
          place-items: start center;
          padding: clamp(24px, 7vh, 72px) 20px 42px;
        }
        .auth-wrap { width: min(100%, 520px); display: block; }
        .auth-intro { text-align: center; margin-bottom: 26px; }
        .auth-icon {
          width: 66px; height: 66px; border-radius: 22px;
          display: grid; place-items: center; margin: 0 auto 18px;
          color: #1F5073; background: #FFFFFF;
          box-shadow: 0 18px 40px rgba(31, 80, 115, 0.13);
        }
        .auth-intro h1 { margin: 0 0 8px; color: #FFFFFF; font-size: clamp(26px, 5vw, 34px); line-height: 1.08; letter-spacing: 0; }
        .auth-intro p { margin: 0; color: rgba(255, 255, 255, 0.82); font-size: 15px; line-height: 1.6; }
        .auth-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255,255,255,0.86);
          border-radius: 28px;
          box-shadow: 0 24px 70px rgba(15,23,42,.08);
          backdrop-filter: blur(18px);
        }
        .auth-card { padding: 30px; }
        .tab-row {
          display: flex; background: #F1F5F9; border-radius: 16px; padding: 5px; margin-bottom: 24px;
        }
        .tab-btn {
          flex: 1; min-height: 44px; border: 0; border-radius: 13px; background: transparent;
          color: #64748B; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer;
        }
        .tab-btn.active { background: #fff; color: #1F5073; box-shadow: 0 8px 20px rgba(15,23,42,.06); }
        .auth-form { display: grid; gap: 18px; }
        .auth-field label {
          display: block; margin-bottom: 8px; color: #475569; font-size: 13px; font-weight: 800;
        }
        .auth-input {
          width: 100%; min-height: 50px; padding: 0 15px;
          border: 1.5px solid #E2E8F0; border-radius: 15px;
          outline: none; color: #0F172A; background: #F8FAFC;
          font: inherit; font-size: 15px; font-weight: 700;
          transition: all .2s ease;
        }
        .auth-input:focus {
          border-color: #1F5073; background: #fff; box-shadow: 0 0 0 4px rgba(31, 80, 115, 0.15);
        }
        .password-box { position: relative; }
        .password-box .auth-input { padding-right: 48px; }
        .show-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          width: 34px; height: 34px; border: 0; border-radius: 10px; background: transparent;
          color: #64748B; display: grid; place-items: center; cursor: pointer;
        }
        .show-btn:hover { background: #F1F5F9; }
        .auth-btn {
          width: 100%; min-height: 52px; border: none; border-radius: 16px;
          color: #fff; background: #1F5073;
          font: inherit; font-size: 16px; font-weight: 800; cursor: pointer;
          box-shadow: 0 16px 36px rgba(31, 80, 115, 0.28);
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
        }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 20px 46px rgba(31, 80, 115, 0.34); }
        .auth-btn:disabled { opacity: .5; cursor: default; transform: none; box-shadow: none; }
        .auth-error {
          padding: 12px 14px; border-radius: 15px; color: #B91C1C; background: #FEF2F2;
          border: 1px solid #FECACA; font-size: 13px; font-weight: 700; line-height: 1.5;
        }
        .strength { margin-top: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .strength span { height: 4px; border-radius: 99px; background: #E2E8F0; transition: background .2s ease; }
        .success-box { text-align: center; padding: 18px 0; }
        .success-box h3 { margin: 0 0 8px; font-size: 19px; }
        .success-box p { margin: 0 0 20px; color: #64748B; line-height: 1.6; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-animate { animation: fadeSlideIn .28s ease both; }
        @media (max-width: 620px) {
          .auth-top { grid-template-columns: 1fr; justify-items: center; padding: 14px; }
          .back-btn { justify-self: stretch; justify-content: center; }
          .auth-logo { height: 40px; }
          .auth-content { padding: 20px 12px 30px; place-items: start stretch; }
          .auth-card { border-radius: 24px; padding: 20px; }
        }
      `}</style>

      <div className="auth-top">
        <button className="back-btn" onClick={() => navigate("/")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          На главную
        </button>
        <img className="auth-logo" src="https://mc.eduirk.ru/images/headers/imcro2.png" alt="МКУ ИМЦРО" onClick={() => navigate("/")} />
        <div />
      </div>

      <main className="auth-content">
        <div className="auth-wrap">
          <section>
            <div className="auth-intro">
              <div className="auth-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h1>{tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}</h1>
              <p>{tab === "login" ? "Войдите в личный кабинет МКУ ИМЦРО" : "Заполните форму, чтобы создать учетную запись"}</p>
            </div>

            <div className="auth-card">
              <div className="tab-row">
                <button className={`tab-btn${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setDone(false); }}>Вход</button>
                <button className={`tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Регистрация</button>
              </div>

              <div key={tab} className="form-animate">
                {tab === "login" && (
                  <form className="auth-form" onSubmit={handleLogin}>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="auth-field">
                      <label>Электронная почта</label>
                      <input
                        className="auth-input"
                        type="email"
                        placeholder="name@example.ru"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm((form) => ({ ...form, email: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="auth-field">
                      <label>Пароль</label>
                      <div className="password-box">
                        <input
                          className="auth-input"
                          type={showPass ? "text" : "password"}
                          placeholder="Введите пароль"
                          value={loginForm.password}
                          onChange={(event) => setLoginForm((form) => ({ ...form, password: event.target.value }))}
                          required
                        />
                        <button type="button" className="show-btn" onClick={() => setShowPass((value) => !value)} aria-label="Показать пароль">
                          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                            <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button className="auth-btn" disabled={!loginForm.email || !loginForm.password}>
                      Войти в систему
                    </button>
                  </form>
                )}

                {tab === "register" && (
                  <>
                    {done ? (
                      <div className="success-box">
                        <h3>Готово</h3>
                        <p>На почту <strong>{regForm.email}</strong> отправлено письмо с подтверждением.</p>
                        <button className="auth-btn" onClick={() => { setTab("login"); setDone(false); }}>Войти в аккаунт</button>
                      </div>
                    ) : (
                      <form className="auth-form" onSubmit={handleRegister}>
                        <div className="auth-field">
                          <label>ФИО</label>
                          <input className="auth-input" placeholder="Иванов Иван Иванович" value={regForm.name} onChange={(event) => setRegForm((form) => ({ ...form, name: event.target.value }))} required />
                        </div>
                        <div className="auth-field">
                          <label>Электронная почта</label>
                          <input className="auth-input" type="email" placeholder="example@mail.ru" value={regForm.email} onChange={(event) => setRegForm((form) => ({ ...form, email: event.target.value }))} required />
                        </div>
                        <div className="auth-field">
                          <label>Пароль</label>
                          <div className="password-box">
                            <input className="auth-input" type={showPass ? "text" : "password"} placeholder="Минимум 8 символов" value={regForm.password} onChange={(event) => setRegForm((form) => ({ ...form, password: event.target.value }))} minLength={8} required />
                            <button type="button" className="show-btn" onClick={() => setShowPass((value) => !value)} aria-label="Показать пароль">
                              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            </button>
                          </div>
                          {regForm.password.length > 0 && (
                            <div className="strength">
                              {[1, 2, 3, 4].map((index) => (
                                <span
                                  key={index}
                                  style={{
                                    background: index <= passScore
                                      ? passScore <= 1 ? "#EF4444" : passScore === 2 ? "#F59E0B" : "#10B981"
                                      : "#E2E8F0",
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <button className="auth-btn" disabled={!regForm.name || !regForm.email || regForm.password.length < 8}>
                          Зарегистрироваться
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
