import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import { 
  getAllPlants, 
  getUserPlants, 
  addUserPlant, 
  deleteUserPlant, 
  updateUserPlant,
  Plant,
  UserPlant 
} from "../../api/plantsApi";
import "./MyPlant.css";

// Тип для комнаты
interface Room {
  id: string;
  name: string;
  userPlants: UserPlant[];
}

// Тип для выбранного растения в модальном окне
interface SelectedPlant {
  id: string;
  name: string;
  room: string;
  image: string;
  description: string;
  season: string;
  customCare?: any[];
}

// Компонент для отображения фото с обработкой ошибок
const PlantImage: React.FC<{ 
  src: string | null; 
  alt: string; 
  className?: string; 
  style?: React.CSSProperties;
}> = ({ src, alt, className, style }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div 
        className={className} 
        style={{ 
          ...style, 
          backgroundColor: '#E0E0E0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <span style={{ fontSize: '12px', color: '#999' }}>Нет фото</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={className} 
        style={{ 
          ...style, 
          backgroundColor: '#F5F5F5', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <div style={{ width: '20px', height: '20px', border: '2px solid #A8C686', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
      onLoad={() => setIsLoading(false)}
    />
  );
};

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
  
  // Состояния для данных
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allPlants, setAllPlants] = useState<Plant[]>([]);
  const [searchResults, setSearchResults] = useState<Plant[]>([]);
  
  // Состояния для модальных окон
  const [modalOpen, setModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<SelectedPlant | null>(null);
  const [addPlantModalOpen, setAddPlantModalOpen] = useState(false);
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [addToRoomModalOpen, setAddToRoomModalOpen] = useState(false);
  const [addCustomCareModalOpen, setAddCustomCareModalOpen] = useState(false);
  const [selectedRoomForAdd, setSelectedRoomForAdd] = useState<string>("");
  const [selectedRoomForPlant, setSelectedRoomForPlant] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedPlantToAdd, setSelectedPlantToAdd] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  
  // Состояния для добавления пользовательского поля
  const [newCareTitle, setNewCareTitle] = useState("");
  const [newCareDescription, setNewCareDescription] = useState("");

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const isMobile = useMobile();

  // Загрузка данных с бэкенда
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем все растения для поиска
      const plants = await getAllPlants();
      setAllPlants(plants);
      
      // Загружаем растения пользователя
      const userPlantsData = await getUserPlants();
      setUserPlants(userPlantsData);
      
      // Группируем по комнатам
      const roomsMap = new Map<string, UserPlant[]>();
      userPlantsData.forEach((plant) => {
        const roomName = plant.room || "Без комнаты";
        if (!roomsMap.has(roomName)) {
          roomsMap.set(roomName, []);
        }
        roomsMap.get(roomName)!.push(plant);
      });
      
      const roomsArray: Room[] = Array.from(roomsMap.entries()).map(([name, plants]) => ({
        id: name,
        name: name,
        userPlants: plants,
      }));
      
      setRooms(roomsArray);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // Поиск растений
  const handleSearchPlants = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = allPlants.filter(plant =>
      plant.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  // Добавление нового растения пользователю
  const handleAddUserPlant = async () => {
    if (selectedPlantToAdd) {
      try {
        await addUserPlant(selectedPlantToAdd.id, selectedColor);
        await loadData(); // Перезагружаем данные
        setAddPlantModalOpen(false);
        setSelectedPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedRoomForAdd("");
        alert("Растение успешно добавлено!");
      } catch (error) {
        console.error("Ошибка при добавлении растения:", error);
        alert("Ошибка при добавлении растения");
      }
    }
  };

  // Добавление растения в комнату
  const handleAddPlantToRoom = async () => {
    if (selectedPlantToAdd && selectedRoomForPlant) {
      try {
        const newUserPlant = await addUserPlant(selectedPlantToAdd.id, selectedColor);
        await updateUserPlant(newUserPlant.id, { room: selectedRoomForPlant.name });
        await loadData();
        setAddToRoomModalOpen(false);
        setSelectedPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        alert(`Растение добавлено в комнату "${selectedRoomForPlant.name}"!`);
        
        if (roomModalOpen && selectedRoom && selectedRoom.name === selectedRoomForPlant.name) {
          const updatedRoom = rooms.find(r => r.name === selectedRoomForPlant.name);
          if (updatedRoom) {
            setSelectedRoom(updatedRoom);
          }
        }
      } catch (error) {
        console.error("Ошибка при добавлении растения:", error);
        alert("Ошибка при добавлении растения");
      }
    }
  };

  // Удаление растения
  const handleDeleteUserPlant = async (userPlantId: string) => {
    const confirmDelete = window.confirm("Вы уверены, что хотите удалить это растение?");
    if (confirmDelete) {
      try {
        await deleteUserPlant(userPlantId);
        await loadData();
        setModalOpen(false);
        alert("Растение успешно удалено!");
      } catch (error) {
        console.error("Ошибка при удалении растения:", error);
        alert("Ошибка при удалении растения");
      }
    }
  };

  // Добавление комнаты (локально, так как на бэкенде пока нет комнат)
  const addNewRoom = () => {
    if (!newRoomName.trim()) {
      alert("Введите название комнаты");
      return;
    }

    if (rooms.some(room => room.name === newRoomName.trim())) {
      alert("Комната с таким названием уже существует");
      return;
    }

    const newRoom: Room = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      userPlants: [],
    };

    setRooms([...rooms, newRoom]);
    setAddRoomModalOpen(false);
    setNewRoomName("");
    alert("Комната успешно добавлена!");
  };

  // Обновление цвета растения
  const handleUpdateColor = async (userPlantId: string, color: string) => {
    try {
      await updateUserPlant(userPlantId, { color });
      await loadData();
      alert("Цвет успешно обновлен!");
    } catch (error) {
      console.error("Ошибка при обновлении цвета:", error);
      alert("Ошибка при обновлении цвета");
    }
  };

  // Открытие модального окна комнаты
  const openRoomModal = (room: Room) => {
    setSelectedRoom(room);
    setRoomModalOpen(true);
  };

  // Функции для модального окна просмотра растения
  const openPlantModal = (plant: UserPlant) => {
    setSelectedPlant({
      id: plant.id,
      name: plant.plant.name,
      room: plant.room || "Без комнаты",
      image: plant.plant.photo || "",
      description: plant.plant.description,
      season: plant.plant.season,
      customCare: []
    });
    setModalOpen(true);
  };

  const closePlantModal = () => {
    setModalOpen(false);
    setSelectedPlant(null);
  };

  // Получение фото растения
  const getPlantPhoto = (plant: Plant | undefined): string => {
    if (!plant) return "";
    return plant.photo || "";
  };

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);
        
        if (authData.isAuthenticated) {
          await loadData();
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

  // Дебаунс для поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addPlantModalOpen || addToRoomModalOpen) {
        handleSearchPlants(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, addPlantModalOpen, addToRoomModalOpen, allPlants]);

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
      setUserPlants([]);
      setRooms([]);

      if (location.pathname === "/user") {
        navigate("/");
      }
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      alert("Произошла ошибка при выходе из системы");
    }
  };

  // Добавляем анимацию спиннера в CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
            <p>Загрузка данных...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
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
        <main className="my-plants-content">
          <div className="login-required-container">
            <h2>Войдите в систему</h2>
            <p>Чтобы просматривать свои растения, пожалуйста, войдите в аккаунт</p>
            <button className="auth-button login-button" onClick={handleLoginClick}>
              Войти
            </button>
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
            <div className="user-info">
              <button className="auth-button logout-button" onClick={handleLogoutClick}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="my-plants-content">
        {/* Левая секция - Мои растения */}
        <section className="left_side_plants" style={{overflowY: 'auto', maxHeight: 'calc(100vh - 74px)'}}>
          <p className="p_center">Мои растения</p>
          <div className="side_elements">
            
            {userPlants.map((plant) => (
              <div 
                key={plant.id} 
                className="element" 
                onClick={() => openPlantModal(plant)}
                style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '212px'}}
              >
                <div style={{width: '196px', height: '148px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: '20px', marginTop: '8px', overflow: 'hidden'}}>
                  <PlantImage
                    src={plant.plant.photo}
                    alt={plant.plant.name}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </div>
                <p className="plant_name">{plant.plant.name}</p>
                <p className="place_of_plant">Комната: {plant.room || "Без комнаты"}</p>
              </div>
            ))}

            <div className="element" onClick={() => setAddPlantModalOpen(true)} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{display:'flex', justifyContent:'center', alignItems:'flex-end', height:'148px', width:'196px'}}>
                <button className="button_add">+</button>
              </div>
              <p className="add_new_plant_new_place">Добавить <br /> новое растение</p>
            </div>

          </div>
        </section>
        
        <div className="vertical_line"></div>

        {/* Правая секция - Мои комнаты */}
        <section className="right_side_rooms" style={{overflowY: 'auto', maxHeight: 'calc(100vh - 74px)'}}>
          <p className="p_center">Мои комнаты</p>
          <div className="side_elements">

            {rooms.map((room) => (
              <div key={room.id} onClick={() => openRoomModal(room)} style={{cursor: 'pointer'}}>   
                <div className="element" style={{display:'flex', flexWrap:'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '212px'}}>
                  {room.userPlants.slice(0, 2).map((plant: UserPlant) => (
                    <div key={plant.id} style={{width: '92px', height: '92px', margin: '8px 12px 12px 8px'}}>
                      <PlantImage
                        src={plant.plant.photo}
                        alt={plant.plant.name}
                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px'}}
                      />
                    </div>
                  ))}
                  <button 
                    className="button_room"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoomForPlant(room);
                      setAddToRoomModalOpen(true);
                    }}
                  >
                    +
                  </button>
                </div>
                <p style={{fontWeight:'500', fontSize:'16px', marginTop:'12px', textAlign: 'center'}}>{room.name}</p>
              </div> 
            ))}

            <div className="element" onClick={() => setAddRoomModalOpen(true)} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{display:'flex', justifyContent:'center', alignItems:'flex-end', height:'131px', width:'212px'}}>
                <button className="button_add">+</button>
              </div>
              <p className="add_new_plant_new_place">Добавить<br />новую комнату</p>
            </div>                
          </div>          
        </section>
      </main>

      {/* Модальное окно комнаты */}
      {roomModalOpen && selectedRoom && (
        <div className="modal-overlay" onClick={() => setRoomModalOpen(false)}>
          <section className="modal-content" onClick={e => e.stopPropagation()} style={{width: '70%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{margin: 0, fontSize: '28px'}}>{selectedRoom.name}</h2>
              <button onClick={() => setRoomModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer'}}>×</button>
            </div>
            
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start'}}>
              {selectedRoom.userPlants.map((plant) => (
                <div 
                  key={plant.id} 
                  onClick={() => {
                    setRoomModalOpen(false);
                    openPlantModal(plant);
                  }}
                  style={{
                    width: '180px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{width: '148px', height: '112px', margin: '0 auto', backgroundColor: '#F5F5F5', borderRadius: '12px', overflow: 'hidden'}}>
                    <PlantImage
                      src={plant.plant.photo}
                      alt={plant.plant.name}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                  <p style={{fontWeight: '500', margin: '12px 0 4px 0', fontSize: '16px'}}>{plant.plant.name}</p>
                  <p style={{fontSize: '12px', color: '#666', margin: 0}}>Кликните для деталей</p>
                </div>
              ))}
              
              <div 
                onClick={() => {
                  setSelectedRoomForPlant(selectedRoom);
                  setAddToRoomModalOpen(true);
                  setRoomModalOpen(false);
                }}
                style={{
                  width: '180px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '180px',
                  transition: 'background-color 0.2s'
                }}
              >
                <button className="button_add" style={{width: '60px', height: '60px', fontSize: '28px'}}>+</button>
                <p style={{marginTop: '16px', fontSize: '14px', fontWeight: '500'}}>Добавить растение</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Модальное окно для просмотра растения */}
      {modalOpen && selectedPlant && (
        <div className="modal-overlay" onClick={closePlantModal}>
          <section className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={{display:"inline-flex", gap: "33px", flexWrap: "wrap"}}>
              <div style={{width: '220px', height: '220px', backgroundColor: '#F5F5F5', borderRadius: '20px', overflow: 'hidden'}}>
                <PlantImage
                  src={selectedPlant.image}
                  alt={selectedPlant.name}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              </div>
              <div>
                <h1 style={{fontSize:"36px", fontWeight:"500", color:"#2E2E2E", margin:"0"}}>{selectedPlant.name}</h1>
                <p style={{fontSize:"16px", color:"#2E2E2E", fontWeight:"450" }}>Комната: {selectedPlant.room}</p>
                <div style={{marginTop: "10px"}}>
                  <label>Цвет фона: </label>
                  <input 
                    type="color" 
                    value={userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF"}
                    onChange={(e) => {
                      const plant = userPlants.find(p => p.id === selectedPlant.id);
                      if (plant) handleUpdateColor(plant.id, e.target.value);
                    }}
                    style={{marginLeft: "10px"}}
                  />
                </div>
              </div>
            </div>
            
            <h1 style={{fontSize:"36px", fontWeight:"500", color:"#2E2E2E", margin:"0", marginTop:"36px"}}>Уход за растением</h1>
            
            <div style={{marginTop:"20px"}}>
              <div style={{width:"100%", display:"flex", alignItems:"center", marginBottom: "15px"}}>
                <img style={{width:"52px", height:"52px"}} src="/plant_light.svg" alt=""/>
                <div style={{marginLeft:"14px"}}>
                  <p style={{fontSize:"24px", fontWeight:"450"}}>Описание</p>
                  <p style={{fontSize:"20px"}}>{selectedPlant.description}</p>
                </div>
              </div>
              <hr style={{width:"100%", marginBottom:"14px", opacity:"50%", borderColor:"#A8C686"}}/>

              <div style={{width:"100%", display:"flex", alignItems:"center", marginBottom: "15px"}}>
                <img style={{width:"52px", height:"52px"}} src="/plant_light.svg" alt=""/>
                <div style={{marginLeft:"14px"}}>
                  <p style={{fontSize:"24px", fontWeight:"450"}}>Сезон</p>
                  <p style={{fontSize:"20px"}}>{selectedPlant.season}</p>
                </div>
              </div>
              <hr style={{width:"100%", marginBottom:"14px", opacity:"50%", borderColor:"#A8C686"}}/>
            </div>
            
            <footer className="modal_footer" style={{marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end"}}>
              <button 
                style={{backgroundColor:"#DF7171", color:"white", width:"252px", height:"43px", fontSize:"16px", border: "none", borderRadius: "8px", cursor: "pointer"}}
                onClick={() => handleDeleteUserPlant(selectedPlant.id)}
              >
                Удалить растение
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Модальное окно для добавления растения */}
      {addPlantModalOpen && (
        <div className="modal-overlay" onClick={() => setAddPlantModalOpen(false)}>
          <section className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Добавить растение</h2>
            <input
              type="text"
              placeholder="Поиск растения..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc"}}
            />
            
            {searchResults.length > 0 && (
              <div style={{maxHeight: "300px", overflowY: "auto", margin: "10px 0"}}>
                {searchResults.map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => setSelectedPlantToAdd(plant)}
                    style={{
                      padding: "10px",
                      border: selectedPlantToAdd?.id === plant.id ? "2px solid #A8C686" : "1px solid #eee",
                      borderRadius: "8px",
                      margin: "5px 0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{width: "40px", height: "40px", backgroundColor: "#F5F5F5", borderRadius: "8px", overflow: "hidden"}}>
                      <PlantImage
                        src={plant.photo}
                        alt={plant.name}
                        style={{width: "100%", height: "100%", objectFit: "cover"}}
                      />
                    </div>
                    <div>
                      <strong>{plant.name}</strong>
                      <p style={{fontSize: "12px", margin: "0"}}>{plant.season}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPlantToAdd && (
              <div style={{marginTop: "10px"}}>
                <label>Выбрать комнату: </label>
                <select 
                  value={selectedRoomForAdd}
                  onChange={(e) => setSelectedRoomForAdd(e.target.value)}
                  style={{marginLeft: "10px", padding: "5px", borderRadius: "5px"}}
                >
                  <option value="">Без комнаты</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))}
                </select>
                
                <div style={{marginTop: "10px"}}>
                  <label>Цвет фона: </label>
                  <input 
                    type="color" 
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{marginLeft: "10px"}}
                  />
                </div>
              </div>
            )}

            <footer className="modal_footer">
              <button 
                style={{backgroundColor:"#A8C686", color:"white", width:"100%", height:"43px", fontSize:"16px", border: "none", borderRadius: "8px", cursor: "pointer"}}
                onClick={handleAddUserPlant}
                disabled={!selectedPlantToAdd}
              >
                Добавить
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Модальное окно для добавления растения в комнату */}
      {addToRoomModalOpen && selectedRoomForPlant && (
        <div className="modal-overlay" onClick={() => setAddToRoomModalOpen(false)}>
          <section className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Добавить растение в "{selectedRoomForPlant.name}"</h2>
            <input
              type="text"
              placeholder="Поиск растения..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc"}}
            />
            
            {searchResults.length > 0 && (
              <div style={{maxHeight: "300px", overflowY: "auto", margin: "10px 0"}}>
                {searchResults.map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => setSelectedPlantToAdd(plant)}
                    style={{
                      padding: "10px",
                      border: selectedPlantToAdd?.id === plant.id ? "2px solid #A8C686" : "1px solid #eee",
                      borderRadius: "8px",
                      margin: "5px 0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{width: "40px", height: "40px", backgroundColor: "#F5F5F5", borderRadius: "8px", overflow: "hidden"}}>
                      <PlantImage
                        src={plant.photo}
                        alt={plant.name}
                        style={{width: "100%", height: "100%", objectFit: "cover"}}
                      />
                    </div>
                    <div>
                      <strong>{plant.name}</strong>
                      <p style={{fontSize: "12px", margin: "0"}}>{plant.season}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPlantToAdd && (
              <div style={{marginTop: "10px"}}>
                <label>Цвет фона: </label>
                <input 
                  type="color" 
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{marginLeft: "10px"}}
                />
              </div>
            )}

            <footer className="modal_footer">
              <button 
                style={{backgroundColor:"#A8C686", color:"white", width:"100%", height:"43px", fontSize:"16px", border: "none", borderRadius: "8px", cursor: "pointer"}}
                onClick={handleAddPlantToRoom}
                disabled={!selectedPlantToAdd}
              >
                Добавить в комнату
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Модальное окно для добавления комнаты */}
      {addRoomModalOpen && (
        <div className="modal-overlay" onClick={() => setAddRoomModalOpen(false)}>
          <section className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Добавить комнату</h2>
            <input
              type="text"
              placeholder="Название комнаты..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              style={{width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc"}}
            />
            <footer className="modal_footer">
              <button 
                style={{backgroundColor:"#A8C686", color:"white", width:"100%", height:"43px", fontSize:"16px", border: "none", borderRadius: "8px", cursor: "pointer"}}
                onClick={addNewRoom}
              >
                Добавить
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default MyPlant;