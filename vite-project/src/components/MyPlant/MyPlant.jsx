import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkAuth, SignOut } from '../../api/authApi';
import './MyPlant.css';

function MyPlant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const isCalendarActive = location.pathname === '/';
  const isMyPlantsActive = location.pathname === '/plants/my_plants';
  const isUserActive = location.pathname === '/user';

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authCheck();
  }, []);

  const handleLoginClick = () => {
    navigate('/auth/signin');
  };

  const handleLogoutClick = async () => {
    try {
      const confirmLogout = window.confirm('Вы уверены, что хотите выйти?');
      if (!confirmLogout) return;
      
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);
      
      if (location.pathname === '/user') {
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      alert('Произошла ошибка при выходе из системы');
    }
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={'/logo.svg'} alt="Florally" className="logo" />
            <div className="loading-auth">Загрузка...</div>
          </div>
        </header>
        <main className="my-plants-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Проверка аутентификации...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={'/logo.svg'} alt="Florally" className="logo" />
          <nav className="navigation">
            <Link 
              to="/plants/my_plants" 
              className={`nav-link ${isMyPlantsActive ? 'calendar-active' : ''}`}
            >
              Мои растения
            </Link>
            <Link 
              to="/" 
              className={`nav-link ${isCalendarActive ? 'calendar-active' : ''}`}
            >
              Календарь
            </Link>
            <Link 
              to="/user" 
              className={`nav-link ${isUserActive ? 'calendar-active' : ''}`}
            >
              Профиль
            </Link>
          </nav>
          <div className="auth-section">
            {isLoggedIn ? (
              <div className="user-info">
                {user && (
                  <span className="username">
                    {user.username || user.email?.split('@')[0]}
                  </span>
                )}
                <button 
                  className="auth-button logout-button"
                  onClick={handleLogoutClick}
                >
                  Выйти
                </button>
              </div>
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
      <main className="my-plants-content">
        <section className="coming-soon-container">
          <div className="plant-image-container"></div>
          <div className="coming-soon-text">
            <p>Coming</p>
            <p>soon</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MyPlant;