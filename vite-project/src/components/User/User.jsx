import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import "./User.css";

function User() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    newPassword: "",
  });

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);

        if (authData.user) {
          setFormData({
            username: authData.user.username || "",
            email: authData.user.email || "",
            password: "",
            newPassword: "",
          });
        }
      } catch (error) {
        console.error("Ошибка при проверке аутентификации:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authCheck();
  }, []);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    console.log("Сохранение изменений:", formData);
    alert("Изменения сохранены");
  };

  const formatRegistrationDate = () => {
    if (!user || !user.createdAt) {
      return new Date().toLocaleDateString("ru-RU");
    }

    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString("ru-RU");
    } catch (e) {
      return new Date().toLocaleDateString("ru-RU");
    }
  };

  const getUserName = () => {
    if (!user) return "";
    return user.username || user.email?.split("@")[0] || "Пользователь";
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={"/logo.svg"} alt="Florally" className="logo" />
            <div className="loading-auth">Загрузка...</div>
          </div>
        </header>
        <main className="user-content">
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
              <div className="user-info">
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
      <main className="user-content">
        <section className="user-container">
          <div className="user-card">
            {isLoggedIn && user ? (
              <div className="user-profile">
                <div className="user-header">
                  <h1 className="user-name">{getUserName()}</h1>
                  <p className="registration-date">
                    Зарегистрирован {formatRegistrationDate()}
                  </p>
                </div>

                <div className="user-form">
                  <h2>Редактировать профиль</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="username">Имя</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleFormChange}
                        placeholder="Имя"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Почта</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Почта"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Текущий пароль</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Текущий пароль"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">Новый пароль</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleFormChange}
                        placeholder="Новый пароль"
                      />
                    </div>
                  </div>

                  <button
                    className="save-changes-btn"
                    onClick={handleSaveChanges}
                  >
                    Сохранить изменения
                  </button>
                </div>

                <div className="user-plants">
                  <h2>Мои растения</h2>
                  <div className="plants-grid">
                    <div className="plant-square"></div>
                    <div className="plant-square"></div>
                    <div className="plant-square"></div>
                  </div>
                  <button className="view-more-btn">Посмотреть еще</button>
                </div>

                <div className="user-actions">
                  <button
                    className="logout-bottom-btn"
                    onClick={handleLogoutClick}
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            ) : (
              <div className="not-logged-in">
                <h2>Профиль</h2>
                <p>Войдите, чтобы увидеть свой профиль</p>
                <button className="login-btn" onClick={handleLoginClick}>
                  Войти
                </button>
              </div>
            )}
          </div>

          <div className="user-image-section">
            <img
              src="/back-img.svg"
              alt="Девушка поливает цветок в горшке"
              className="user-background-image"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default User;
