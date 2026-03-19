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
  
  // Состояния для модального окна
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const isMobile = useMobile();

  // Функции для модального окна
  const openModal = (plant) => {
    setSelectedPlant(plant);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPlant(null);
  };

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
        <header className="mobile_header header">
          <div className="header-content">
            <img src={"/logo.svg"} alt="Florally" className="mobile_logo logo" />
          </div>
        </header> 
        <h1 className="my_plant_mobile">Мои Растения</h1>
        <section className="section_mobile">
          
          <div className="element_mobile" onClick={() => openModal({
            name: "Замиокулькас", 
            room: "Спальня",
            image: "/zamiokulcas_plant.svg"
          })}>
            <img className="zamiokulcas_mobile" src="/zamiokulcas_plant.svg" alt="" />
            <p className="plant_name_mobile">Замиокулькас</p>
            <p className="place_of_plant_mobile">Комната: Спальня</p>
          </div>

          <div className="element_mobile" onClick={() => openModal({
            name: "Замиокулькас", 
            room: "Спальня",
            image: "/zamiokulcas_plant_2.svg"
          })}>
            <img className="zamiokulcas_mobile" src="/zamiokulcas_plant_2.svg" alt="" />
            <p className="plant_name_mobile">Замиокулькас</p>
            <p className="place_of_plant_mobile">Комната: Спальня</p>
          </div>

          <div className="element_mobile" onClick={() => openModal({
            name: "Замиокулькас", 
            room: "Спальня",
            image: "/zamiokulcas_plant_3.svg"
          })}>
            <img className="zamiokulcas_mobile" src="/zamiokulcas_plant_3.svg" alt="" />
            <p className="plant_name_mobile">Замиокулькас</p>
            <p className="place_of_plant_mobile">Комната: Спальня</p>
          </div>

          <div className="element_mobile">
            <div style={{display:'flex' , justifyContent:'center' , alignItems:'flex-end' , height:'99px' , width:'162px'}}>
              <button className="button_add_mobile">+</button>
            </div>
            <p className="add_new_plant_new_place_mobile">Добавить <br /> новое растение</p>
          </div>
        </section>

        <p className="my_rooms_mobile">Мои комнаты</p>
        
        <section className="section_mobile">
          <div style={{textAlign:'center'}}>
            <div className="element_mobile" style={{display:'flex' , flexWrap:'wrap'}}>
              <img style={{width:'64px' , height:'64px' , margin:'11px 12px 12px 11px '}} src="/zamiokulcas_plant_square.svg" alt="" />
              <img  style={{width:'64px' , height:'64px' , margin:'11px 11px 0 0'  }} src="/zamiokulcas_plant_2_square.svg" alt="" />
              <img  style={{width:'64px' , height:'64px' , margin:'0 12px 11px 11px' }} src="/zamiokulcas_plant_3_square.svg" alt="" />
              <button className="button_room_mobile">+</button>
            </div>
            <p style={{fontWeight:'500' , fontSize:'12px' ,marginTop:'8px'}}>Спальня</p>
          </div>

          <div className="element_mobile">
            <div style={{display:'flex' , justifyContent:'center' , alignItems:'flex-end' , height:'99px' , width:'162px'}}>
              <button className="button_add_mobile">+</button>
            </div>
            <p className="add_new_plant_new_place_mobile">Добавить <br /> новое растение</p>
          </div>
        </section>

        <footer className="footer mobile_header">
          <img style={{height:'36px'}} src="/icons_frame.svg" alt="" />
        </footer>

        {/* Модальное окно для мобильной версии */}
        {modalOpen && (
           <div className="modal-overlay" onClick={closeModal}>
          <section className="modal-content" onClick={e => e.stopPropagation()}>
            {/*<button className="modal-close" onClick={closeModal}>×</button>*/}
            <div style={{display:"inline-flex"}}>
              <img className="modal_img_plant_dekstop" src={selectedPlant?.image} alt={selectedPlant?.name}/>
              <div style={{marginLeft:"33px"}}>
                <h1 style={{fontSize:"36px" , fontWeight:"500" ,color:"#2E2E2E" , margin:"0"}}>{selectedPlant?.name}</h1>
                <p style={{fontSize:"16px" ,color:"#2E2E2E" , fontWeight:"450" }}>Комната: {selectedPlant?.room}</p>
              </div>
            </div>
            <h1 style={{fontSize:"36px" , fontWeight:"500" ,color:"#2E2E2E" , margin:"0" , marginTop:"36px"}}>Уход за растением</h1>
            <div style={{marginTop:"20px"}}>
                <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex" , alignItems:"center"}}>
                  <img style={{width:"52px" , height:"52px"}} src="/plant_light.svg" alt=""/>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Полив</p>
                    <p style={{fontSize:"20px"}}>Комната: {selectedPlant?.room}</p>
                  </div>
                </div>    
              </div>
              <hr style={{width:"100%", marginBottom:"14px" , opacity:"50%" , borderColor:"#A8C686"}}/>

              <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex" , alignItems:"center"}}>
                  <img style={{width:"52px" , height:"52px"}} src="/plant_light.svg" alt=""/>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Удобрение</p>
                    <p style={{fontSize:"20px"}}>Комната: {selectedPlant?.room}</p>
                  </div>
                </div>    
              </div>
              <hr style={{width:"100%" , marginBottom:"14px" , opacity:"50%" , borderColor:"#A8C686"}}/>

              <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex"}}>
                  <div style={{display:"flex" , alignItems:"center"}}><img style={{width:"52px" , height:"52px"}} src="/plant_add_smth.svg" alt=""/></div>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Пересадка ▽ </p>
                  </div>
                </div>    
              </div>
             
            </div>
            

            <footer className="modal_footer">
              <button style={{backgroundColor:"#A8C686" , color:"white", width:"252px" , height:"43px" , fontSize:"16px" , marginRight:"12px"  }}>Сохранить изменения</button>
              <button style={{backgroundColor:"#DF7171" , color:"white" , width:"252px" , height:"43px" , fontSize:"16px" , borderColor:"#DF7171" }}>Удалить растение</button>
            </footer>
          </section>
          
        </div>
        )}
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
            <div className="element" onClick={() => openModal({
              name: "Замиокулькас", 
              room: "Спальня",
              image: "/zamiokulcas_plant.svg"
            })}>
              <img className="zamiokulcas_left_side" src="/zamiokulcas_plant.svg" alt="" />
              <p className="plant_name">Замиокулькас</p>
              <p className="place_of_plant">Комната: Спальня</p>
            </div>
          
            <div className="element" onClick={() => openModal({
              name: "Замиокулькас", 
              room: "Спальня",
              image: "/zamiokulcas_plant_square.svg"
            })}>
              <img className="zamiokulcas_left_side" src="/zamiokulcas_plant.svg" alt="" />
              <p className="plant_name">Замиокулькас</p>
              <p className="place_of_plant">Комната: Спальня</p>
            </div>

            <div className="element" onClick={() => openModal({
              name: "Замиокулькас", 
              room: "Спальня",
              image: "/zamiokulcas_plant_square.svg"
            })}>
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
                  <img style={{width:'92px' , height:'92px' , margin:'8px 12px 12px 8px '}} src="/zamiokulcas_plant_square.svg" alt="" />
                  <img  style={{width:'92px' , height:'92px' , margin:'8px 8px 0 0'  }} src="/zamiokulcas_plant_2_square.svg" alt="" />
                  <img  style={{width:'92px' , height:'92px' , margin:'0 12px 8px 8px' }} src="/zamiokulcas_plant_3_square.svg" alt="" />
                  <button className="button_room">+</button>
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

      {/* Модальное окно для десктопной версии */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <section className="modal-content" onClick={e => e.stopPropagation()}>
            {/*<button className="modal-close" onClick={closeModal}>×</button>*/}
            <div style={{display:"inline-flex"}}>
              <img className="modal_img_plant_dekstop" src={selectedPlant?.image} alt={selectedPlant?.name}/>
              <div style={{marginLeft:"33px"}}>
                <h1 style={{fontSize:"36px" , fontWeight:"500" ,color:"#2E2E2E" , margin:"0"}}>{selectedPlant?.name}</h1>
                <p style={{fontSize:"16px" ,color:"#2E2E2E" , fontWeight:"450" }}>Комната: {selectedPlant?.room}</p>
              </div>
            </div>
            <h1 style={{fontSize:"36px" , fontWeight:"500" ,color:"#2E2E2E" , margin:"0" , marginTop:"36px"}}>Уход за растением</h1>
            <div style={{marginTop:"20px"}}>
                <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex" , alignItems:"center"}}>
                  <img style={{width:"52px" , height:"52px"}} src="/plant_light.svg" alt=""/>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Полив</p>
                    <p style={{fontSize:"20px"}}>Комната: {selectedPlant?.room}</p>
                  </div>
                </div>    
              </div>
              <hr style={{width:"100%", marginBottom:"14px" , opacity:"50%" , borderColor:"#A8C686"}}/>

              <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex" , alignItems:"center"}}>
                  <img style={{width:"52px" , height:"52px"}} src="/plant_light.svg" alt=""/>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Удобрение</p>
                    <p style={{fontSize:"20px"}}>Комната: {selectedPlant?.room}</p>
                  </div>
                </div>    
              </div>
              <hr style={{width:"100%" , marginBottom:"14px" , opacity:"50%" , borderColor:"#A8C686"}}/>

              <div style={{width:"100%" , height:"80px" , display:"flex" , alignItems:"center"}}>
                
                <div style={{display:"inline-flex"}}>
                  <div style={{display:"flex" , alignItems:"center"}}><img style={{width:"52px" , height:"52px"}} src="/plant_add_smth.svg" alt=""/></div>
                  <div style={{marginLeft:"14px"}} >
                    <p style={{fontSize:"24px" , fontWeight:"450"}}> Пересадка ▽ </p>
                  </div>
                </div>    
              </div>
             
            </div>
            

            <footer className="modal_footer">
              <button style={{backgroundColor:"#A8C686" , color:"white", width:"252px" , height:"43px" , fontSize:"16px" , marginRight:"12px"  }}>Сохранить изменения</button>
              <button style={{backgroundColor:"#DF7171" , color:"white" , width:"252px" , height:"43px" , fontSize:"16px" , borderColor:"#DF7171" }}>Удалить растение</button>
            </footer>
          </section>
          
        </div>
      )}
    </div>
  );
}

export default MyPlant;
