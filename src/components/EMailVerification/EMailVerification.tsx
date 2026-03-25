import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { checkAuth, SignOut, confirmEmail } from "../../api/authApi";
import "./EMailVerification.css";

function EMailVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmationToken } = useParams();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);
      } catch (error) {
        console.error("Ошибка при проверке аутентификации:", error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    authCheck();
  }, []);

  useEffect(() => {
    const confirmUserEmail = async () => {
      if (!confirmationToken) {
        setConfirmationStatus('error');
        setErrorMessage('Токен подтверждения не найден');
        return;
      }

      try {
        setConfirmationStatus('loading');
        const response = await confirmEmail(confirmationToken);
        console.log("Email подтвержден:", response);
        setConfirmationStatus('success');
      } catch (error: any) {
        console.error('Ошибка при подтверждении email:', error);
        setConfirmationStatus('error');
        setErrorMessage(error.message || 'Произошла ошибка при подтверждении email');
      }
    };

    confirmUserEmail();
  }, [confirmationToken]);

  const handleLoginClick = () => {
    navigate("/auth/signin");
  };

  const handleLogoutClick = async () => {
    try {
      const confirmLogout = window.confirm("Вы уверены, что хотите выйти?");
      if (!confirmLogout) return;
      
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);

      if (location.pathname === "/user") {
        navigate("/");
      }
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      alert("Произошла ошибка при выходе из системы");
    }
  };

  const handleSignInClick = () => {
    navigate("/auth/signin");
  };

  // Отображение загрузки
  if (confirmationStatus === 'loading') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={"/logo.svg"} alt="Florally" className="logo" />
            <nav className="navigation">
              <Link
                to="/plants/my_plants"
                className={`nav-link ${isMyPlantsActive ? "calendar-active" : ""}`}
              >
                Мои растения
              </Link>
              <Link
                to="/"
                className={`nav-link ${isCalendarActive ? "calendar-active" : ""}`}
              >
                Календарь
              </Link>
              <Link
                to="/user"
                className={`nav-link ${isUserActive ? "calendar-active" : ""}`}
              >
                Профиль
              </Link>
            </nav>
            <div className="auth-section">
              {isLoggedIn ? (
                <button
                  className="auth-button logout-button"
                  onClick={handleLogoutClick}
                >
                  Выйти
                </button>
              ) : (
                <button
                  className="auth-button login-button"
                  onClick={handleLoginClick}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </header>
        <main className="email-confirmation-content">
          <div className="confirmation-container">
            <div className="loading-spinner"></div>
            <h2 className="confirmation-title">Подтверждение email...</h2>
            <p className="confirmation-text">
              Пожалуйста, подождите, идет подтверждение вашего email адреса
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Отображение ошибки
  if (confirmationStatus === 'error') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={"/logo.svg"} alt="Florally" className="logo" />
            <nav className="navigation">
              <Link
                to="/plants/my_plants"
                className={`nav-link ${isMyPlantsActive ? "calendar-active" : ""}`}
              >
                Мои растения
              </Link>
              <Link
                to="/"
                className={`nav-link ${isCalendarActive ? "calendar-active" : ""}`}
              >
                Календарь
              </Link>
              <Link
                to="/user"
                className={`nav-link ${isUserActive ? "calendar-active" : ""}`}
              >
                Профиль
              </Link>
            </nav>
            <div className="auth-section">
              {isLoggedIn ? (
                <button
                  className="auth-button logout-button"
                  onClick={handleLogoutClick}
                >
                  Выйти
                </button>
              ) : (
                <button
                  className="auth-button login-button"
                  onClick={handleLoginClick}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </header>
        <main className="email-confirmation-content">
          <div className="confirmation-container">
            <div className="error-icon">
              <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#DF7171" strokeWidth="4"/>
                <path d="M24 24L40 40M40 24L24 40" stroke="#DF7171" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="confirmation-title">Ошибка подтверждения</h2>
            <p className="confirmation-text">
              {errorMessage || "Не удалось подтвердить email адрес"}
            </p>
            <button 
              className="confirmation-button"
              onClick={handleSignInClick}
            >
              Перейти к входу
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Успешное подтверждение
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={"/logo.svg"} alt="Florally" className="logo" />
          <nav className="navigation">
            <Link
              to="/plants/my_plants"
              className={`nav-link ${
                isMyPlantsActive ? "calendar-active" : ""
              }`}
            >
              Мои растения
            </Link>
            <Link
              to="/"
              className={`nav-link ${
                isCalendarActive ? "calendar-active" : ""
              }`}
            >
              Календарь
            </Link>
            <Link
              to="/user"
              className={`nav-link ${isUserActive ? "calendar-active" : ""}`}
            >
              Профиль
            </Link>
          </nav>
          <div className="auth-section">
            {isLoggedIn ? (
              <button
                className="auth-button logout-button"
                onClick={handleLogoutClick}
              >
                Выйти
              </button>
            ) : (
              <button
                className="auth-button login-button"
                onClick={handleLoginClick}
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="email-confirmation-content">
        <div className="confirmation-container">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="#A8C686" strokeWidth="4"/>
              <path d="M20 32L28 40L44 24" stroke="#A8C686" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="confirmation-title">Email подтвержден!</h2>
          <p className="confirmation-text">
            Теперь вы можете войти в свой аккаунт
          </p>
          <button 
            className="confirmation-button"
            onClick={handleSignInClick}
          >
            Войти
          </button>
        </div>
      </main>
    </div>
  );
}

export default EMailVerification;