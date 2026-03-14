import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import "./MyPlant.css";

// Хук для определения мобильного устройства
function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

function MyPlant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // для бургер-меню

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const isMobile = useMobile();

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

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={"/logo.svg"} alt="Florally" className="logo" />
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

  //МОБИЛЬНАЯ ВЕРСИЯ
  if (isMobile) {
    return (
      <div className="mobile-app">
        
        
      </div>
    );
  }

  //ДЕСКТОПНАЯ ВЕРСИЯ
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
      <main className="my-plants-content">
        <section className="left_side_plants">
          <p className="p_center">Мои растения</p>
          <div className="side_elements">
            <div className="element">
              <img className="zamiokulcas_left_side" src="/zamiokulcas_plant.svg" alt="" />
              <p className="plant_name">Замиокулькас</p>
              <p className="place_of_plant">Комната: Спальня</p>
            </div>
          
            <div className="element">
              <img className="zamiokulcas_left_side" src="/zamiokulcas_plant.svg" alt="" />
              <p className="plant_name">Замиокулькас</p>
              <p className="place_of_plant">Комната: Спальня</p>
            </div>
            <div className="element">
              <img className="zamiokulcas_left_side" src="/zamiokulcas_plant.svg" alt="" />
              <p className="plant_name">Замиокулькас</p>
              <p className="place_of_plant">Комната: Спальня</p>
            </div>
            <div className="element">
              
                <div style={{display:'flex' , justifyContent:'center' , alignItems:'flex-end' , height:'131px' , width:'212px'}}>
                  <button className="button_add">+</button>
                </div>
                <p className="add_new_plant_new_place">Добавить <br /> новое растение</p>

              
            </div>

          </div>
          
        
        </section>
        <div className="vertical_line"></div>

        <section className="right_side_rooms">
          <p className="p_center">Мои комнаты</p>
          <div className="side_elements">

                <div>   
                <div className="element" style={{display:'flex' , flexWrap:'wrap'}}>
                  <img style={{width:'92px' , height:'92px' ,borderRadius: '20px'   , margin:'8px 12px 12px 8px '}} src="/zamiokulcas_plant.svg" alt="" />
                  <img  style={{width:'92px' , height:'92px' ,borderRadius: '20px' , margin:'8px 8px 0 0' }} src="/zamiokulcas_plant.svg" alt="" />
                  <img  style={{width:'92px' , height:'92px' ,borderRadius: '20px' , margin:'0 12px 8px 8px'}} src="/zamiokulcas_plant.svg" alt="" />
                  <div style={{width:'92px' , height:'92px' ,borderRadius: '20px' , margin:"0 8px 8px 0" }}><button className="button_room">+</button></div>
                </div>
                <p style={{fontWeight:'500' , fontSize:'16px' ,marginTop:'12px'}}>Спальня</p>
                </div> 

                <div className="element">
              
                <div style={{display:'flex' , justifyContent:'center' , alignItems:'flex-end' , height:'131px' , width:'212px'}}>
                  <button className="button_add">+</button>
                </div>
                <p className="add_new_plant_new_place">Добавить<br />новую комнату</p>
                </div>                
          </div>          
        </section>
      </main>
    </div>
  );
}

export default MyPlant;
