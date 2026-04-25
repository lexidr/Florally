import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import { 
  getAllPlants, 
  getUserPlants, 
  addUserPlant, 
  deleteUserPlant, 
  updateUserPlant,
} from "../../api/plantsApi";
import { API } from "../../constants/api";
import {
  getUserRooms,
  createRoom,
  deleteRoom,
  addPlantToRoom,
  removePlantFromRoom,
  type Room,
  type UserPlant,
  type Plant,
} from "../../api/roomsApi";
import "./MyPlant.css";

interface Comment {
  id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

async function fetchComments(userPlantId: string): Promise<Comment[]> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/user-plant/${userPlantId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch comments:", errorText);
    throw new Error("Failed to fetch comments");
  }
  return response.json();
}

async function createComment(userPlantId: string, text: string): Promise<Comment> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ user_plant_id: userPlantId, text }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to create comment:", errorText);
    throw new Error("Failed to create comment");
  }
  return response.json();
}

async function deleteComment(commentId: string): Promise<void> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to delete comment:", errorText);
    throw new Error("Failed to delete comment");
  }
}

interface SelectedPlant {
  id: string;
  name: string;
  room: string;
  roomId?: string;
  image: string;
  description: string;
  season: string;
  customCare?: any[];
}

const PlantImage: React.FC<{ 
  src: string | null | undefined; 
  alt: string; 
  className?: string; 
  style?: React.CSSProperties;
}> = ({ src, alt, className, style }) => {
  const [hasError, setHasError] = useState(false);
  const plugImage = "/plug-image-plant.png"; 

  const imageSrc = (hasError || !src || src.trim() === "") ? plugImage : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{ 
        ...style, 
        objectFit: 'cover', 
        display: 'block' 
      }}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
};

function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 810) {
        setScreenSize('mobile');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
}

