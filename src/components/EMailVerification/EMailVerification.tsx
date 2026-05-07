import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { checkAuth, SignOut, confirmEmail } from "../../api/authApi";
import "./EMailVerification.css";

function EMailVerification({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmationToken } = useParams();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [screenSize, setScreenSize] = useState<"desktop" | "mobile">("desktop");

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize(width <= 810 ? "mobile" : "desktop");
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
        setConfirmationStatus("error");
        setErrorMessage("Токен подтверждения не найден");
        return;
      }
      try {
        setConfirmationStatus("loading");
        const response = await confirmEmail(confirmationToken);
        console.log("Email подтвержден:", response);
        setConfirmationStatus("success");
      } catch (error: any) {
        console.error("Ошибка при подтверждении email:", error);
        setConfirmationStatus("error");
        setErrorMessage(error.message || "Произошла ошибка при подтверждении email");
      }
    };
    confirmUserEmail();
  }, [confirmationToken]);

  const handleLoginClick = () => navigate("/auth/signin");
  const handleLogoutClick = async () => {
    try {
      const confirmLogout = window.confirm("Вы уверены, что хотите выйти?");
      if (!confirmLogout) return;
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);
      if (location.pathname === "/user") navigate("/");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };
  const handleSignInClick = () => navigate("/auth/signin");

  const renderContent = () => {
    switch (confirmationStatus) {
      case "loading":
        return (
          <div className={`confirmation-container ${screenSize === "mobile" ? "mobile-confirmation-container" : ""}`}>
            <div className="loading-spinner"></div>
            <h2 className={`confirmation-title ${screenSize === "mobile" ? "mobile-confirmation-title" : ""}`}>
              Подтверждение email...
            </h2>
            <p className={`confirmation-text ${screenSize === "mobile" ? "mobile-confirmation-text" : ""}`}>
              Пожалуйста, подождите, идет подтверждение вашего email адреса
            </p>
          </div>
        );
      case "error":
        return (
          <div className={`confirmation-container ${screenSize === "mobile" ? "mobile-confirmation-container" : ""}`}>
            <div className={`error-icon ${screenSize === "mobile" ? "mobile-error-icon" : ""}`}>
              <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#DF7171" strokeWidth="4" />
                <path d="M24 24L40 40M40 24L24 40" stroke="#DF7171" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className={`confirmation-title ${screenSize === "mobile" ? "mobile-confirmation-title" : ""}`}>
              Ошибка подтверждения
            </h2>
            <p className={`confirmation-text ${screenSize === "mobile" ? "mobile-confirmation-text" : ""}`}>
              {errorMessage || "Не удалось подтвердить email адрес"}
            </p>
            <button
              className={`confirmation-button ${screenSize === "mobile" ? "mobile-confirmation-button" : ""}`}
              onClick={handleSignInClick}
            >
              Перейти к входу
            </button>
          </div>
        );
      default:
        return (
          <div className={`confirmation-container ${screenSize === "mobile" ? "mobile-confirmation-container" : ""}`}>
            <div className={`success-icon ${screenSize === "mobile" ? "mobile-success-icon" : ""}`}>
              <svg width="80" height="80" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#A8C686" strokeWidth="4" />
                <path d="M20 32L28 40L44 24" stroke="#A8C686" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className={`confirmation-title ${screenSize === "mobile" ? "mobile-confirmation-title" : ""}`}>
              Email подтвержден!
            </h2>
            <p className={`confirmation-text ${screenSize === "mobile" ? "mobile-confirmation-text" : ""}`}>
              Теперь вы можете войти в свой аккаунт
            </p>
            <button
              className={`confirmation-button ${screenSize === "mobile" ? "mobile-confirmation-button" : ""}`}
              onClick={handleSignInClick}
            >
              Войти
            </button>
          </div>
        );
    }
  };

  if (screenSize === "desktop") {
    return (
      <div className={`appEv ${isDarkMode ? 'dark-theme' : ''}`}>
        <header className="header">
                <div className="header-content">
                  <Link to="/"><img src="/logo.svg" alt="Florally" className="logo" /></Link>
                  <nav className="navigation">
                    <Link to="/plants/my_plants" className={`nav-link ${isMyPlantsActive ? "calendar-active" : ""}`}>Мои растения</Link>
                    <Link to="/" className={`nav-link ${isCalendarActive ? "calendar-active" : ""}`}>Календарь</Link>
                    <Link to="/user" className={`nav-link ${isUserActive ? "calendar-active" : ""}`}>Профиль</Link>
                  </nav>
                  <div className="auth-section">
                    <div className="theme-switch-wrapper" style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
                      <label className="theme-switch" htmlFor="checkbox">
                        <input type="checkbox" id="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                        <div className="slider round"></div>
                      </label>
                    </div>
        
                    {isLoggedIn ? (
                      <button className="auth-section-button logout-button" onClick={() => { handleLogoutClick(); }}>Выйти</button>
                    ) : (
                      <button className="auth-section-button login-button" onClick={() => handleLoginClick()}>Войти</button>
                    )}
                  </div>
                </div>
              </header>
        <main className="email-confirmation-content">{renderContent()}</main>
      </div>
    );
  }

  return (
    <div className={`mobile-app-ev ${isDarkMode ? 'dark-theme' : ''}`}>
       <header className="mobile-header">
          <div className="mobile-header-content">
            <Link to="/"> <img src="/logo.svg" alt="Florally" className="mobile-logo" /> </Link>
            <div className="theme-switch-wrapper" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <label className="theme-switch" htmlFor="mobile-checkbox-user">
                <input type="checkbox" id="mobile-checkbox-user" checked={isDarkMode} onChange={toggleTheme} />
                <div className="slider round"></div>
              </label>
            </div>
          </div>
        </header>
      <main className="mobile-email-confirmation-content">{renderContent()}</main>
      <div className="mobile-bottom-menu-ev">
        <Link to="/plants/my_plants" className="mobile-menu-item-ev">
          <img src="/ph_plant-dark.svg" alt="Мои растения" className={`mobile-menu-icon-ev ${isMyPlantsActive ? "active-icon-ev" : ""}`} />
        </Link>
        <Link to="/" className="mobile-menu-item-ev">
          <img src="/proicons_calendar.svg" alt="Календарь" className={`mobile-menu-icon-ev ${isCalendarActive ? "active-icon-ev" : ""}`} />
        </Link>
        <Link to="/user" className="mobile-menu-item-ev">
          <img src="/ion_person-outline.svg" alt="Профиль" className={`mobile-menu-icon-ev ${isUserActive ? "active-icon-ev" : ""}`} />
        </Link>
      </div>
    </div>
  );
}

export default EMailVerification;