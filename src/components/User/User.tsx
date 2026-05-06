import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut, update } from "../../api/authApi";
import { IUpdateUserDto } from "../../api/authApi.types";
import { getUserPlants, deleteUserPlant, updateUserPlant } from "../../api/plantsApi";
import { getUserRooms, type Room, type UserPlant } from "../../api/roomsApi";
import { API } from "../../constants/api";
import "./User.css";

interface Comment {
  id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

async function generateTelegramLinkCode(): Promise<{ code: string; expiresInSeconds: number }> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/telegram/link-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!response.ok) throw new Error("Не удалось сгенерировать код");
  return response.json();
}

const PlantImage: React.FC<{
  src: string | null | undefined;
  alt: string;
  style?: React.CSSProperties;
  plantId?: string | number;
}> = ({ src, alt, style, plantId }) => {
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
      style={{ ...style, objectFit: 'cover', display: 'block' }}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
};

async function fetchComments(userPlantId: string): Promise<Comment[]> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/user-plant/${userPlantId}`, {
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
}

async function createComment(userPlantId: string, text: string): Promise<Comment> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ user_plant_id: userPlantId, text }),
  });
  if (!response.ok) throw new Error("Failed to create comment");
  return response.json();
}

async function deleteComment(commentId: string): Promise<void> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/${commentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!response.ok) throw new Error("Failed to delete comment");
}

async function updateCommentOnServer(commentId: string, text: string): Promise<Comment> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API}/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to update comment");
  return response.json();
}

function User({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [registrationDate, setRegistrationDate] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentUpdating, setCommentUpdating] = useState(false);

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [telegramError, setTelegramError] = useState("");

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const bgCard = isDarkMode ? '#373737' : '#FFFFFF';
  const bgCardHover = isDarkMode ? '#2a2a2a' : '#f5f5f5';
  const bgInput = isDarkMode ? '#2a2a2a' : '#FFFFFF';
  const bgModal = isDarkMode ? '#202020' : '#FFFFFF';
  const textColor = isDarkMode ? '#ffffff' : '#2E2E2E';
  const textSecondary = isDarkMode ? '#cccccc' : '#666666';
  const borderColor = isDarkMode ? '#4a4a4a' : '#dddddd';
  const iconBg = isDarkMode ? '#2a2a2a' : '#F5F5F5';
  const noteBg = isDarkMode ? '#2a2a2a' : '#e1e9d9';
  const noteText = isDarkMode ? '#ffffff' : '#2E2E2E';
  const scrollBg = isDarkMode ? '#202020' : '#f0f0f0';

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 810) setScreenSize('mobile');
      else if (width <= 1055) setScreenSize('desktop');
      else setScreenSize('desktop');
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadData = async () => {
    try {
      const userPlantsData = await getUserPlants();
      setPlants(userPlantsData as UserPlant[]);
      const roomsData = await getUserRooms();
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  };

  const fetchFullUserProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    try {
      const response = await fetch(`${API}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
    } catch (error) {
      console.error("Ошибка получения профиля:", error);
    }
    return null;
  };

  useEffect(() => {
    const authCheck = async () => {
      try {
        const authData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);

        if (authData.user) {
          setUser(authData.user);

          const fullProfile = await fetchFullUserProfile();
          if (fullProfile) {
            setUser((prev: any) => ({ ...prev, ...fullProfile }));
            if (fullProfile.created_at) {
              setRegistrationDate(fullProfile.created_at);
            }
          }

          setFormData({
            username: authData.user.username || "",
            email: authData.user.email || "",
            password: "",
            newPassword: "",
          });
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

  const handleLoginClick = () => navigate("/auth/signin");
  const handleViewMoreClick = () => navigate("/plants/my_plants");
  const handleAddPlantClick = () => navigate("/plants/my_plants");

  const handleLogoutClick = async () => {
    try {
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);
      if (location.pathname === "/user") navigate("/");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccessMessage("");
  };

  const handleSaveChanges = async () => {
    const updatePayload: IUpdateUserDto = {};
    if (formData.username !== user?.username && formData.username.trim() !== "") updatePayload.username = formData.username;
    if (formData.email !== user?.email && formData.email.trim() !== "") updatePayload.email = formData.email;
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
      setFormData(prev => ({ ...prev, password: "", newPassword: "" }));
      setSuccessMessage("Данные успешно обновлены!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Ошибка при сохранении";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTelegramModal = async () => {
    setIsTelegramModalOpen(true);
    setTelegramError("");
    setTelegramCode("");
    setIsTelegramLoading(true);
    try {
      const { code } = await generateTelegramLinkCode();
      setTelegramCode(code);
    } catch (err: any) {
      setTelegramError(err.message || "Не удалось сгенерировать код");
    } finally {
      setIsTelegramLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(telegramCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать код");
    }
  };

  const handleUpdateColor = async (userPlantId: string, color: string) => {
    try {
      await updateUserPlant(userPlantId, { color });
      await loadData();
      if (selectedPlant && selectedPlant.id === userPlantId) {
        setSelectedPlant(prev => prev ? { ...prev, color } : null);
      }
    } catch (error) {
      console.error("Ошибка при обновлении цвета:", error);
    }
  };

  const handleDeleteUserPlant = async (userPlantId: string) => {
    try {
      await deleteUserPlant(userPlantId);
      await loadData();
      setModalOpen(false);
    } catch (error) {
      console.error("Ошибка при удалении растения:", error);
    }
  };

  const openPlantModal = async (plant: UserPlant) => {
    const roomObj = rooms.find(r => r.userPlants.some(p => p.id === plant.id));
    setSelectedPlant(plant);
    setSelectedRoomName(roomObj?.name || "Без комнаты");
    setModalOpen(true);
    setNewCommentText("");
    setComments([]);
    setCommentsLoading(true);
    setEditingCommentId(null);
    try {
      const loaded = await fetchComments(plant.id);
      setComments(loaded);
    } catch (e) {
      console.error("Ошибка загрузки комментариев:", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closePlantModal = () => {
    setModalOpen(false);
    setSelectedPlant(null);
    setComments([]);
    setNewCommentText("");
    setEditingCommentId(null);
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

  const formatRegistrationDate = () => {
    const dateStr = registrationDate || user?.created_at;
    if (!dateStr) return "Дата неизвестна";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Дата неизвестна";
      return date.toLocaleDateString("ru-RU", { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return "Дата неизвестна";
    }
  };

  const getUserName = () => {
    if (!user) return "";
    return user.username || user.email?.split("@")[0] || "Пользователь";
  };

  if (loading) {
    return (
      <div className="appUZ">
        <header className="header">
          <div className="header-content">
            <Link to="/"><img src={"/logo.svg"} alt="Florally" className="logo" /></Link>
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

  const renderPlantCard = (plant: UserPlant) => {
    const roomName = rooms.find(r => r.userPlants.some(p => p.id === plant.id))?.name || "Без комнаты";
    return (
      <div
        key={plant.id}
        onClick={() => openPlantModal(plant)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '212px',
          height: '212px',
          backgroundColor: bgCard,
          borderRadius: '20px',
          padding: '8px',
          transition: 'background-color 0.3s ease',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ position: 'relative', width: '196px', height: '148px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg, borderRadius: '20px', marginTop: '8px', overflow: 'hidden' }}>
          <PlantImage src={plant.plant.photo} alt={plant.plant.name} plantId={plant.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <p style={{ fontWeight: '500', margin: '8px 0 0 0', fontSize: '14px', textAlign: 'center', color: textColor }}>{plant.plant.name}</p>
        <p style={{ fontSize: '12px', color: textSecondary, margin: '4px 0 0 0' }}>Комната: {roomName}</p>
      </div>
    );
  };

  if (screenSize === 'mobile') {
    return (
      <div className="mobile-appUz">
        <header className="mobile-header">
          <div className="mobile-header-content">
            <Link to="/"> <img src="/logo.svg" alt="Florally" className="mobile-logo" /> </Link>
          </div>
        </header>
        <main className="mobile-main-content">
          <div className="mobile-content-wrapper">
            <div className="mobile-form-container full-height">
              {isLoggedIn && user ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-header">
                    <h1 className="mobile-user-name" style={{ color: textColor }}>{getUserName()}</h1>
                    <p className="mobile-registration-date" style={{ color: textSecondary }}>Зарегистрирован {formatRegistrationDate()}</p>
                  </div>
                  <div className="mobile-user-form">
                    <h2 className="mobile-section-title" style={{ color: textColor }}>Редактировать профиль</h2>
                    {error && <div className="error-message" style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
                    {successMessage && <div className="success-message" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{successMessage}</div>}
                    <div className="mobile-form-grid">
                      <div className="mobile-form-group">
                        <label htmlFor="username" style={{ color: textSecondary }}>Имя</label>
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleFormChange} placeholder="Имя" className="mobile-input" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="email" style={{ color: textSecondary }}>Почта</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Почта" className="mobile-input" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="password" style={{ color: textSecondary }}>Текущий пароль</label>
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Текущий пароль" className="mobile-input" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} autoComplete="current-password" />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="newPassword" style={{ color: textSecondary }}>Новый пароль</label>
                        <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Новый пароль" className="mobile-input" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} autoComplete="new-password" />
                      </div>
                    </div>
                    <button className="mobile-save-changes-btn" onClick={handleSaveChanges} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? "Сохранение..." : "Сохранить изменения"}</button>
                  </div>
                  <div className="mobile-user-plants">
                    <h2 className="mobile-section-title" style={{ color: textColor }}>Мои растения</h2>
                    {plants && plants.length > 0 ? (
                      <>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px',
                          padding: '8px 0'
                        }}>
                          {plants.slice(0, 4).map((plant) => {
                            const roomName = rooms.find(r => r.userPlants.some(p => p.id === plant.id))?.name || "Без комнаты";
                            return (
                              <div
                                key={plant.id}
                                onClick={() => openPlantModal(plant)}
                                style={{
                                  backgroundColor: bgCard,
                                  borderRadius: '16px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  transition: 'transform 0.2s ease'
                                }}
                              >
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                                  <PlantImage
                                    src={plant.plant.photo}
                                    alt={plant.plant.name}
                                    plantId={plant.id}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
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
                                <p style={{ fontWeight: '500', margin: '8px 0 4px 0', fontSize: '14px', textAlign: 'center', color: textColor }}>{plant.plant.name}</p>
                                <p style={{ fontSize: '12px', color: textSecondary, margin: 0, textAlign: 'center' }}>Комната: {roomName}</p>
                              </div>
                            );
                          })}
                        </div>
                        <button className="mobile-view-more-btn" onClick={handleViewMoreClick}>Посмотреть еще</button>
                      </>
                    ) : (
                      <button className="mobile-view-more-btn" onClick={handleAddPlantClick}>Добавить растение</button>
                    )}
                  </div>
                  <div className="mobile-user-actions">
                    <button className="mobile-logout-btn" onClick={handleLogoutClick}>Выйти из аккаунта</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mobile-title" style={{ color: textColor }}>Зарегистрируйся,<br />чтобы знать больше<br />о своих растениях!</h2>
                  <div className="mobile-button-container">
                    <Link to="/auth/signup" className="mobile-registration-link">
                      <button className="mobile-registration-button">Зарегистрироваться</button>
                    </Link>
                  </div>
                  <div className="mobile-login-container">
                    <span className="mobile-login-text" style={{ color: textSecondary }}>Есть аккаунт? <Link to="/auth/signin" className="mobile-login-link">Войти</Link></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
        <div className="mobile-bottom-menu">
          <Link to="/plants/my_plants" className="mobile-menu-item"><img src="/ph_plant-dark.svg" alt="Мои растения" className={`mobile-menu-icon ${isMyPlantsActive ? 'active-icon' : ''}`} /></Link>
          <Link to="/" className="mobile-menu-item"><img src="/proicons_calendar.svg" alt="Календарь" className={`mobile-menu-icon ${isCalendarActive ? 'active-icon' : ''}`} /></Link>
          <Link to="/user" className="mobile-menu-item"><img src="/ion_person-outline.svg" alt="Профиль" className={`mobile-menu-icon ${isUserActive ? 'active-icon' : ''}`} /></Link>
        </div>

        {modalOpen && selectedPlant && (
          <div className="modal-overlay" onClick={closePlantModal}>
            <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', position: 'relative', backgroundColor: bgModal, color: textColor }}>
              <button
                className="modal-close-btn"
                onClick={closePlantModal}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
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
                  <div style={{ width: '120px', height: '120px', backgroundColor: iconBg, borderRadius: '16px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <PlantImage
                      src={selectedPlant.plant.photo}
                      alt={selectedPlant.plant.name}
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
                      lineHeight: "1.3",
                      color: textColor
                    }}>
                      {selectedPlant.plant.name}
                    </h2>
                    <p style={{
                      fontSize: '14px',
                      color: textSecondary,
                      margin: '0 0 12px 0'
                    }}>
                      Комната: {selectedRoomName}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <label style={{ fontSize: "14px", color: textColor }}>Цвет фона:</label>
                      <div
                        onClick={() => {
                          const input = document.getElementById(`color-picker-user-mobile-${selectedPlant.id}`);
                          if (input) input.click();
                        }}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "6px",
                          border: "2px solid #ddd",
                          backgroundColor: selectedPlant.color || "#FFFFFF",
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
                        id={`color-picker-user-mobile-${selectedPlant.id}`}
                        type="color"
                        value={selectedPlant.color || "#FFFFFF"}
                        onChange={(e) => handleUpdateColor(selectedPlant.id, e.target.value)}
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

              <h1 style={{ fontSize: "28px", fontWeight: "500", color: textColor, margin: "0", marginTop: "36px" }}>Уход за растением</h1>
              <div style={{ marginTop: "20px" }}>
                <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: bgCard, borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = selectedPlant.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                  </div>
                  <div style={{ marginLeft: "14px" }}>
                    <p style={{ fontSize: "20px", fontWeight: "450", color: textColor }}>Описание</p>
                    <p style={{ fontSize: "16px", color: textSecondary }}>{selectedPlant.plant.description}</p>
                  </div>
                </div>
                <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
                <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: bgCard, borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = selectedPlant.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                  </div>
                  <div style={{ marginLeft: "14px" }}>
                    <p style={{ fontSize: "20px", fontWeight: "450", color: textColor }}>Сезон</p>
                    <p style={{ fontSize: "16px", color: textSecondary }}>{selectedPlant.plant.season}</p>
                  </div>
                </div>
                <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
                <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: bgCard, borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "52px", height: "52px", minWidth: "52px", minHeight: "52px", flexShrink: 0, backgroundColor: (() => { const color = selectedPlant.color; return color && color !== "#FFFFFF" ? color : "#A8C686"; })(), borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img style={{ width: "32px", height: "32px" }} src="/ph_plant-light.svg" alt=""/>
                  </div>
                  <div style={{ marginLeft: "14px" }}>
                    <p style={{ fontSize: "20px", fontWeight: "450", color: textColor }}>Рекомендации</p>
                    <p style={{ fontSize: "16px", color: textSecondary }}>{selectedPlant.plant.recommendations || "У этого растения пока нет рекомендаций, но скоро появятся"}</p>
                  </div>
                </div>
                <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }}/>
              </div>

              <h1 style={{ fontSize: "24px", fontWeight: "500", color: textColor, margin: "28px 0 16px 0" }}>
                Мои заметки
              </h1>
              <div style={{ marginBottom: "20px" }}>
                {commentsLoading ? (
                  <p style={{ color: textSecondary, fontSize: "14px" }}>Загрузка заметок...</p>
                ) : comments.length === 0 ? (
                  <p style={{ color: textSecondary, fontSize: "14px" }}>Заметок пока нет. Добавьте первую!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "12px",
                      backgroundColor: bgCard,
                      borderRadius: "10px",
                      padding: "10px 12px"
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: (() => {
                          const color = selectedPlant.color;
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
                                resize: 'vertical',
                                backgroundColor: bgInput,
                                color: textColor
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
                          <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.5", wordBreak: "break-word", border: "none", background: noteBg, borderRadius: "5px", padding: "5px", paddingBottom: "20px", paddingRight: "70px", color: noteText }}>{comment.text}</p>
                        )}
                      </div>
                      {!editingCommentId && (
                        <div style={{ flexShrink: 0 }}>
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
                      border: `1px solid ${borderColor}`,
                      fontSize: "14px",
                      fontFamily: "inherit",
                      outline: "none",
                      height: "44px",
                      backgroundColor: bgInput,
                      color: textColor
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
      </div>
    );
  }

  return (
    <div className="appUZ">
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
            
            {isLoggedIn ? <div className="user-info"><button className="auth-section-button logout-button" onClick={handleLogoutClick}>Выйти</button></div> : <button className="auth-section-button login-button" onClick={handleLoginClick}>Войти</button>}
          </div>
        </div>
      </header>
      <main className="user-content">
        <section className="user-container">
          <div className="user-card" style={{ backgroundColor: bgCard, color: textColor }}>
            {isLoggedIn && user ? (
              <div className="user-profile">
                <div className="user-header" style={{ display: 'flex', alignItems: 'center', gap: '12px',justifyContent: 'space-between' }}>
                  <div>
                    <h1 className="user-name" style={{ color: textColor }}>{getUserName()}</h1>
                    <p className="registration-date" style={{ color: textSecondary }}>Зарегистрирован {formatRegistrationDate()}</p>
                  </div>
                  <a href="https://t.me/FlorallyBBot" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <img src="/Telegram.svg" alt="Telegram" style={{ width: '36px', height: '36px' }} />
                  </a>
                </div>
                <div className="user-form">
                  <h2 style={{ color: textColor }}>Редактировать профиль</h2>
                  {error && <div className="error-message" style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
                  {successMessage && <div className="success-message" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{successMessage}</div>}
                  <div className="form-grid">
                    <div className="form-group"><label htmlFor="username" style={{ color: textSecondary }}>Имя</label><input type="text" id="username" name="username" value={formData.username} onChange={handleFormChange} placeholder="Имя" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} /></div>
                    <div className="form-group"><label htmlFor="email" style={{ color: textSecondary }}>Почта</label><input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Почта" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} /></div>
                    <div className="form-group"><label htmlFor="password" style={{ color: textSecondary }}>Текущий пароль</label><input type="password" id="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Текущий пароль" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} autoComplete="current-password" /></div>
                    <div className="form-group"><label htmlFor="newPassword" style={{ color: textSecondary }}>Новый пароль</label><input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Новый пароль" style={{ backgroundColor: bgInput, color: textColor, borderColor: borderColor }} autoComplete="new-password" /></div>
                  </div>
                  <button className="save-changes-btn" onClick={handleSaveChanges} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? "Сохранение..." : "Сохранить изменения"}</button>
                  <button className="save-changes-btn" onClick={handleOpenTelegramModal} style={{ marginTop: '12px', backgroundColor: '#68863F' }}>Подключить Telegram</button>
                </div>
                <div className="user-plants">
                  <h2 style={{ color: textColor }}>Мои растения</h2>
                  {plants && plants.length > 0 ? (
                    <>
                      <div className="scroll-container" style={{ backgroundColor: scrollBg, borderRadius: '16px', padding: '16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start', alignItems: 'flex-start', width: 'max-content', maxHeight: '244px' }}>
                          {plants.slice(0, 3).map(plant => renderPlantCard(plant))}
                        </div>
                      </div>
                      <button className="view-more-btn" onClick={handleViewMoreClick}>Посмотреть еще</button>
                    </>
                  ) : (
                    <button className="view-more-btn" onClick={handleAddPlantClick}>Добавить растение</button>
                  )}
                </div>
                <div className="user-actions"><button className="logout-bottom-btn" onClick={handleLogoutClick}>Выйти из аккаунта</button></div>
              </div>
            ) : (
              <div className="not-authorized-container">
                <div className="not-authorized-message">
                  <p style={{ color: textColor }}> Зарегистрируйся,
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
                    <span style={{ fontSize: "1.7vh", color: textSecondary }} className="login-link">
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
            )}
          </div>
          <div className="user-image-section"><img src="/user-back-img.svg" alt="Парень и девушка сажают цветы" className="user-background-image" /></div>
        </section>
      </main>
      {modalOpen && selectedPlant && (
        <div className="modal-overlay" onClick={closePlantModal}>
          <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', backgroundColor: bgModal, color: textColor }}>
            <button
              className="modal-close-btn"
              onClick={closePlantModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
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
            <div style={{ display: "flex", gap: "33px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: '220px', height: '220px', backgroundColor: iconBg, borderRadius: '20px', overflow: 'hidden', flexShrink: 0 }}>
                <PlantImage
                  src={selectedPlant.plant.photo}
                  alt={selectedPlant.plant.name}
                  plantId={selectedPlant.id}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h1 style={{
                  fontSize: "36px",
                  fontWeight: "500",
                  color: textColor,
                  margin: "0 0 12px 0",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: "1.2"
                }}>
                  {selectedPlant.plant.name}
                </h1>
                <p style={{
                  fontSize: "18px",
                  color: textSecondary,
                  margin: "0 0 16px 0",
                  fontWeight: "450"
                }}>
                  Комната: {selectedRoomName}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "500", color: textColor }}>Цвет фона:</label>
                  <div
                    onClick={() => {
                      const input = document.getElementById(`color-picker-user-${selectedPlant.id}`);
                      if (input) input.click();
                    }}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "8px",
                      border: "2px solid #ddd",
                      backgroundColor: selectedPlant.color || "#FFFFFF",
                      cursor: "pointer",
                      transition: "transform 0.1s ease",
                      margin: "8px"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <input
                    id={`color-picker-user-${selectedPlant.id}`}
                    type="color"
                    value={selectedPlant.color || "#FFFFFF"}
                    onChange={(e) => handleUpdateColor(selectedPlant.id, e.target.value)}
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
              color: textColor,
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
                backgroundColor: bgCard,
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  backgroundColor: (() => {
                    const color = selectedPlant.color;
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
                  <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0", color: textColor }}>Описание</p>
                  <p style={{ fontSize: "20px", margin: 0, lineHeight: "1.5", color: textSecondary }}>{selectedPlant.plant.description}</p>
                </div>
              </div>
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
              <div style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "20px",
                backgroundColor: bgCard,
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  backgroundColor: (() => {
                    const color = selectedPlant.color;
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
                  <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0", color: textColor }}>Сезон</p>
                  <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5", color: textSecondary }}>{selectedPlant.plant.season}</p>
                </div>
              </div>
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
              <div style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "20px",
                backgroundColor: bgCard,
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  backgroundColor: (() => {
                    const color = selectedPlant.color;
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
                  <p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0", color: textColor }}>Рекомендации</p>
                  <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5", color: textSecondary }}>{selectedPlant.plant.recommendations || "У этого растения пока нет рекомендаций, но скоро появятся"}</p>
                </div>
              </div>
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
            </div>

            <h1 style={{ fontSize: "32px", fontWeight: "500", color: textColor, margin: "40px 0 20px 0" }}>
              Мои заметки
            </h1>
            <div style={{ marginBottom: "20px" }}>
              {commentsLoading ? (
                <p style={{ color: textSecondary, fontSize: "16px" }}>Загрузка заметок...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: textSecondary, fontSize: "16px" }}>Заметок пока нет. Добавьте первую!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    marginBottom: "16px",
                    backgroundColor: bgCard,
                    borderRadius: "12px",
                    padding: "12px 16px"
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: (() => {
                        const color = selectedPlant.color;
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
                              resize: 'vertical',
                              backgroundColor: bgInput,
                              color: textColor
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
                        <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5", wordBreak: "break-word", borderRadius: "8px", padding: "8px", paddingBottom: "20px", background: noteBg, width: "95%", color: noteText }}>{comment.text}</p>
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
                    border: `1px solid ${borderColor}`,
                    fontSize: "16px",
                    fontFamily: "inherit",
                    outline: "none",
                    backgroundColor: bgInput,
                    color: textColor
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

      {isTelegramModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTelegramModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center', backgroundColor: bgModal, color: textColor }}>
            <button className="modal-close" onClick={() => setIsTelegramModalOpen(false)} style={{ color: '#a8c686' }}>×</button>
            <h2 className="modal-title">Подключение Telegram</h2>
            {isTelegramLoading ? (
              <p>Генерация кода...</p>
            ) : telegramError ? (
              <>
                <p style={{ color: '#DF7171' }}>{telegramError}</p>
                <button className="modal-button" onClick={() => setIsTelegramModalOpen(false)}>Закрыть</button>
              </>
            ) : (
              <>
                <p>Скопируйте код и отправьте его боту <strong>@FlorallyBBot</strong> для привязки аккаунта</p>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  letterSpacing: '4px',
                  background: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                  padding: '16px',
                  borderRadius: '12px',
                  margin: '16px 0',
                  fontFamily: 'monospace'
                }}>{telegramCode}</div>
                <button
                  className="modal-button"
                  onClick={handleCopyCode}
                  style={{ backgroundColor: '#A8C686' }}
                >
                  {codeCopied ? 'Скопировано!' : 'Скопировать код'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default User;