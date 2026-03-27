import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut,update } from "../../api/authApi";
import { IUpdateUserDto } from "../../api/authApi.types";
import { getUserPlants } from "../../api/plantsApi";
import "./User.css";

function User() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    newPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [screenSize, setScreenSize] = useState('desktop');

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 810) {
        setScreenSize('mobile');
      } else if (width <= 1055) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

          if (authData.user.id) {
            const userPlants = await getUserPlants();
            setPlants(userPlants);
          }
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

  const handleViewMoreClick = () => {
    navigate("/plants/my_plants");
  };  

  const handleAddPlantClick = () => {
    navigate("/plants/my_plants");
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleSaveChanges = async () => {
    const updatePayload: IUpdateUserDto = {};

    // Проверка изменения имени
    if (formData.username !== user?.username && formData.username.trim() !== "") {
      updatePayload.username = formData.username;
    }

    // Проверка изменения email
    if (formData.email !== user?.email && formData.email.trim() !== "") {
      updatePayload.email = formData.email;
    }

    // Логика смены пароля
    const isNewPasswordEntered = formData.newPassword.trim() !== "";
    
    if (isNewPasswordEntered) {
      if (!formData.password.trim()) {
        setError("Для смены пароля необходимо ввести текущий пароль");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Новый пароль должен быть не менее 6 символов");
        return;
      }
      updatePayload.oldPassword = formData.password; 
      updatePayload.password = formData.newPassword;
    }

    if (Object.keys(updatePayload).length === 0) {
      setError("Вы не внесли никаких изменений");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedUser = await update(updatePayload);
      
      setUser(updatedUser);
      
      setFormData(prev => ({
        ...prev,
        password: "",
        newPassword: ""
      }));

      setSuccessMessage("Данные успешно обновлены!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Ошибка при сохранении";
      setError(Array.isArray(message) ? message[0] : message); 
    } finally {
      setIsSaving(false);
    }
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

  if (screenSize === 'mobile') {
    return (
      <div className="mobile-app">
        <header className="mobile-header">
          <div className="mobile-header-content">
            <img src={"/logo.svg"} alt="Florally" className="mobile-logo" />
          </div>
        </header>

        <main className="mobile-main-content">
          <div className="mobile-content-wrapper">
            <div className="mobile-form-container full-height">
              {isLoggedIn && user ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-header">
                    <h1 className="mobile-user-name">{getUserName()}</h1>
                    <p className="mobile-registration-date">
                      Зарегистрирован {formatRegistrationDate()}
                    </p>
                  </div>

                  <div className="mobile-user-form">
                    <h2 className="mobile-section-title">Редактировать профиль</h2>
                    
                    {error && (
                      <div className="error-message" style={{
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontSize: '14px'
                      }}>
                        {error}
                      </div>
                    )}
                    
                    {successMessage && (
                      <div className="success-message" style={{
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontSize: '14px'
                      }}>
                        {successMessage}
                      </div>
                    )}
                    
                    <div className="mobile-form-grid">
                      <div className="mobile-form-group">
                        <label htmlFor="username">Имя</label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleFormChange}
                          placeholder="Имя"
                          className="mobile-input"
                        />
                      </div>

                      <div className="mobile-form-group">
                        <label htmlFor="email">Почта</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          placeholder="Почта"
                          className="mobile-input"
                        />
                      </div>

                      <div className="mobile-form-group">
                        <label htmlFor="password">Текущий пароль</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleFormChange}
                          placeholder="Текущий пароль"
                          className="mobile-input"
                          autoComplete="current-password"
                        />
                      </div>

                      <div className="mobile-form-group">
                        <label htmlFor="newPassword">Новый пароль</label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleFormChange}
                          placeholder="Новый пароль"
                          className="mobile-input"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <button
                      className="mobile-save-changes-btn"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      style={{
                        opacity: isSaving ? 0.7 : 1,
                        cursor: isSaving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSaving ? "Сохранение..." : "Сохранить изменения"}
                    </button>
                  </div>

                  <div className="mobile-user-plants">
                    <h2 className="mobile-section-title">Мои растения</h2>
                    {plants && plants.length > 0 ? (
                      <>
                        <div className="mobile-plants-grid">
                          {plants.slice(0, 3).map((userPlant) => (
                            <div key={userPlant.id} className="mobile-plant-square">
                              <img 
                                src={userPlant.plant?.photo || "/plug-image-plant.png"} 
                                alt={userPlant.plant?.name || "Растение"} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
                                onError={(e) => { (e.target as HTMLImageElement).src = "/plug-image-plant.png"; }}
                              />
                            </div>
                          ))}
                        </div>
                        <button 
                          className="mobile-view-more-btn" 
                          onClick={handleViewMoreClick}
                        >
                          Посмотреть еще
                        </button>
                      </>
                    ) : (
                      <button 
                        className="mobile-view-more-btn" 
                        onClick={handleAddPlantClick}
                      >
                        Добавить растение
                      </button>
                    )}
                  </div>

                  <div className="mobile-user-actions">
                    <button
                      className="mobile-logout-btn"
                      onClick={handleLogoutClick}
                    >
                      Выйти из аккаунта
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mobile-title">
                    Зарегистрируйся,
                    <br />
                    чтобы знать больше
                    <br />
                    о своих растениях!
                  </h2>
                  
                  <div className="mobile-button-container">
                    <Link to="/auth/signup" className="mobile-registration-link">
                      <button className="mobile-registration-button">
                        Зарегистрироваться
                      </button>
                    </Link>
                  </div>

                  <div className="mobile-login-container">
                    <span className="mobile-login-text">
                      Есть аккаунт?{" "}
                      <Link to="/auth/signin" className="mobile-login-link">
                        Войти
                      </Link>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <div className="mobile-bottom-menu">
          <Link to="/plants/my_plants" className="mobile-menu-item">
            <img 
              src="/ph_plant-light.svg" 
              alt="Мои растения" 
              className={`mobile-menu-icon ${isMyPlantsActive ? 'active-icon' : ''}`}
            />
          </Link>
          
          <Link to="/" className="mobile-menu-item">
            <img 
              src="/proicons_calendar.svg" 
              alt="Календарь" 
              className={`mobile-menu-icon ${isCalendarActive ? 'active-icon' : ''}`}
            />
          </Link>
          
          <Link to="/user" className="mobile-menu-item">
            <img 
              src="/ion_person-outline.svg" 
              alt="Профиль" 
              className={`mobile-menu-icon ${isUserActive ? 'active-icon' : ''}`}
            />
          </Link>
        </div>
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
                  
                  {error && (
                    <div className="error-message" style={{
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="success-message" style={{
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      {successMessage}
                    </div>
                  )}
                  
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
                        autoComplete="current-password"
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
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    className="save-changes-btn"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    style={{
                      opacity: isSaving ? 0.7 : 1,
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSaving ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </div>

                <div className="user-plants">
                  <h2>Мои растения</h2>
                  {plants && plants.length > 0 ? (
                    <>
                      <div className="plants-grid">
                        {plants.slice(0, 3).map((userPlant) => (
                          <div key={userPlant.id} className="plant-square">
                            <img 
                              src={userPlant.plant?.photo || "/plug-image-plant.png"} 
                              alt={userPlant.plant?.name || "Растение"} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
                              onError={(e) => { (e.target as HTMLImageElement).src = "/plug-image-plant.png"; }}
                            />
                          </div>
                        ))}
                      </div>
                      <button className="view-more-btn" onClick={handleViewMoreClick}>Посмотреть еще</button>
                    </>
                  ) : (
                    <button className="view-more-btn" onClick={handleAddPlantClick}>Добавить растение</button>
                  )}
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
                <h2>Зарегистрируйся,
                    <br />
                    чтобы знать больше
                    <br />
                    о своих растениях!</h2>
                <div className="buttonContainerStyle">
                  <button
                    type="submit"
                    className="registration-buttom"
                    style={{ margin: "0 auto" }}
                  >
                    <Link to="/auth/signup" className="LinkSelectR">Зарегистрироваться</Link>
                  </button>
                </div>

                <div style={{ margin: "1vh" }}>
                  <span style={{ fontSize: "1.7vh" }} className="login-link">
                    Есть аккаунт? <Link to="/auth/signin" className="LinkSelect">Войти</Link>
                  </span>
                </div>
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