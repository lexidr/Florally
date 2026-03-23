import React from "react";
import { Link } from "react-router-dom";
import "./EMailVerification.css";

function EMailVerification() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={"/logo.svg"} alt="Florally" className="logo" />
          <nav className="navigation">
            <Link to="/plants/my_plants" className="nav-link">
              Мои растения
            </Link>
            <Link to="/" className="nav-link">
              Календарь
            </Link>
            <Link to="/user" className="nav-link">
              Профиль
            </Link>
          </nav>
          <div className="auth-section">
            <button className="auth-button login-button">
              Войти
            </button>
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
          <button className="confirmation-button">
            Войти
          </button>
        </div>
      </main>
    </div>
  );
}

export default EMailVerification;