function MyPlant() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allPlants, setAllPlants] = useState<Plant[]>([]);
  const [searchResults, setSearchResults] = useState<Plant[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<SelectedPlant | null>(null);
  const [addPlantModalOpen, setAddPlantModalOpen] = useState(false);
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [addToRoomModalOpen, setAddToRoomModalOpen] = useState(false);
  const [selectedRoomForAdd, setSelectedRoomForAdd] = useState<string>("");
  const [selectedRoomForPlant, setSelectedRoomForPlant] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedPlantToAdd, setSelectedPlantToAdd] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [searchError, setSearchError] = useState<string>("");
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("🌱 MyPlant: Начинаем загрузку данных...");
      
      const plants = await getAllPlants();
      setAllPlants(plants || []);
      
      const userPlantsData = await getUserPlants();
      setUserPlants(userPlantsData as unknown as UserPlant[]);
      
      const roomsData = await getUserRooms();
      setRooms(roomsData || []);
      
    } catch (error: any) {
      console.error(" MyPlant: Ошибка при загрузке данных:", error);
      setSearchError("Ошибка загрузки данных. Проверьте подключение к серверу.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPlants = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    
    if (allPlants.length === 0) {
      setSearchError("База растений пуста. Нет данных для поиска.");
      setSearchResults([]);
      return;
    }
    
    const results = allPlants.filter(plant =>
      plant.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length === 0) {
      setSearchError("Растения не найдены. Попробуйте другой запрос.");
    } else {
      setSearchError("");
    }
    
    setSearchResults(results);
  };

  const handleAddUserPlant = async () => {
    if (selectedPlantToAdd) {
      try {
        const newPlant = await addUserPlant(selectedPlantToAdd.id, selectedColor);
        
        if (selectedRoomForAdd) {
          const room = rooms.find(r => r.name === selectedRoomForAdd);
          if (room) {
            await addPlantToRoom(room.id, newPlant.id);
          }
        }
        
        await loadData();
        setAddPlantModalOpen(false);
        setSelectedPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedRoomForAdd("");
        setSearchError("");
      } catch (error) {
        console.error(" MyPlant: Ошибка при добавлении растения:", error);
      }
    }
  };

  const handleAddPlantToRoom = async () => {
    if (selectedPlantToAdd && selectedRoomForPlant) {
      try {
        let userPlantId = userPlants.find(p => p.plant.id === selectedPlantToAdd.id)?.id;
        
        if (!userPlantId) {
          const newPlant = await addUserPlant(selectedPlantToAdd.id, selectedColor);
          userPlantId = newPlant.id;
        }
        
        await addPlantToRoom(selectedRoomForPlant.id, userPlantId);
        await loadData();
        
        setAddToRoomModalOpen(false);
        setSelectedPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        setSearchError("");
        
        if (roomModalOpen && selectedRoom && selectedRoom.id === selectedRoomForPlant.id) {
          const updatedRoom = rooms.find(r => r.id === selectedRoomForPlant.id);
          if (updatedRoom) {
            setSelectedRoom(updatedRoom);
          }
        }
      } catch (error) {
        console.error(" MyPlant: Ошибка при добавлении растения:", error);
      }
    }
  };

  const handleRemovePlantFromRoom = async (userPlantId: string, roomId: string) => {
    const confirmRemove = window.confirm("Удалить растение из этой комнаты?");
    if (confirmRemove) {
      try {
        await removePlantFromRoom(roomId, userPlantId);
        await loadData();
        
        if (roomModalOpen && selectedRoom && selectedRoom.id === roomId) {
          const updatedRoom = rooms.find(r => r.id === roomId);
          if (updatedRoom) {
            setSelectedRoom(updatedRoom);
          }
        }
      } catch (error) {
        console.error("Ошибка при удалении растения из комнаты:", error);
      }
    }
  };

  const handleDeleteUserPlant = async (userPlantId: string) => {
    const confirmDelete = window.confirm("Вы уверены, что хотите удалить это растение?");
    if (confirmDelete) {
      try {
        await deleteUserPlant(userPlantId);
        await loadData();
        setModalOpen(false);
      } catch (error) {
        console.error("MyPlant: Ошибка при удалении растения:", error);
      }
    }
  };

  const addNewRoom = async () => {
    if (!newRoomName.trim()) {
      return;
    }

    if (rooms.some(room => room.name === newRoomName.trim())) {
      ("Комната с таким названием уже существует");
      return;
    }

    try {
      await createRoom(newRoomName.trim());
      await loadData();
      setAddRoomModalOpen(false);
      setNewRoomName("");
    } catch (error: any) {
      console.error("Ошибка при создании комнаты:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    const confirmDelete = window.confirm(`Вы уверены, что хотите удалить комнату "${roomName}"? Растения в этой комнате не будут удалены.`);
    if (confirmDelete) {
      setDeletingRoomId(roomId);
      try {
        await deleteRoom(roomId);
        await loadData();
        if (roomModalOpen && selectedRoom?.id === roomId) {
          setRoomModalOpen(false);
          setSelectedRoom(null);
        }
      } catch (error) {
        console.error("Ошибка при удалении комнаты:", error);
      } finally {
        setDeletingRoomId(null);
      }
    }
  };

  const handleUpdateColor = async (userPlantId: string, color: string) => {
    try {
      await updateUserPlant(userPlantId, { color });
      await loadData();
    } catch (error) {
      console.error("Ошибка при обновлении цвета:", error);
    }
  };

  const openRoomModal = (room: Room) => {
    setSelectedRoom(room);
    setRoomModalOpen(true);
  };

  const openPlantModal = async (plant: UserPlant) => {
    const roomObj = rooms.find(r => r.userPlants.some(p => p.id === plant.id));
    setSelectedPlant({
      id: plant.id,
      name: plant.plant.name,
      room: plant.room?.name || "Без комнаты",
      roomId: roomObj?.id,
      image: plant.plant.photo || "",
      description: plant.plant.description,
      season: plant.plant.season,
      customCare: []
    });
    setModalOpen(true);
    setNewCommentText("");
    setComments([]);
    setCommentsLoading(true);
    try {
      const loaded = await fetchComments(plant.id);
      setComments(loaded);
    } catch (e) {
      console.error("Ошибка загрузки комментариев:", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPlant || !newCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const created = await createComment(selectedPlant.id, newCommentText.trim());
      setComments(prev => [...prev, created]);
      setNewCommentText("");
    } catch (e) {
      console.error("Ошибка при добавлении комментария:", e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error("Ошибка при удалении комментария:", e);
    }
  };

  const closePlantModal = () => {
    setModalOpen(false);
    setSelectedPlant(null);
    setComments([]);
    setNewCommentText("");
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
    }
  };

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

  if (isMobile) {
    return (
      <div className="mobile-app">
        <header className="mobile-header">
          <div className="mobile-header-content">
            <img src={"/logo.svg"} alt="Florally" className="mobile-logo" />
          </div>
        </header>

        <main className="mobile-myplants-content">
          <div className="mobile-myplants-container">
            {!isLoggedIn ? (
              <div className="mobile-login-required">
                <h2>Войдите в систему</h2>
                <p>Чтобы просматривать свои растения, пожалуйста, войдите в аккаунт</p>
                <button className="mobile-login-button" onClick={handleLoginClick}>
                  Войти
                </button>
              </div>
            ) : (
              <>
                <div className="mobile-plants-section">
                  <h2 className="mobile-section-title">Мои растения</h2>
                  <div className="mobile-plants-grid">
                    {userPlants.length === 0 ? (
                      <div className="mobile-empty-message">
                        <p>У вас пока нет растений</p>
                        <p>Нажмите "+" чтобы добавить</p>
                      </div>
                    ) : (
                      userPlants.map((plant) => (
                        <div 
                          key={plant.id} 
                          className="mobile-plant-card"
                          onClick={() => openPlantModal(plant)}
                          style={{
                            backgroundColor: plant.color || "#FFFFFF",
                            borderRadius: '16px',
                            padding: '12px',
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          <div className="mobile-plant-image">
                            <PlantImage
                              src={plant.plant.photo}
                              alt={plant.plant.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px'}}
                            />
                          </div>
                          <p className="mobile-plant-name">{plant.plant.name}</p>
                          <p className="mobile-plant-room">Комната: {plant.room?.name || "Без комнаты"}</p>
                        </div>
                      ))
                    )}
                    
                    <div 
                      className="mobile-add-card"
                      onClick={() => setAddPlantModalOpen(true)}
                    >
                      <div className="mobile-add-button">+</div>
                      <p className="mobile-add-text">Добавить растение</p>
                    </div>
                  </div>
                </div>

                <div className="mobile-rooms-section">
                  <h2 className="mobile-section-title">Мои комнаты</h2>
                  <div className="mobile-rooms-grid">
                    {rooms.map((room) => (
                      <div key={room.id} className="mobile-room-card" onClick={() => openRoomModal(room)}>
                        <div className="mobile-room-preview">
                          {room.userPlants.slice(0, room.userPlants.length <= 3 ? 3 : 4).map((plant) => (
                            <div key={plant.id} className="mobile-room-preview-image" style={{
                              backgroundColor: plant.color || "#FFFFFF",
                              borderRadius: '12px',
                              padding: '2px'
                            }}>
                              <PlantImage src={plant.plant.photo} alt={plant.plant.name} style={{width:'100%', height:'100%', borderRadius: '10px'}}/>
                            </div>
                          ))}
                          {room.userPlants.length <= 3 && (
                            <button className="mobile-room-add-btn" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomForPlant(room);
                              setAddToRoomModalOpen(true);
                            }}>+</button>
                          )}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
                          <p className="mobile-room-name">{room.name}</p>
                          {/* Кнопка удаления комнаты удалена с основной страницы */}
                        </div>
                      </div>
                    ))}
                    <div className="mobile-add-card" onClick={() => setAddRoomModalOpen(true)}>
                      <div className="mobile-add-button">+</div>
                      <p className="mobile-add-text">Добавить комнату</p>
                    </div>
                  </div>
                </div>
              </>
            )}
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

        {isLoggedIn && (
          <>
            {roomModalOpen && selectedRoom && (
              <div className="modal-overlay" onClick={() => setRoomModalOpen(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{margin: 0, fontSize: '24px'}}>{selectedRoom.name}</h2>
                    <div style={{display: 'flex', gap: '12px'}}>
                      {/* Кнопка удаления комнаты - красный квадрат с белым крестиком */}
                      <button
                        onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.name)}
                        disabled={deletingRoomId === selectedRoom.id}
                        style={{
                          background: '#DF7171',
                          border: 'none',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          cursor: deletingRoomId === selectedRoom.id ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}
                      >
                        {deletingRoomId === selectedRoom.id ? '...' : '×'}
                      </button>
                      <button onClick={() => setRoomModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>×</button>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center'}}>
                    {selectedRoom.userPlants.map((plant) => (
                      <div 
                        key={plant.id} 
                        onClick={() => {
                          setRoomModalOpen(false);
                          openPlantModal(plant);
                        }}
                        style={{
                          width: '140px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          backgroundColor: plant.color || "#FFFFFF",
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                      >
                        <div style={{width: '116px', height: '88px', margin: '0 auto', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden'}}>
                          <PlantImage
                            src={plant.plant.photo}
                            alt={plant.plant.name}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                          />
                        </div>
                        <p style={{fontWeight: '500', margin: '8px 0 0 0', fontSize: '14px'}}>{plant.plant.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlantFromRoom(plant.id, selectedRoom.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(223, 113, 113, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setSelectedRoomForPlant(selectedRoom);
                        setAddToRoomModalOpen(true);
                        setRoomModalOpen(false);
                      }}
                      style={{
                        width: '140px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '140px',
                      }}
                    >
                      <button className="button_add" style={{width: '40px', height: '40px', fontSize: '24px'}}>+</button>
                      <p style={{marginTop: '8px', fontSize: '12px'}}>Добавить растение</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {modalOpen && selectedPlant && (
              <div className="modal-overlay" onClick={closePlantModal}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px'}}>
                  <div style={{display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap"}}>
                    <div style={{width: '120px', height: '120px', backgroundColor: '#F5F5F5', borderRadius: '16px', overflow: 'hidden', flexShrink: 0}}>
                      <PlantImage
                        src={selectedPlant.image}
                        alt={selectedPlant.name}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    </div>
                    <div style={{flex: 1, minWidth: '150px'}}>
                      <h2 style={{
                        fontSize: '20px', 
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: "1.3"
                      }}>
                        {selectedPlant.name}
                      </h2>
                      <p style={{
                        fontSize: '14px', 
                        color: '#666', 
                        margin: '0 0 12px 0'
                      }}>
                        Комната: {selectedPlant.room}
                      </p>
                      <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                        <label style={{fontSize: "14px"}}>Цвет фона:</label>
                        <input 
                          type="color" 
                          value={userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF"}
                          onChange={(e) => {
                            const plant = userPlants.find(p => p.id === selectedPlant.id);
                            if (plant) handleUpdateColor(plant.id, e.target.value);
                          }}
                          style={{
                            width: "40px",
                            height: "40px",
                            border: "2px solid #ddd",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <h1 style={{fontSize:"28px", fontWeight:"500", color:"#2E2E2E", margin:"0", marginTop:"36px"}}>Уход за растением</h1>
                  <div style={{marginTop:"20px"}}>
                    <div style={{
                      width:"100%", 
                      display:"flex", 
                      alignItems:"center", 
                      marginBottom: "15px",
                      backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                      borderRadius: "12px",
                      padding: "12px"
                    }}>
                      <div style={{
                        width:"52px", 
                        height:"52px", 
                        backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <img style={{width:"32px", height:"32px"}} src="/plant_light.svg" alt=""/>
                      </div>
                      <div style={{marginLeft:"14px"}}>
                        <p style={{fontSize:"20px", fontWeight:"450"}}>Описание</p>
                        <p style={{fontSize:"16px"}}>{selectedPlant.description}</p>
                      </div>
                    </div>
                    <hr style={{width:"100%", marginBottom:"14px", opacity:"50%", borderColor:"#A8C686"}}/>
                    <div style={{
                      width:"100%", 
                      display:"flex", 
                      alignItems:"center", 
                      marginBottom: "15px",
                      backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                      borderRadius: "12px",
                      padding: "12px"
                    }}>
                      <div style={{
                        width:"52px", 
                        height:"52px", 
                        backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <img style={{width:"32px", height:"32px"}} src="/plant_light.svg" alt=""/>
                      </div>
                      <div style={{marginLeft:"14px"}}>
                        <p style={{fontSize:"20px", fontWeight:"450"}}>Сезон</p>
                        <p style={{fontSize:"16px"}}>{selectedPlant.season}</p>
                      </div>
                    </div>
                    <hr style={{width:"100%", marginBottom:"14px", opacity:"50%", borderColor:"#A8C686"}}/>
                  </div>

                  <h1 style={{fontSize:"24px", fontWeight:"500", color:"#2E2E2E", margin:"28px 0 16px 0"}}>
                    Мои заметки
                  </h1>
                  <div style={{marginBottom: "20px"}}>
                    {commentsLoading ? (
                      <p style={{color:"#999", fontSize:"14px"}}>Загрузка заметок...</p>
                    ) : comments.length === 0 ? (
                      <p style={{color:"#999", fontSize:"14px"}}>Заметок пока нет. Добавьте первую!</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} style={{
                          display:"flex", 
                          alignItems:"flex-start", 
                          gap:"10px", 
                          marginBottom:"12px",
                          backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                          borderRadius: "10px",
                          padding: "10px 12px"
                        }}>
                          <div style={{
                            width:"40px", 
                            height:"40px", 
                            backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <img style={{width:"24px", height:"24px"}} src="/plant_light.svg" alt=""/>
                          </div>
                          <div style={{flex:1}}>
                            <p style={{fontSize:"14px", margin:0, lineHeight:"1.5", wordBreak:"break-word"}}>{comment.text}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:"18px", flexShrink:0, paddingTop:"10px"}}
                            onMouseEnter={e => (e.currentTarget.style.color = "#DF7171")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}
                          >×</button>
                        </div>
                      ))
                    )}
                    <hr style={{width:"100%", margin:"16px 0", opacity:"50%", borderColor:"#A8C686"}}/>
                    <div style={{display:"flex", gap:"8px", alignItems:"flex-end"}}>
                      <textarea
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        placeholder="Добавить заметку..."
                        rows={2}
                        style={{
                          flex:1,
                          resize:"vertical",
                          padding:"8px 12px",
                          borderRadius:"10px",
                          border:"1px solid #ddd",
                          fontSize:"14px",
                          fontFamily:"inherit",
                          outline:"none",
                          backgroundColor: "#FFFFFF"
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={commentSubmitting || !newCommentText.trim()}
                        style={{
                          backgroundColor: newCommentText.trim() ? "#A8C686" : "#ddd",
                          color:"white",
                          border:"none",
                          borderRadius:"10px",
                          padding:"8px 14px",
                          fontSize:"14px",
                          cursor: newCommentText.trim() ? "pointer" : "default",
                          height:"44px",
                          flexShrink:0,
                        }}
                      >
                        {commentSubmitting ? "..." : "Добавить"}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    style={{backgroundColor:"#DF7171", color:"white", width:"252px", height:"43px", fontSize:"16px", border: "none", borderRadius: "8px", cursor: "pointer"}}
                    onClick={() => handleDeleteUserPlant(selectedPlant.id)}
                  >
                    Удалить растение
                  </button>
                </section>
              </div>
            )}

            {addPlantModalOpen && (
              <div className="modal-overlay" onClick={() => setAddPlantModalOpen(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '90%', maxWidth: '500px'}}>
                  <h2>Добавить растение</h2>
                  <input
                    type="text"
                    placeholder="Поиск растения..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc'}}
                  />
                  {searchError && (
                    <div style={{color: 'red', fontSize: '12px', margin: '5px 0'}}>
                      {searchError}
                    </div>
                  )}
                  {allPlants.length === 0 && !loading && (
                    <div style={{color: 'orange', fontSize: '12px', margin: '5px 0', textAlign: 'center'}}>
                      ⚠️ База растений пуста. Обратитесь к администратору.
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div style={{maxHeight: '300px', overflowY: 'auto', margin: '10px 0'}}>
                      {searchResults.map((plant) => (
                        <div
                          key={plant.id}
                          onClick={() => setSelectedPlantToAdd(plant)}
                          style={{
                            padding: '10px',
                            border: selectedPlantToAdd?.id === plant.id ? '2px solid #A8C686' : '1px solid #eee',
                            borderRadius: '8px',
                            margin: '5px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <div style={{width: '40px', height: '40px', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden'}}>
                            <PlantImage
                              src={plant.photo}
                              alt={plant.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                          </div>
                          <div>
                            <strong>{plant.name}</strong>
                            <p style={{fontSize: '12px', margin: '0'}}>{plant.season}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && !searchError && allPlants.length > 0 && (
                    <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                      Растения не найдены
                    </div>
                  )}
                  {selectedPlantToAdd && (
                    <div style={{marginTop: '10px'}}>
                      <label>Выбрать комнату: </label>
                      <select 
                        value={selectedRoomForAdd}
                        onChange={(e) => setSelectedRoomForAdd(e.target.value)}
                        style={{marginLeft: '10px', padding: '5px', borderRadius: '5px'}}
                      >
                        <option value="">Без комнаты</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.name}>{room.name}</option>
                        ))}
                      </select>
                      <div style={{marginTop: '10px'}}>
                        <label>Цвет фона: </label>
                        <input 
                          type="color" 
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          style={{marginLeft: '10px'}}
                        />
                      </div>
                    </div>
                  )}
                  <footer style={{marginTop: '20px'}}>
                    <button 
                      style={{backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer'}}
                      onClick={handleAddUserPlant}
                      disabled={!selectedPlantToAdd}
                    >
                      Добавить
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {addRoomModalOpen && (
              <div className="modal-overlay" onClick={() => setAddRoomModalOpen(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '90%', maxWidth: '500px'}}>
                  <h2>Добавить комнату</h2>
                  <input
                    type="text"
                    placeholder="Название комнаты..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    style={{width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc'}}
                  />
                  <footer style={{marginTop: '20px'}}>
                    <button 
                      style={{backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer'}}
                      onClick={addNewRoom}
                    >
                      Добавить
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {addToRoomModalOpen && selectedRoomForPlant && (
              <div className="modal-overlay" onClick={() => setAddToRoomModalOpen(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '90%', maxWidth: '500px'}}>
                  <h2>Добавить растение в "{selectedRoomForPlant.name}"</h2>
                  <input
                    type="text"
                    placeholder="Поиск растения..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc'}}
                  />
                  {searchError && (
                    <div style={{color: 'red', fontSize: '12px', margin: '5px 0'}}>
                      {searchError}
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div style={{maxHeight: '300px', overflowY: 'auto', margin: '10px 0'}}>
                      {searchResults.map((plant) => (
                        <div
                          key={plant.id}
                          onClick={() => setSelectedPlantToAdd(plant)}
                          style={{
                            padding: '10px',
                            border: selectedPlantToAdd?.id === plant.id ? '2px solid #A8C686' : '1px solid #eee',
                            borderRadius: '8px',
                            margin: '5px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <div style={{width: '40px', height: '40px', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden'}}>
                            <PlantImage
                              src={plant.photo}
                              alt={plant.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                          </div>
                          <div>
                            <strong>{plant.name}</strong>
                            <p style={{fontSize: '12px', margin: '0'}}>{plant.season}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPlantToAdd && (
                    <div style={{marginTop: '10px'}}>
                      <label>Цвет фона: </label>
                      <input 
                        type="color" 
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        style={{marginLeft: '10px'}}
                      />
                    </div>
                  )}
                  <footer style={{marginTop: '20px'}}>
                    <button 
                      style={{backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer'}}
                      onClick={handleAddPlantToRoom}
                      disabled={!selectedPlantToAdd}
                    >
                      Добавить в комнату
                    </button>
                  </footer>
                </section>
              </div>
            )}
          </>
        )}
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
            {isLoggedIn ? (
              <div className="user-info">
                <button className="auth-button logout-button" onClick={handleLogoutClick}>
                  Выйти
                </button>
              </div>
            ) : (
              <button className="auth-button login-button" onClick={handleLoginClick}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="my-plants-content">
        {!isLoggedIn ? (
          <div className="login-required-container-desktop">
            <h2>Войдите в систему</h2>
            <p>Чтобы просматривать свои растения, пожалуйста, войдите в аккаунт</p>
            <button className="auth-button login-button" onClick={handleLoginClick}>
              Войти
            </button>
          </div>
        ) : (
          <>
            <section className="left_side_plants" style={{overflowY: 'auto', maxHeight: 'calc(100vh - 74px)'}}>
              <p className="p_center">Мои растения</p>
              <div className="side_elements">
                {userPlants.length === 0 ? (
                  <div className="empty-message-desktop">
                    <p>У вас пока нет растений</p>
                    <p>Нажмите "+" чтобы добавить</p>
                  </div>
                ) : (
                  userPlants.map((plant) => (
                    <div 
                      key={plant.id} 
                      className="element" 
                      onClick={() => openPlantModal(plant)}
                      style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        height: '212px', 
                        width: '212px',
                        backgroundColor: plant.color || "#F5F5F5",
                        borderRadius: '20px',
                        padding: '8px',
                        transition: 'background-color 0.3s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{width: '196px', height: '148px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: '20px', marginTop: '8px', overflow: 'hidden'}}>
                        <PlantImage
                          src={plant.plant.photo}
                          alt={plant.plant.name}
                          style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                      </div>
                      <p className="plant_name">{plant.plant.name}</p>
                      <p className="place_of_plant">Комната: {plant.room?.name || "Без комнаты"}</p>
                    </div>
                  ))
                )}
                <div className="element" onClick={() => setAddPlantModalOpen(true)} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{display:'flex', justifyContent:'center', alignItems:'flex-end', height:'148px', width:'196px'}}>
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
                {rooms.map((room) => (
                  <div key={room.id} style={{ cursor: 'pointer', position: 'relative' }}>
                    <div onClick={() => openRoomModal(room)}>
                      <div
                        className="element"
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '8px',
                        }}
                      >
                        {room.userPlants.slice(0, 4).map((plant) => (
                          <div
                            key={plant.id}
                            style={{
                              width: '92px',
                              height: '92px',
                              margin: '4px',
                              backgroundColor: plant.color || '#FFFFFF',
                              borderRadius: '12px',
                              padding: '4px',
                            }}
                          >
                            <PlantImage
                              src={plant.plant.photo}
                              alt={plant.plant.name}
                              style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                            />
                          </div>
                        ))}
                        {room.userPlants.length < 4 && (
                          <button
                            className="button_room"
                            style={{ margin: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomForPlant(room);
                              setAddToRoomModalOpen(true);
                            }}
                          >
                            +
                          </button>
                        )}
                      </div>
                      <p style={{ fontWeight: '500', textAlign: 'center', marginTop: '8px' }}>
                        {room.name}
                      </p>
                    </div>
                    {/* Кнопка удаления комнаты удалена с основной страницы */}
                  </div>
                ))}

                <div
                  className="element"
                  onClick={() => setAddRoomModalOpen(true)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      height: '148px',
                      width: '196px',
                    }}
                  >
                    <button className="button_add">+</button>
                  </div>
                  <p className="add_new_plant_new_place">Добавить комнату</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {isLoggedIn && (
        <>
          {roomModalOpen && selectedRoom && (
            <div className="modal-overlay" onClick={() => setRoomModalOpen(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{width: '70%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                  <h2 style={{margin: 0, fontSize: '28px'}}>{selectedRoom.name}</h2>
                  <div style={{display: 'flex', gap: '12px'}}>
                    {/* Кнопка удаления комнаты - красный квадрат с белым крестиком */}
                    <button
                      onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.name)}
                      disabled={deletingRoomId === selectedRoom.id}
                      style={{
                        background: '#DF7171',
                        border: 'none',
                        borderRadius: '8px',
                        width: '36px',
                        height: '36px',
                        cursor: deletingRoomId === selectedRoom.id ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}
                    >
                      {deletingRoomId === selectedRoom.id ? '...' : '×'}
                    </button>
                    <button onClick={() => setRoomModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer'}}>×</button>
                  </div>
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
                        backgroundColor: plant.color || "#FFFFFF",
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        position: 'relative'
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlantFromRoom(plant.id, selectedRoom.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(223, 113, 113, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#DF7171'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(223, 113, 113, 0.9)'}
                      >
                        ×
                      </button>
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
                    }}
                  >
                    <button className="button_add" style={{width: '60px', height: '60px', fontSize: '28px'}}>+</button>
                    <p style={{marginTop: '16px', fontSize: '14px', fontWeight: '500'}}>Добавить растение</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {modalOpen && selectedPlant && (
            <div className="modal-overlay" onClick={closePlantModal}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '24px'}}>
                <div style={{display: "flex", gap: "33px", alignItems: "flex-start", flexWrap: "wrap"}}>
                  <div style={{width: '220px', height: '220px', backgroundColor: '#F5F5F5', borderRadius: '20px', overflow: 'hidden', flexShrink: 0}}>
                    <PlantImage
                      src={selectedPlant.image}
                      alt={selectedPlant.name}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                  <div style={{flex: 1, minWidth: '250px'}}>
                    <h1 style={{
                      fontSize: "36px", 
                      fontWeight: "500", 
                      color: "#2E2E2E", 
                      margin: "0 0 12px 0",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      lineHeight: "1.2"
                    }}>
                      {selectedPlant.name}
                    </h1>
                    <p style={{
                      fontSize: "18px", 
                      color: "#666", 
                      margin: "0 0 16px 0",
                      fontWeight: "450"
                    }}>
                      Комната: {selectedPlant.room}
                    </p>
                    <div style={{display: "flex", alignItems: "center", gap: "12px", marginTop: "8px"}}>
                      <label style={{fontSize: "16px", fontWeight: "500"}}>Цвет фона:</label>
                      <input 
                        type="color" 
                        value={userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF"}
                        onChange={(e) => {
                          const plant = userPlants.find(p => p.id === selectedPlant.id);
                          if (plant) handleUpdateColor(plant.id, e.target.value);
                        }}
                        style={{
                          width: "50px",
                          height: "50px",
                          border: "2px solid #ddd",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <h1 style={{
                  fontSize: "32px", 
                  fontWeight: "500", 
                  color: "#2E2E2E", 
                  margin: "40px 0 20px 0"
                }}>
                  Уход за растением
                </h1>
                
                <div style={{marginTop: "0"}}>
                  <div style={{
                    width:"100%", 
                    display:"flex", 
                    alignItems:"flex-start", 
                    marginBottom: "20px",
                    backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <div style={{
                      width:"52px", 
                      height:"52px", 
                      backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <img style={{width:"32px", height:"32px"}} src="/plant_light.svg" alt=""/>
                    </div>
                    <div style={{marginLeft:"14px", flex: 1}}>
                      <p style={{fontSize:"24px", fontWeight:"450", margin: "0 0 8px 0"}}>Описание</p>
                      <p style={{fontSize:"20px", margin: 0, lineHeight: "1.5"}}>{selectedPlant.description}</p>
                    </div>
                  </div>
                  <hr style={{width:"100%", margin:"20px 0", opacity:"50%", borderColor:"#A8C686"}}/>
                  <div style={{
                    width:"100%", 
                    display:"flex", 
                    alignItems:"flex-start", 
                    marginBottom: "20px",
                    backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <div style={{
                      width:"52px", 
                      height:"52px", 
                      backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <img style={{width:"32px", height:"32px"}} src="/plant_light.svg" alt=""/>
                    </div>
                    <div style={{marginLeft:"14px", flex: 1}}>
                      <p style={{fontSize:"24px", fontWeight:"450", margin: "0 0 8px 0"}}>Сезон</p>
                      <p style={{fontSize:"18px", margin: 0, lineHeight: "1.5"}}>{selectedPlant.season}</p>
                    </div>
                  </div>
                  <hr style={{width:"100%", margin:"20px 0", opacity:"50%", borderColor:"#A8C686"}}/>
                </div>

                <h1 style={{fontSize:"32px", fontWeight:"500", color:"#2E2E2E", margin:"40px 0 20px 0"}}>
                  Мои заметки
                </h1>
                <div style={{marginBottom: "20px"}}>
                  {commentsLoading ? (
                    <p style={{color:"#999", fontSize:"16px"}}>Загрузка заметок...</p>
                  ) : comments.length === 0 ? (
                    <p style={{color:"#999", fontSize:"16px"}}>Заметок пока нет. Добавьте первую!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} style={{
                        display:"flex", 
                        alignItems:"flex-start", 
                        gap:"14px", 
                        marginBottom:"16px",
                        backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#F5F8F2",
                        borderRadius: "12px",
                        padding: "12px 16px"
                      }}>
                        <div style={{
                          width:"52px", 
                          height:"52px", 
                          backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#A8C686",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <img style={{width:"32px", height:"32px"}} src="/plant_light.svg" alt=""/>
                        </div>
                        <div style={{flex:1}}>
                          <p style={{fontSize:"18px", margin:0, lineHeight:"1.5", wordBreak:"break-word"}}>{comment.text}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Удалить заметку"
                          style={{background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:"20px", flexShrink:0, paddingTop:"14px", transition:"color 0.2s"}}
                          onMouseEnter={e => (e.currentTarget.style.color = "#DF7171")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}
                        >×</button>
                      </div>
                    ))
                  )}
                  <hr style={{width:"100%", margin:"20px 0", opacity:"50%", borderColor:"#A8C686"}}/>
                  <div style={{display:"flex", gap:"10px", alignItems:"flex-end"}}>
                    <textarea
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      placeholder="Добавить заметку..."
                      rows={2}
                      style={{
                        flex:1,
                        resize:"vertical",
                        padding:"10px 14px",
                        borderRadius:"12px",
                        border:"1px solid #ddd",
                        fontSize:"16px",
                        fontFamily:"inherit",
                        outline:"none",
                        backgroundColor: "#FFFFFF"
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={commentSubmitting || !newCommentText.trim()}
                      style={{
                        backgroundColor: newCommentText.trim() ? "#A8C686" : "#ddd",
                        color:"white",
                        border:"none",
                        borderRadius:"12px",
                        padding:"10px 20px",
                        fontSize:"16px",
                        cursor: newCommentText.trim() ? "pointer" : "default",
                        height:"48px",
                        width: "20%",
                        flexShrink:0,
                        transition:"background-color 0.2s",
                      }}
                    >
                      {commentSubmitting ? "..." : "Добавить"}
                    </button>
                  </div>
                </div>
                
                <footer className="modal_footer" style={{marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end"}}>
                  <button 
                    style={{
                      backgroundColor:"#DF7171", 
                      color:"white", 
                      width:"252px", 
                      height:"48px", 
                      fontSize:"16px", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#c55a5a"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#DF7171"}
                    onClick={() => handleDeleteUserPlant(selectedPlant.id)}
                  >
                    Удалить растение
                  </button>
                </footer>
              </section>
            </div>
          )}

          {addPlantModalOpen && (
            <div className="modal-overlay" onClick={() => setAddPlantModalOpen(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()}>
                <h2>Добавить растение</h2>
                <input
                  type="text"
                  placeholder="Поиск растения..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc"}}
                />
                {searchError && (
                  <div style={{color: 'red', fontSize: '12px', margin: '5px 0'}}>
                    {searchError}
                  </div>
                )}
                {allPlants.length === 0 && !loading && (
                  <div style={{color: 'orange', fontSize: '12px', margin: '5px 0', textAlign: 'center'}}>
                    ⚠️ База растений пуста. Обратитесь к администратору.
                  </div>
                )}
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
                {searchQuery && searchResults.length === 0 && !searchError && allPlants.length > 0 && (
                  <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                    Растения не найдены
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

          {addToRoomModalOpen && selectedRoomForPlant && (
            <div className="modal-overlay" onClick={() => setAddToRoomModalOpen(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()}>
                <h2>Добавить растение в "{selectedRoomForPlant.name}"</h2>
                <input
                  type="text"
                  placeholder="Поиск растения..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc"}}
                />
                {searchError && (
                  <div style={{color: 'red', fontSize: '12px', margin: '5px 0'}}>
                    {searchError}
                  </div>
                )}
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

          {addRoomModalOpen && (
            <div className="modal-overlay" onClick={() => setAddRoomModalOpen(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()}>
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
        </>
      )}
    </div>
  );
}

export default MyPlant;