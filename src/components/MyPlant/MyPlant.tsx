import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import {
  getAllPlants,
  getUserPlants,
  addUserPlant,
  deleteUserPlant,
  updateUserPlant,
  createCustomPlant,
  type UserPlant,
  type Plant,
} from "../../api/plantsApi";
import { API } from "../../constants/api";
import {
  getUserRooms,
  createRoom,
  deleteRoom,
  addPlantToRoom,
  removePlantFromRoom,
  type Room,
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

async function updateCommentOnServer(commentId: string, text: string): Promise<Comment> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to update comment:", errorText);
    throw new Error("Failed to update comment");
  }
  return response.json();
}

interface SelectedPlant {
  id: string;
  name: string;
  room: string;
  roomId?: string;
  image: string;
  description: string;
  season: string;
  recommendations?: string;
  customCare?: any[];
}

const PlantImage: React.FC<{
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  plantId?: string | number;
}> = ({ src, alt, className, style, plantId }) => {
  const [hasError, setHasError] = useState(false);

  const getPlaceholderIndex = () => {
    if (plantId) {
      const key = `plant_placeholder_${plantId}`;
      const saved = localStorage.getItem(key);
      if (saved) return parseInt(saved, 10);
      const newIndex = Math.floor(Math.random() * 10) + 1;
      localStorage.setItem(key, newIndex.toString());
      return newIndex;
    }
    return Math.floor(Math.random() * 10) + 1;
  };

  const [placeholderIndex] = useState(() => getPlaceholderIndex());

  const imageSrc = (hasError || !src || src.trim() === "")
    ? `/plug-image-plant${placeholderIndex}.png`
    : src;

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
  const [selectedUserPlantToAdd, setSelectedUserPlantToAdd] = useState<UserPlant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [searchError, setSearchError] = useState<string>("");
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const [showCreatePlantModal, setShowCreatePlantModal] = useState(false);
  const [newPlantData, setNewPlantData] = useState({
    name: "",
    description: "",
    season: "",
    recommendations: "",
    photoIndex: 0,
  });
  const [newPlantColor, setNewPlantColor] = useState("#FFFFFF");
  const [showImageGrid, setShowImageGrid] = useState(false);

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentUpdating, setCommentUpdating] = useState(false);

  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const normalizeUserPlants = (plants: UserPlant[]): UserPlant[] => {
    return plants.map(plant => {
      if (plant.is_custom) {
        return {
          ...plant,
          plant: {
            id: plant.id,
            name: plant.custom_name || 'Без названия',
            description: plant.custom_description || '',
            season: plant.custom_season || '',
            photo: plant.custom_photo || null,
            watering_frequency: undefined,
            fertilizing_frequency: undefined,
            created_at: plant.created_at,
            updated_at: plant.updated_at,
          } as Plant,
        };
      }
      return plant;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const plants = await getAllPlants();
      setAllPlants(plants || []);
      let userPlantsData = await getUserPlants();
      userPlantsData = normalizeUserPlants(userPlantsData as unknown as UserPlant[]);
      setUserPlants(userPlantsData as unknown as UserPlant[]);
      const roomsData = await getUserRooms();
      setRooms(roomsData || []);
    } catch (error: any) {
      console.error("Ошибка загрузки данных:", error);
      setSearchError("Ошибка загрузки данных.");
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
      setSearchError("База растений пуста.");
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = allPlants.filter(plant =>
      plant.name.toLowerCase().includes(lowerQuery) ||
      (plant.season && plant.season.toLowerCase().includes(lowerQuery))
    );
    if (results.length === 0) {
      setSearchError("Растения не найдены.");
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
          if (room) await addPlantToRoom(room.id, newPlant.id);
        }
        await loadData();
        setAddPlantModalOpen(false);
        setSelectedPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedRoomForAdd("");
        setSearchError("");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddPlantToRoom = async () => {
    if (selectedUserPlantToAdd && selectedRoomForPlant) {
      try {
        await addPlantToRoom(selectedRoomForPlant.id, selectedUserPlantToAdd.id);
        await loadData();
        setAddToRoomModalOpen(false);
        setSelectedUserPlantToAdd(null);
        setSearchQuery("");
        setSearchResults([]);
        setSearchError("");
        if (roomModalOpen && selectedRoom && selectedRoom.id === selectedRoomForPlant.id) {
          const updatedRoom = rooms.find(r => r.id === selectedRoomForPlant.id);
          if (updatedRoom) setSelectedRoom(updatedRoom);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleRemovePlantFromRoom = async (userPlantId: string, roomId: string) => {
    try {
      await removePlantFromRoom(roomId, userPlantId);
      if (roomModalOpen && selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          userPlants: prev.userPlants.filter(p => p.id !== userPlantId)
        } : null);
      }
      setRooms(prevRooms => prevRooms.map(room =>
        room.id === roomId
          ? { ...room, userPlants: room.userPlants.filter(p => p.id !== userPlantId) }
          : room
      ));
    } catch (error) {
      console.error("Ошибка удаления из комнаты:", error);
    }
  };

  const handleDeleteUserPlant = async (userPlantId: string) => {
    try {
      await deleteUserPlant(userPlantId);
      setUserPlants(prev => prev.filter(p => p.id !== userPlantId));
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        userPlants: room.userPlants.filter(p => p.id !== userPlantId)
      })));
      if (roomModalOpen && selectedRoom) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          userPlants: prev.userPlants.filter(p => p.id !== userPlantId)
        } : null);
      }
      setModalOpen(false);
      setSelectedPlant(null);
    } catch (error) {
      console.error("Ошибка удаления растения:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    setDeletingRoomId(roomId);
    try {
      await deleteRoom(roomId);
      setRooms(prev => prev.filter(room => room.id !== roomId));
      if (roomModalOpen && selectedRoom?.id === roomId) {
        setRoomModalOpen(false);
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error("Ошибка удаления комнаты:", error);
    } finally {
      setDeletingRoomId(null);
    }
  };

  const addNewRoom = async () => {
    if (!newRoomName.trim()) return;
    if (rooms.some(room => room.name === newRoomName.trim())) {
      alert("Комната с таким названием уже существует");
      return;
    }
    try {
      await createRoom(newRoomName.trim());
      await loadData();
      setAddRoomModalOpen(false);
      setNewRoomName("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateColor = async (userPlantId: string, color: string) => {
    try {
      await updateUserPlant(userPlantId, { color });
      await loadData();
    } catch (error) {
      console.error(error);
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
      recommendations: plant.plant.recommendations,
      customCare: []
    });
    setModalOpen(true);
    setNewCommentText("");
    setComments([]);
    setCommentsLoading(true);
    setEditingCommentId(null);
    try {
      const loaded = await fetchComments(plant.id);
      setComments(loaded);
    } catch (e) {
      console.error(e);
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
      console.error(e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    setCommentUpdating(true);
    try {
      const updated = await updateCommentOnServer(commentId, editingCommentText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (e) {
      console.error("Ошибка при обновлении заметки:", e);
      alert("Не удалось обновить заметку");
    } finally {
      setCommentUpdating(false);
    }
  };

  const closePlantModal = () => {
    setModalOpen(false);
    setSelectedPlant(null);
    setComments([]);
    setNewCommentText("");
    setEditingCommentId(null);
  };

  const handleCreateCustomPlant = async () => {
    if (!newPlantData.name.trim()) return;
    try {
      const photoUrl = newPlantData.photoIndex === 0
        ? "/plug-image-plant.png"
        : `/plug-image-plant${newPlantData.photoIndex}.png`;
      await createCustomPlant({
        name: newPlantData.name.trim(),
        description: newPlantData.description,
        season: newPlantData.season,
        photo: photoUrl,
        color: newPlantColor,
      });
      setShowCreatePlantModal(false);
      await loadData();
      setNewPlantData({
        name: "",
        description: "",
        season: "",
        recommendations: "",
        photoIndex: 0,
      });
      setNewPlantColor("#FFFFFF");
    } catch (error) {
      console.error("Ошибка при создании растения:", error);
      alert("Не удалось создать растение. Попробуйте позже.");
    }
  };

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);
        if (authData.isAuthenticated) await loadData();
      } catch (error) {
        console.error(error);
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

  const handleLoginClick = () => navigate("/auth/signin");
  const handleLogoutClick = async () => {
    try {
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);
      setUserPlants([]);
      setRooms([]);
      if (location.pathname === "/user") navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header"><div className="header-content"><Link to="/"><img src={"/logo.svg"} alt="Florally" className="logo" /></Link><div className="loading-auth">Загрузка...</div></div></header>
        <main className="my-plants-content">
          <div className="coming-soon-container">
            <div className="plant-image-container">
              <img src="/plug-image-plant.png" alt="plant" className="centered-plant" />
            </div>
            <div className="coming-soon-text">Загрузка...</div>
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
            <Link to="/"> <img src="/logo.svg" alt="Florally" className="mobile-logo" /> </Link>
          </div>
        </header>

        <main className="mobile-myplants-content">
          {!isLoggedIn ? (
            <div className="mobile-form-container full-height">
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
            </div>
          ) : (
            <div className="mobile-myplants-container">
              <div className="mobile-plants-section">
                <h2 className="mobile-section-title">Мои растения</h2>
                <div className="mobile-plants-grid">
                  {userPlants.length === 0 ? (
                    <div className="mobile-empty-message">
                    </div>
                  ) : (
                    userPlants.map((plant) => (
                      <div
                        key={plant.id}
                        className="mobile-plant-card"
                        onClick={() => openPlantModal(plant)}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: '16px',
                          padding: '12px',
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        <div className="mobile-plant-image" style={{ position: 'relative' }}>
                          <PlantImage
                            src={plant.plant.photo}
                            alt={plant.plant.name}
                            plantId={plant.id}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                          />
                          {plant.color && plant.color !== "#FFFFFF" && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: plant.color,
                              border: '2px solid white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              zIndex: 2,
                              pointerEvents: 'none'
                            }} />
                          )}
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
                            backgroundColor: "#FFFFFF",
                            borderRadius: '12px',
                            padding: '2px'
                          }}>
                            <PlantImage
                              src={plant.plant.photo}
                              alt={plant.plant.name}
                              plantId={plant.id}
                              style={{ width: '100%', height: '100%', borderRadius: '10px' }}
                            />
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <p className="mobile-room-name">{room.name}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mobile-add-card" onClick={() => setAddRoomModalOpen(true)}>
                    <div className="mobile-add-button">+</div>
                    <p className="mobile-add-text">Добавить комнату</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', minHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                  <button
                    className="modal-close-btn"
                    onClick={() => setRoomModalOpen(false)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#a8c686',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedRoom.name}</h2>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    justifyContent: 'center',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }} className="no-scrollbar">
                    {selectedRoom.userPlants.map((plant) => (
                      <div
                        key={plant.id}
                        onClick={() => {
                          setRoomModalOpen(false);
                          openPlantModal(plant);
                        }}
                        style={{
                          width: '100%',
                          cursor: 'pointer',
                          textAlign: 'center',
                          backgroundColor: "#FFFFFF",
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '4/3', margin: '0 auto', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                          <PlantImage
                            src={plant.plant.photo}
                            alt={plant.plant.name}
                            plantId={plant.id}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <p style={{ fontWeight: '500', margin: '8px 0 0 0', fontSize: '14px' }}>{plant.plant.name}</p>
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
                            width: '24px',
                            height: '24px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'               
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
                        width: '100%',
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
                      <button className="button_add" style={{ width: '40px', height: '40px', fontSize: '24px' }}>+</button>
                      <p style={{ marginTop: '8px', fontSize: '12px' }}>Добавить растение</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.name)}
                    disabled={deletingRoomId === selectedRoom.id}
                    style={{
                      background: '#DF7171',
                      border: 'none',
                      borderRadius: '8px',
                      width: '80%',
                      cursor: deletingRoomId === selectedRoom.id ? 'default' : 'pointer',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      textAlign: 'center',
                      right: '40px',
                      bottom: '32px',
                      position: 'absolute'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a5a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DF7171'}
                  >
                    {deletingRoomId === selectedRoom.id ? '...' : 'Удалить комнату'}
                  </button>
                </section>
              </div>
            )}

            {modalOpen && selectedPlant && (
              <div className="modal-overlay" onClick={closePlantModal}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', position: 'relative' }}>
                  <button
                    className="modal-close-btn"
                    onClick={closePlantModal}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#a8c686',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ marginTop: '40px' }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "nowrap" }}>
                      <div style={{ width: '120px', height: '120px', backgroundColor: '#F5F5F5', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <PlantImage
                          src={selectedPlant.image}
                          alt={selectedPlant.name}
                          plantId={selectedPlant.id}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <label style={{ fontSize: "14px" }}>Цвет фона:</label>
                          <div
                            onClick={() => {
                              const input = document.getElementById(`color-picker-mobile-${selectedPlant?.id}`);
                              if (input) input.click();
                            }}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "6px",
                              border: "2px solid #ddd",
                              backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF",
                              cursor: "pointer",
                              transition: "transform 0.1s ease",
                              margin: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.95)"}
                            onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
                          />
                          <input
                            id={`color-picker-mobile-${selectedPlant?.id}`}
                            type="color"
                            value={userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF"}
                            onChange={(e) => {
                              const plant = userPlants.find(p => p.id === selectedPlant.id);
                              if (plant) handleUpdateColor(plant.id, e.target.value);
                            }}
                            style={{
                              position: "fixed",
                              opacity: 0,
                              pointerEvents: "none",
                              width: 0,
                              height: 0
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h1 style={{ fontSize: "28px", fontWeight: "500", color: "#2E2E2E", margin: "0", marginTop: "36px" }}>Уход за растением</h1>
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: "#ffffff", borderRadius: "12px", padding: "12px" }}>
                      <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = userPlants.find(p => p.id === selectedPlant.id)?.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                      </div>
                      <div style={{ marginLeft: "14px" }}>
                        <p style={{ fontSize: "20px", fontWeight: "450" }}>Описание</p>
                        <p style={{ fontSize: "16px" }}>{selectedPlant.description}</p>
                      </div>
                    </div>
                    <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
                    <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: "#ffffff", borderRadius: "12px", padding: "12px" }}>
                      <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = userPlants.find(p => p.id === selectedPlant.id)?.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                      </div>
                      <div style={{ marginLeft: "14px" }}>
                        <p style={{ fontSize: "20px", fontWeight: "450" }}>Сезон</p>
                        <p style={{ fontSize: "16px" }}>{selectedPlant.season}</p>
                      </div>
                    </div>
                    <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
                    <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: "#ffffff", borderRadius: "12px", padding: "12px" }}>
                      <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = userPlants.find(p => p.id === selectedPlant.id)?.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                      </div>
                      <div style={{ marginLeft: "14px" }}>
                        <p style={{ fontSize: "20px", fontWeight: "450" }}>Рекомендации</p>
                        <p style={{ fontSize: "16px" }}>{selectedPlant.recommendations || "У этого растения пока нет рекомендаций, но скоро появятся"}</p>
                      </div>
                    </div>
                    <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
                  </div>

                  <h1 style={{ fontSize: "24px", fontWeight: "500", color: "#2E2E2E", margin: "28px 0 16px 0" }}>
                    Мои заметки
                  </h1>
                  <div style={{ marginBottom: "20px" }}>
                    {commentsLoading ? (
                      <p style={{ color: "#999", fontSize: "14px" }}>Загрузка заметок...</p>
                    ) : comments.length === 0 ? (
                      <p style={{ color: "#999", fontSize: "14px" }}>Заметок пока нет. Добавьте первую!</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "12px",
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          padding: "10px 12px"
                        }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: (() => {
                              const color = userPlants.find(p => p.id === selectedPlant.id)?.color;
                              return color && color !== "#FFFFFF" ? color : "#A8C686";
                            })(),
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <img style={{ width: "24px", height: "24px" }} src="/ph_plant-light.svg" alt="" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingCommentId === comment.id ? (
                              <div>
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  rows={3}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #A8C686',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                  <button
                                    onClick={() => handleSaveEditComment(comment.id)}
                                    disabled={commentUpdating || !editingCommentText.trim()}
                                    style={{
                                      background: '#A8C686',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      cursor: commentUpdating || !editingCommentText.trim() ? 'default' : 'pointer',
                                      opacity: commentUpdating || !editingCommentText.trim() ? 0.6 : 1
                                    }}
                                  >
                                    {commentUpdating ? '...' : 'Сохранить'}
                                  </button>
                                  <button
                                    onClick={handleCancelEditComment}
                                    style={{
                                      background: '#ccc',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.5", wordBreak: "break-word", border: "none",background: "#e1e9d9", borderRadius: "5px", padding: "5px", paddingBottom: "20px", paddingRight: "70px" }}>{comment.text}</p>
                            )}
                          </div>
                          {!editingCommentId && (
                            <div style={{
                              flexShrink: 0,
                            }}>
                              <button
                                onClick={() => handleStartEditComment(comment)}
                                title="Редактировать заметку"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  width: "24px",
                                  padding: "0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <img src="/edit_icon.svg" alt="" style={{ width: "20px", height: "20px" }} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Удалить заметку"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#ccc",
                                  fontSize: "20px",
                                  width: "24px",
                                  padding: "0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <img src="/delete_icon.svg" alt="" style={{ width: "20px", height: "20px", margin: "2px" }} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <hr style={{ width: "100%", margin: "16px 0", opacity: "50%", borderColor: "#A8C686" }} />
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <textarea
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        placeholder="Добавить заметку..."
                        rows={2}
                        style={{
                          flex: 1,
                          resize: "vertical",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid #ddd",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          outline: "none",
                          height: "44px"
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
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          padding: "8px 14px",
                          fontSize: "14px",
                          cursor: newCommentText.trim() ? "pointer" : "default",
                          height: "44px",
                          flexShrink: 0,
                          width: '40%'
                        }}
                      >
                        {commentSubmitting ? "..." : "Добавить"}
                      </button>
                    </div>
                  </div>

                  <button
                    style={{ backgroundColor: "#DF7171", color: "white", width: "100%", height: "43px", fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                    onClick={() => handleDeleteUserPlant(selectedPlant.id)}
                  >
                    Удалить растение
                  </button>
                </section>
              </div>
            )}

            {addPlantModalOpen && (
              <div className="modal-overlay" onClick={() => setAddPlantModalOpen(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                  <h2>Добавить растение</h2>
                  <button
                    className="modal-close-btn"
                    onClick={() => setAddPlantModalOpen(false)}
                  >
                    ✕
                  </button>
                  <input
                    type="text"
                    placeholder="Поиск растения..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  {searchError && (
                    <div style={{ color: 'red', fontSize: '12px', margin: '5px 0' }}>
                      {searchError}
                    </div>
                  )}
                  {allPlants.length === 0 && !loading && (
                    <div style={{ color: 'orange', fontSize: '12px', margin: '5px 0', textAlign: 'center' }}>
                      ⚠️ База растений пуста. Обратитесь к администратору.
                    </div>
                  )}

                  <div
                    onClick={() => {
                      setAddPlantModalOpen(false);
                      setShowCreatePlantModal(true);
                      setNewPlantData({
                        name: "",
                        description: "",
                        season: "",
                        recommendations: "",
                        photoIndex: 0,
                      });
                      setNewPlantColor("#FFFFFF");
                    }}
                    style={{
                      padding: "10px",
                      border: "1px dashed #A8C686",
                      borderRadius: "8px",
                      margin: "5px 0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      backgroundColor: "#f9f9f9"
                    }}
                  >
                    <div style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#E8F0E0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      color: "#A8C686"
                    }}>+</div>
                    <div>
                      <strong>Добавить растение</strong>
                      <p style={{ fontSize: "12px", margin: "0", color: "#666" }}>Создать новое растение в каталоге</p>
                    </div>
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '10px 0' }}>
                    {(searchQuery.trim() === "" ? allPlants : searchResults).map((plant) => (
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
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden' }}>
                          <PlantImage
                            src={plant.photo}
                            alt={plant.name}
                            plantId={plant.id}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <strong>{plant.name}</strong>
                          <p style={{ fontSize: '12px', margin: '0' }}>{plant.season}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchQuery && searchResults.length === 0 && !searchError && allPlants.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      Растения не найдены
                    </div>
                  )}
                  {selectedPlantToAdd && (
                    <div style={{ marginTop: '10px' }}>
                      <label>Выбрать комнату: </label>
                      <select
                        value={selectedRoomForAdd}
                        onChange={(e) => setSelectedRoomForAdd(e.target.value)}
                        style={{ padding: '5px', borderRadius: '5px' }}
                      >
                        <option value="">Без комнаты</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.name}>{room.name}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <label style={{ fontSize: '14px', fontWeight: '500' }}>Цвет фона:</label>
                          <div
                            onClick={() => {
                              const input = document.getElementById('color-picker-add');
                              if (input) input.click();
                            }}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "6px",
                              border: "2px solid #ddd",
                              backgroundColor: selectedColor,
                              cursor: "pointer",
                              transition: "transform 0.1s ease",
                              margin: "8px"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          />
                          <input
                            id="color-picker-add"
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            style={{
                              position: "fixed",
                              opacity: 0,
                              pointerEvents: "none",
                              width: 0,
                              height: 0
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#A8C686" />
                          </svg>
                          <span style={{ fontSize: '12px', color: '#666' }}>Цвет влияет на иконки в карточке растения</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <footer style={{ marginTop: '20px' }}>
                    <button
                      style={{ backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
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
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', minHeight: '50vh', overflowY: 'auto', position: 'relative' }}>
                  <h2>Добавить комнату</h2>
                  <button
                    className="modal-close-btn"
                    onClick={() => setAddRoomModalOpen(false)}
                  >
                    ✕
                  </button>
                  <input
                    type="text"
                    placeholder="Название комнаты..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <footer style={{ marginTop: '20px' }}>
                    <button
                      style={{ backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
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
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                  <h2>Добавить растение в "{selectedRoomForPlant.name}"</h2>
                  <button
                    className="modal-close-btn"
                    onClick={() => setAddToRoomModalOpen(false)}
                  >
                    ✕
                  </button>
                  <input
                    type="text"
                    placeholder="Поиск растения..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc' }}
                  />

                  {userPlants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      У вас пока нет растений. Добавьте их через раздел "Мои растения".
                    </div>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto', margin: '10px 0' }}>
                      {userPlants
                        .filter(up => up.plant.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((userPlant) => (
                          <div
                            key={userPlant.id}
                            onClick={() => setSelectedUserPlantToAdd(userPlant)}
                            style={{
                              padding: '10px',
                              border: selectedUserPlantToAdd?.id === userPlant.id ? '2px solid #A8C686' : '1px solid #eee',
                              borderRadius: '8px',
                              margin: '5px 0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#F5F5F5', borderRadius: '8px', overflow: 'hidden' }}>
                              <PlantImage
                                src={userPlant.plant.photo}
                                alt={userPlant.plant.name}
                                plantId={userPlant.id}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: userPlant.color && userPlant.color !== "#FFFFFF" ? userPlant.color : "#A8C686",
                                border: '1px solid #ddd'
                              }} />
                              <div>
                                <strong>{userPlant.plant.name}</strong>
                                <p style={{ fontSize: '12px', margin: '0', color: '#666' }}>Комната: {userPlant.room?.name || "Без комнаты"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <footer style={{ marginTop: '20px' }}>
                    <button
                      style={{
                        backgroundColor: '#A8C686',
                        color: 'white',
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: selectedUserPlantToAdd ? 'pointer' : 'default',
                        opacity: selectedUserPlantToAdd ? 1 : 0.5
                      }}
                      onClick={handleAddPlantToRoom}
                      disabled={!selectedUserPlantToAdd}
                    >
                      Добавить в комнату
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {showCreatePlantModal && (
              <div className="modal-overlay" onClick={() => setShowCreatePlantModal(false)}>
                <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
                  <h2>Новое растение</h2>
                  <button
                    className="modal-close-btn"
                    onClick={() => setShowCreatePlantModal(false)}
                    style={{top: "4px"}}
                  >
                    ✕
                  </button>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <div
                      onClick={() => setShowImageGrid(true)}
                      style={{
                        width: '200px',
                        height: '200px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={newPlantData.photoIndex === 0
                          ? "/plug-image-plant.png"
                          : `/plug-image-plant${newPlantData.photoIndex}.png`
                        }
                        alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Название растения *</label>
                      <input
                        type="text"
                        value={newPlantData.name}
                        onChange={e => setNewPlantData(prev => ({ ...prev, name: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', margin: 0 }}
                        placeholder="Например: Монстера"
                      />
                    </div>
                  </div>

                  {showImageGrid && (
                    <div className="modal-overlay" onClick={() => setShowImageGrid(false)} style={{ zIndex: 2000 }}>
                      <div onClick={e => e.stopPropagation()} style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '20px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                      }}>
                        <h3>Выберите изображение</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '16px' }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div
                              key={i}
                              onClick={() => {
                                setNewPlantData(prev => ({ ...prev, photoIndex: i }));
                                setShowImageGrid(false);
                              }}
                              style={{
                                cursor: 'pointer',
                                border: newPlantData.photoIndex === i ? '3px solid #A8C686' : '1px solid #ddd',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                aspectRatio: '1/1'
                              }}
                            >
                              <img src={`/plug-image-plant${i}.png`} alt={`variant ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label>Описание</label>
                    <textarea
                      value={newPlantData.description}
                      onChange={e => setNewPlantData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', resize: 'none' }}
                      placeholder="Уход, особенности..."
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label>Сезон</label>
                    <input
                      type="text"
                      value={newPlantData.season}
                      onChange={e => setNewPlantData(prev => ({ ...prev, season: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', margin: 0 }}
                      placeholder="Весна-лето"
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label>Рекомендации</label>
                    <textarea
                      value={newPlantData.recommendations}
                      onChange={e => setNewPlantData(prev => ({ ...prev, recommendations: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', resize: 'none' }}
                      placeholder="Рекомендации по уходу..."
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label>Цвет фона для карточки</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div
                        onClick={() => {
                          const input = document.getElementById('color-picker-create-plant');
                          if (input) input.click();
                        }}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          border: "2px solid #ddd",
                          backgroundColor: newPlantColor,
                          cursor: "pointer",
                          transition: "transform 0.1s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                      <input
                        id="color-picker-create-plant"
                        type="color"
                        value={newPlantColor}
                        onChange={(e) => setNewPlantColor(e.target.value)}
                        style={{
                          position: "fixed",
                          opacity: 0,
                          pointerEvents: "none",
                          width: 0,
                          height: 0
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#666' }}>Цвет будет использован для иконок в карточке растения</span>
                    </div>
                  </div>

                  <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={handleCreateCustomPlant}
                      disabled={!newPlantData.name.trim()}
                      style={{
                        padding: '10px 20px',
                        width: '100%',
                        background: newPlantData.name.trim() ? '#A8C686' : '#ccc',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: newPlantData.name.trim() ? 'pointer' : 'default'
                      }}
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

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/"><img src="/logo.svg" alt="Florally" className="logo" /></Link>
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
                <button className="auth-section-button logout-button" onClick={handleLogoutClick}>
                  Выйти
                </button>
              </div>
            ) : (
              <button className="auth-section-button login-button" onClick={handleLoginClick}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="my-plants-content">
        {!isLoggedIn ? (
          <div className="not-authorized-container">
            <div className="not-authorized-message">
              <p>
                Зарегистрируйся,
                <br />
                чтобы знать больше
                <br />
                о своих растениях!
              </p>
            </div>
            <div className="registration-form-section">
              <div style={{ margin: "1.2vh 0" }}>
                <button
                  className="registration-button"
                  style={{ width: "100%", margin: "0 auto" }}
                  onClick={() => navigate("/auth/signup")}
                >
                  Зарегистрироваться
                </button>
              </div>

              <div style={{ margin: "1vh 0", textAlign: "center" }}>
                <span style={{ fontSize: "1.7vh" }} className="login-link">
                  Есть аккаунт?{" "}
                  <Link
                    to="/auth/signin"
                    style={{ color: "#74885d", textDecoration: "none" }}
                  >
                    Войти
                  </Link>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="left_side_plants" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 74px)' }}>
              <p className="p_center">Мои растения</p>
              <div className="side_elements">
                {userPlants.length === 0 ? (
                  <div className="empty-message-desktop">
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
                        borderRadius: '20px',
                        padding: '8px',
                        transition: 'background-color 0.3s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '196px', height: '148px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: '20px', marginTop: '8px', overflow: 'hidden', position: 'relative' }}>
                        <PlantImage
                          src={plant.plant.photo}
                          alt={plant.plant.name}
                          plantId={plant.id}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {plant.color && plant.color !== "#FFFFFF" && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: plant.color,
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            zIndex: 2,
                            pointerEvents: 'none'
                          }} />
                        )}
                      </div>
                      <p className="plant_name">{plant.plant.name}</p>
                      <p className="place_of_plant">Комната: {plant.room?.name || "Без комнаты"}</p>
                    </div>
                  ))
                )}
                <div className="element" onClick={() => setAddPlantModalOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '148px', width: '196px' }}>
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
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px',
                          width: '220px'
                        }}
                      >
                        {room.userPlants.slice(0, 4).map((plant) => (
                          <div
                            key={plant.id}
                            style={{
                              width: '92px',
                              height: '92px',
                              margin: '4px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '4px',
                              position: 'relative'
                            }}
                          >
                            <PlantImage
                              src={plant.plant.photo}
                              alt={plant.plant.name}
                              plantId={plant.id}
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
                      <p style={{
                        fontWeight: '500',
                        textAlign: 'center',
                        marginTop: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '220px'
                      }}>
                        {room.name}
                      </p>
                    </div>
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
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '70%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                <button
                  className="modal-close-btn"
                  onClick={() => setRoomModalOpen(false)}
                >
                  ✕
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px' }}>{selectedRoom.name}</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' }}>
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
                        backgroundColor: "#FFFFFF",
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '148px', height: '112px', margin: '0 auto', backgroundColor: '#F5F5F5', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <PlantImage
                          src={plant.plant.photo}
                          alt={plant.plant.name}
                          plantId={plant.id}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <p style={{ fontWeight: '500', margin: '12px 0 4px 0', fontSize: '16px' }}>{plant.plant.name}</p>
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
                    <button className="button_add" style={{ width: '60px', height: '60px', fontSize: '28px' }}>+</button>
                    <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: '500' }}>Добавить растение</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRoom(selectedRoom.id, selectedRoom.name)}
                  disabled={deletingRoomId === selectedRoom.id}
                  style={{
                    background: '#DF7171',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    width: '40%',
                    cursor: deletingRoomId === selectedRoom.id ? 'default' : 'pointer',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    right: '50px',
                    bottom: '40px',
                    position: 'absolute'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a5a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DF7171'}
                >
                  {deletingRoomId === selectedRoom.id ? '...' : 'Удалить комнату'}
                </button>
              </section>
            </div>
          )}

          {modalOpen && selectedPlant && (
            <div className="modal-overlay" onClick={closePlantModal}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
                <button
                  className="modal-close-btn"
                  onClick={closePlantModal}
                >
                  ✕
                </button>
                <div style={{ display: "flex", gap: "33px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: '220px', height: '220px', backgroundColor: '#F5F5F5', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <PlantImage
                      src={selectedPlant.image}
                      alt={selectedPlant.name}
                      plantId={selectedPlant.id}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '250px' }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                      <label style={{ fontSize: "16px", fontWeight: "500" }}>Цвет фона:</label>
                      <div
                        onClick={() => {
                          const input = document.getElementById(`color-picker-${selectedPlant?.id}`);
                          if (input) input.click();
                        }}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          border: "2px solid #ddd",
                          backgroundColor: userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF",
                          cursor: "pointer",
                          transition: "transform 0.1s ease",
                          margin: "8px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                      <input
                        id={`color-picker-${selectedPlant?.id}`}
                        type="color"
                        value={userPlants.find(p => p.id === selectedPlant.id)?.color || "#FFFFFF"}
                        onChange={(e) => {
                          const plant = userPlants.find(p => p.id === selectedPlant.id);
                          if (plant) handleUpdateColor(plant.id, e.target.value);
                        }}
                        style={{
                          position: "fixed",
                          opacity: 0,
                          pointerEvents: "none",
                          width: 0,
                          height: 0
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

                <div style={{ marginTop: "0" }}>
                  <div style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: (() => {
                        const color = userPlants.find(p => p.id === selectedPlant.id)?.color;
                        return color && color !== "#FFFFFF" ? color : "#A8C686";
                      })(),
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt="" />
                    </div>
                    <div style={{ marginLeft: "14px", flex: 1 }}>
                      <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0" }}>Описание</p>
                      <p style={{ fontSize: "20px", margin: 0, lineHeight: "1.5" }}>{selectedPlant.description}</p>
                    </div>
                  </div>
                  <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
                  <div style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: (() => {
                        const color = userPlants.find(p => p.id === selectedPlant.id)?.color;
                        return color && color !== "#FFFFFF" ? color : "#A8C686";
                      })(),
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt="" />
                    </div>
                    <div style={{ marginLeft: "14px", flex: 1 }}>
                      <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0" }}>Сезон</p>
                      <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5" }}>{selectedPlant.season}</p>
                    </div>
                  </div>
                  <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
                  <div style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    padding: "16px"
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: (() => {
                        const color = userPlants.find(p => p.id === selectedPlant.id)?.color;
                        return color && color !== "#FFFFFF" ? color : "#A8C686";
                      })(),
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt="" />
                    </div>
                    <div style={{ marginLeft: "14px", flex: 1 }}>
                      <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0" }}>Рекомендации</p>
                      <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5" }}>{selectedPlant.recommendations || "У этого растения пока нет рекомендаций, но скоро появятся"}</p>
                    </div>
                  </div>
                  <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
                </div>

                <h1 style={{ fontSize: "32px", fontWeight: "500", color: "#2E2E2E", margin: "40px 0 20px 0" }}>
                  Мои заметки
                </h1>
                <div style={{ marginBottom: "20px" }}>
                  {commentsLoading ? (
                    <p style={{ color: "#999", fontSize: "16px" }}>Загрузка заметок...</p>
                  ) : comments.length === 0 ? (
                    <p style={{ color: "#999", fontSize: "16px" }}>Заметок пока нет. Добавьте первую!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        marginBottom: "16px",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        padding: "12px 16px"
                      }}>
                        <div style={{
                          width: "52px",
                          height: "52px",
                          backgroundColor: (() => {
                            const color = userPlants.find(p => p.id === selectedPlant.id)?.color;
                            return color && color !== "#FFFFFF" ? color : "#A8C686";
                          })(),
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt="" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editingCommentId === comment.id ? (
                            <div>
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: '1px solid #A8C686',
                                  fontSize: '16px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={() => handleSaveEditComment(comment.id)}
                                  disabled={commentUpdating || !editingCommentText.trim()}
                                  style={{
                                    background: '#A8C686',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    cursor: commentUpdating || !editingCommentText.trim() ? 'default' : 'pointer',
                                    opacity: commentUpdating || !editingCommentText.trim() ? 0.6 : 1
                                  }}
                                >
                                  {commentUpdating ? '...' : 'Сохранить'}
                                </button>
                                <button
                                  onClick={handleCancelEditComment}
                                  style={{
                                    background: '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5", wordBreak: "break-word", borderRadius: "8px", padding: "8px", paddingBottom: "20px", background: "#E1E9D9", width: "95%" }}>{comment.text}</p>
                          )}
                        </div>
                        {!editingCommentId && (
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            right: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}>
                            <button
                              onClick={() => handleStartEditComment(comment)}
                              title="Редактировать заметку"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                width: "24px",
                                height: "24px",
                                padding: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <img src="/edit_icon.svg" alt="" style={{ width: "26.5px", height: "26.5px" }} />
                            </button>

                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              title="Удалить заметку"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#ccc",
                                fontSize: "20px",
                                width: "24px",
                                height: "24px",
                                padding: "0",
                                flexShrink: 0
                              }}
                            >
                              <img src="/delete_icon.svg" alt="" style={{ width: "26.5px", height: "26.5px" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <textarea
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      placeholder="Добавить заметку..."
                      rows={2}
                      style={{
                        flex: 1,
                        resize: "vertical",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1px solid #ddd",
                        fontSize: "16px",
                        fontFamily: "inherit",
                        outline: "none",
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
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: newCommentText.trim() ? "pointer" : "default",
                        height: "60px",
                        width: "20%",
                        flexShrink: 0,
                        transition: "background-color 0.2s",
                      }}
                    >
                      {commentSubmitting ? "..." : "Добавить"}
                    </button>
                  </div>
                </div>

                <footer className="modal_footer" style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    style={{
                      backgroundColor: "#DF7171",
                      color: "white",
                      width: "252px",
                      height: "48px",
                      fontSize: "16px",
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
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative', width: "60%" }}>
                <h2>Добавить растение</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setAddPlantModalOpen(false)}
                >
                  ✕
                </button>
                <input
                  type="text"
                  placeholder="Поиск растения..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc" }}
                />
                {searchError && (
                  <div style={{ color: 'red', fontSize: '12px', margin: '5px 0' }}>
                    {searchError}
                  </div>
                )}
                {allPlants.length === 0 && !loading && (
                  <div style={{ color: 'orange', fontSize: '12px', margin: '5px 0', textAlign: 'center' }}>
                    ⚠️ База растений пуста. Обратитесь к администратору.
                  </div>
                )}

                <div
                  onClick={() => {
                    setAddPlantModalOpen(false);
                    setShowCreatePlantModal(true);
                    setNewPlantData({
                      name: "",
                      description: "",
                      season: "",
                      recommendations: "",
                      photoIndex: 0,
                    });
                    setNewPlantColor("#FFFFFF");
                  }}
                  style={{
                    padding: "10px",
                    border: "1px dashed #A8C686",
                    borderRadius: "8px",
                    margin: "5px 0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "#f9f9f9"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#E8F0E0",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    color: "#A8C686"
                  }}>+</div>
                  <div>
                    <strong>Добавить растение</strong>
                    <p style={{ fontSize: "12px", margin: "0", color: "#666" }}>Создать новое растение в каталоге</p>
                  </div>
                </div>

                <div style={{ maxHeight: "400px", overflowY: "auto", margin: "10px 0" }}>
                  {(searchQuery.trim() === "" ? allPlants : searchResults).map((plant) => (
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
                      <div style={{ width: "40px", height: "40px", backgroundColor: "#F5F5F5", borderRadius: "8px", overflow: "hidden" }}>
                        <PlantImage
                          src={plant.photo}
                          alt={plant.name}
                          plantId={plant.id}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div>
                        <strong>{plant.name}</strong>
                        <p style={{ fontSize: "12px", margin: "0" }}>{plant.season}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {searchQuery && searchResults.length === 0 && !searchError && allPlants.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Растения не найдены
                  </div>
                )}
                {selectedPlantToAdd && (
                  <div style={{ marginTop: "10px" }}>
                    <label>Выбрать комнату: </label>
                    <select
                      value={selectedRoomForAdd}
                      onChange={(e) => setSelectedRoomForAdd(e.target.value)}
                      style={{ padding: "5px", borderRadius: "5px" }}
                    >
                      <option value="">Без комнаты</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.name}>{room.name}</option>
                      ))}
                    </select>
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <label style={{ fontSize: "14px", fontWeight: "500" }}>Цвет фона:</label>
                        <div
                          onClick={() => {
                            const input = document.getElementById('color-picker-add-desktop');
                            if (input) input.click();
                          }}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "6px",
                            border: "2px solid #ddd",
                            backgroundColor: selectedColor,
                            cursor: "pointer",
                            transition: "transform 0.1s ease",
                            margin: "8px"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        />
                        <input
                          id="color-picker-add-desktop"
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          style={{
                            position: "fixed",
                            opacity: 0,
                            pointerEvents: "none",
                            width: 0,
                            height: 0
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#A8C686" />
                        </svg>
                        <span style={{ fontSize: "12px", color: "#666" }}>Цвет влияет на иконки в карточке растения</span>
                      </div>
                    </div>
                  </div>
                )}
                <footer className="modal_footer">
                  <button
                    style={{ backgroundColor: "#A8C686", color: "white", width: "100%", height: "43px", fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer" }}
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
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative', width: "60%" }}>
                <h2>Добавить растение в "{selectedRoomForPlant.name}"</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setAddToRoomModalOpen(false)}
                >
                  ✕
                </button>
                <input
                  type="text"
                  placeholder="Поиск растения..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc" }}
                />

                {userPlants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    У вас пока нет растений. Добавьте их через раздел "Мои растения".
                  </div>
                ) : (
                  <div style={{ maxHeight: "500px", overflowY: "auto", margin: "10px 0" }}>
                    {userPlants
                      .filter(up => up.plant.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((userPlant) => (
                        <div
                          key={userPlant.id}
                          onClick={() => setSelectedUserPlantToAdd(userPlant)}
                          style={{
                            padding: "10px",
                            border: selectedUserPlantToAdd?.id === userPlant.id ? "2px solid #A8C686" : "1px solid #eee",
                            borderRadius: "8px",
                            margin: "5px 0",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}
                        >
                          <div style={{ width: "40px", height: "40px", backgroundColor: "#F5F5F5", borderRadius: "8px", overflow: "hidden" }}>
                            <PlantImage
                              src={userPlant.plant.photo}
                              alt={userPlant.plant.name}
                              plantId={userPlant.id}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: userPlant.color && userPlant.color !== "#FFFFFF" ? userPlant.color : "#A8C686",
                              border: '1px solid #ddd'
                            }} />
                            <div>
                              <strong>{userPlant.plant.name}</strong>
                              <p style={{ fontSize: '12px', margin: '0', color: '#666' }}>Комната: {userPlant.room?.name || "Без комнаты"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <footer className="modal_footer">
                  <button
                    style={{
                      backgroundColor: "#A8C686",
                      color: "white",
                      width: "100%",
                      height: "43px",
                      fontSize: "16px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: selectedUserPlantToAdd ? "pointer" : "default",
                      opacity: selectedUserPlantToAdd ? 1 : 0.5
                    }}
                    onClick={handleAddPlantToRoom}
                    disabled={!selectedUserPlantToAdd}
                  >
                    Добавить в комнату
                  </button>
                </footer>
              </section>
            </div>
          )}

          {addRoomModalOpen && (
            <div className="modal-overlay" onClick={() => setAddRoomModalOpen(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                <h2>Добавить комнату</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setAddRoomModalOpen(false)}
                >
                  ✕
                </button>
                <input
                  type="text"
                  placeholder="Название комнаты..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  style={{ width: "100%", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #ccc" }}
                />
                <footer className="modal_footer">
                  <button
                    style={{ backgroundColor: "#A8C686", color: "white", width: "100%", height: "43px", fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                    onClick={addNewRoom}
                  >
                    Добавить
                  </button>
                </footer>
              </section>
            </div>
          )}

          {showCreatePlantModal && (
            <div className="modal-overlay" onClick={() => setShowCreatePlantModal(false)}>
              <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
                <h2>Новое растение</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowCreatePlantModal(false)}
                >
                  ✕
                </button>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  <div onClick={() => setShowImageGrid(true)} style={{ width: '200px', height: '200px', backgroundColor: '#f0f0f0', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img
                      src={newPlantData.photoIndex === 0 ? "/plug-image-plant.png" : `/plug-image-plant${newPlantData.photoIndex}.png`}
                      alt="preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Название растения *</label>
                    <input type="text" value={newPlantData.name} onChange={e => setNewPlantData(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', margin: 0 }} placeholder="Например: Монстера" />
                  </div>
                </div>
                {showImageGrid && (
                  <div className="modal-overlay" onClick={() => setShowImageGrid(false)} style={{ zIndex: 2000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', padding: '20px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                      <h3>Выберите изображение</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '16px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <div key={i} onClick={() => { setNewPlantData(prev => ({ ...prev, photoIndex: i })); setShowImageGrid(false); }} style={{ cursor: 'pointer', border: newPlantData.photoIndex === i ? '3px solid #A8C686' : '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
                            <img src={`/plug-image-plant${i}.png`} alt={`variant ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}><label>Описание</label><textarea value={newPlantData.description} onChange={e => setNewPlantData(prev => ({ ...prev, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', resize: 'none' }} placeholder="Уход, особенности..." /></div>
                <div style={{ marginBottom: '16px' }}><label>Сезон</label><input type="text" value={newPlantData.season} onChange={e => setNewPlantData(prev => ({ ...prev, season: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', margin: 0 }} placeholder="Весна-лето" /></div>
                <div style={{ marginBottom: '16px' }}><label>Рекомендации</label><textarea value={newPlantData.recommendations} onChange={e => setNewPlantData(prev => ({ ...prev, recommendations: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', resize: 'none' }} placeholder="Рекомендации по уходу..." /></div>
                <div style={{ marginBottom: '24px' }}>
                  <label>Цвет фона для карточки</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <div
                      onClick={() => {
                        const input = document.getElementById('color-picker-create-plant-desktop');
                        if (input) input.click();
                      }}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "8px",
                        border: "2px solid #ddd",
                        backgroundColor: newPlantColor,
                        cursor: "pointer",
                        transition: "transform 0.1s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <input
                      id="color-picker-create-plant-desktop"
                      type="color"
                      value={newPlantColor}
                      onChange={(e) => setNewPlantColor(e.target.value)}
                      style={{
                        position: "fixed",
                        opacity: 0,
                        pointerEvents: "none",
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>Цвет будет использован для иконок в карточке растения</span>
                  </div>
                </div>
                <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={handleCreateCustomPlant} disabled={!newPlantData.name.trim()} style={{ padding: '10px 20px', width: '100%', background: newPlantData.name.trim() ? '#A8C686' : '#ccc', border: 'none', borderRadius: '8px', color: 'white', cursor: newPlantData.name.trim() ? 'pointer' : 'default' }}>Добавить</button>
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