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

const PlantImage: React.FC<{ src: string | null | undefined; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
  const [hasError, setHasError] = useState(false);
  const plugImage = "/plug-image-plant.png";
  const imageSrc = (hasError || !src || src.trim() === "") ? plugImage : src;
  return <img src={imageSrc} alt={alt} style={{ ...style, objectFit: 'cover', display: 'block' }} onError={() => { if (!hasError) setHasError(true); }} />;
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

function User() {
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

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width <= 810) setScreenSize('mobile');
      else if (width <= 1055) setScreenSize('tablet');
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

  const handleUpdateColor = async (userPlantId: string, color: string) => {
    try {
      await updateUserPlant(userPlantId, { color });
      await loadData();
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

  const formatRegistrationDate = () => {
    if (!user || !user.createdAt) return new Date().toLocaleDateString("ru-RU");
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
            <img src="/logo.svg" alt="Florally" className="logo" />
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
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '8px',
          transition: 'background-color 0.3s ease',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ width: '196px', height: '148px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: '20px', marginTop: '8px', overflow: 'hidden' }}>
          <PlantImage src={plant.plant.photo} alt={plant.plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <p style={{ fontWeight: '500', margin: '8px 0 0 0', fontSize: '14px', textAlign: 'center' }}>{plant.plant.name}</p>
        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Комната: {roomName}</p>
      </div>
    );
  };

  if (screenSize === 'mobile') {
    return (
      <div className="mobile-app">
        <header className="mobile-header">
          <div className="mobile-header-content">
            <img src="/logo.svg" alt="Florally" className="mobile-logo" />
          </div>
        </header>
        <main className="mobile-main-content">
          <div className="mobile-content-wrapper">
            <div className="mobile-form-container full-height">
              {isLoggedIn && user ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-header">
                    <h1 className="mobile-user-name">{getUserName()}</h1>
                    <p className="mobile-registration-date">Зарегистрирован {formatRegistrationDate()}</p>
                  </div>
                  <div className="mobile-user-form">
                    <h2 className="mobile-section-title">Редактировать профиль</h2>
                    {error && <div className="error-message" style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
                    {successMessage && <div className="success-message" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{successMessage}</div>}
                    <div className="mobile-form-grid">
                      <div className="mobile-form-group">
                        <label htmlFor="username">Имя</label>
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleFormChange} placeholder="Имя" className="mobile-input" />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="email">Почта</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Почта" className="mobile-input" />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="password">Текущий пароль</label>
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Текущий пароль" className="mobile-input" autoComplete="current-password" />
                      </div>
                      <div className="mobile-form-group">
                        <label htmlFor="newPassword">Новый пароль</label>
                        <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Новый пароль" className="mobile-input" autoComplete="new-password" />
                      </div>
                    </div>
                    <button className="mobile-save-changes-btn" onClick={handleSaveChanges} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? "Сохранение..." : "Сохранить изменения"}</button>
                  </div>
                  <div className="mobile-user-plants">
                    <h2 className="mobile-section-title">Мои растения</h2>
                    {plants && plants.length > 0 ? (
                      <>
                        <div style={{ backgroundColor: '#f0f0f0', borderRadius: '16px', padding: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                            {plants.slice(0, 3).map(plant => renderPlantCard(plant))}
                          </div>
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
                  <h2 className="mobile-title">Зарегистрируйся,<br />чтобы знать больше<br />о своих растениях!</h2>
                  <div className="mobile-button-container">
                    <Link to="/auth/signup" className="mobile-registration-link">
                      <button className="mobile-registration-button">Зарегистрироваться</button>
                    </Link>
                  </div>
                  <div className="mobile-login-container">
                    <span className="mobile-login-text">Есть аккаунт? <Link to="/auth/signin" className="mobile-login-link">Войти</Link></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
        <div className="mobile-bottom-menu">
          <Link to="/plants/my_plants" className="mobile-menu-item"><img src="/ph_plant-light.svg" alt="Мои растения" className={`mobile-menu-icon ${isMyPlantsActive ? 'active-icon' : ''}`} /></Link>
          <Link to="/" className="mobile-menu-item"><img src="/proicons_calendar.svg" alt="Календарь" className={`mobile-menu-icon ${isCalendarActive ? 'active-icon' : ''}`} /></Link>
          <Link to="/user" className="mobile-menu-item"><img src="/ion_person-outline.svg" alt="Профиль" className={`mobile-menu-icon ${isUserActive ? 'active-icon' : ''}`} /></Link>
        </div>
        {modalOpen && selectedPlant && (
          <div className="modal-overlay" onClick={closePlantModal}>
            <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ width: '120px', height: '120px', backgroundColor: '#F5F5F5', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                  <PlantImage src={selectedPlant.plant.photo} alt={selectedPlant.plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', fontWeight: '600', wordBreak: "break-word" }}>{selectedPlant.plant.name}</h2>
                  <p style={{ fontSize: '14px', color: '#666', margin: '0 0 12px 0' }}>Комната: {selectedRoomName}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ fontSize: "14px" }}>Цвет фона:</label>
                    <input type="color" value={selectedPlant.color || "#FFFFFF"} onChange={(e) => handleUpdateColor(selectedPlant.id, e.target.value)} style={{ width: "40px", height: "40px", border: "2px solid #ddd", borderRadius: "6px", cursor: "pointer" }} />
                  </div>
                </div>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "500", color: "#2E2E2E", margin: "36px 0 0 0" }}>Уход за растением</h1>
              <div style={{ marginTop: "20px" }}>
                <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "52px", height: "52px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><img style={{ width: "32px", height: "32px" }} src="/plant_light.svg" alt="" /></div>
                  <div style={{ marginLeft: "14px" }}><p style={{ fontSize: "20px", fontWeight: "450" }}>Описание</p><p style={{ fontSize: "16px" }}>{selectedPlant.plant.description}</p></div>
                </div>
                <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }} />
                <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: "15px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ width: "52px", height: "52px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><img style={{ width: "32px", height: "32px" }} src="/plant_light.svg" alt="" /></div>
                  <div style={{ marginLeft: "14px" }}><p style={{ fontSize: "20px", fontWeight: "450" }}>Сезон</p><p style={{ fontSize: "16px" }}>{selectedPlant.plant.season}</p></div>
                </div>
                <hr style={{ width: "100%", marginBottom: "14px", opacity: "50%", borderColor: "#A8C686" }} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: "500", color: "#2E2E2E", margin: "28px 0 16px 0" }}>Мои заметки</h1>
              <div style={{ marginBottom: "20px" }}>
                {commentsLoading ? <p style={{ color: "#999", fontSize: "14px" }}>Загрузка заметок...</p> : comments.length === 0 ? <p style={{ color: "#999", fontSize: "14px" }}>Заметок пока нет. Добавьте первую!</p> : comments.map(comment => (
                  <div key={comment.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "10px", padding: "10px 12px" }}>
                    <div style={{ width: "40px", height: "40px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}><img style={{ width: "24px", height: "24px" }} src="/plant_light.svg" alt="" /></div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: "14px", margin: 0, lineHeight: "1.5", wordBreak: "break-word" }}>{comment.text}</p></div>
                    <button onClick={() => handleDeleteComment(comment.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "18px", flexShrink: 0, paddingTop: "10px" }} onMouseEnter={e => (e.currentTarget.style.color = "#DF7171")} onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}>×</button>
                  </div>
                ))}
                <hr style={{ width: "100%", margin: "16px 0", opacity: "50%", borderColor: "#A8C686" }} />
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  <textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Добавить заметку..." rows={2} style={{ flex: 1, resize: "vertical", padding: "8px 12px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", outline: "none", backgroundColor: "#FFFFFF" }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
                  <button onClick={handleAddComment} disabled={commentSubmitting || !newCommentText.trim()} style={{ backgroundColor: newCommentText.trim() ? "#A8C686" : "#ddd", color: "white", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "14px", cursor: newCommentText.trim() ? "pointer" : "default", height: "44px", flexShrink: 0 }}>{commentSubmitting ? "..." : "Добавить"}</button>
                </div>
              </div>
              <button style={{ backgroundColor: "#DF7171", color: "white", width: "252px", height: "43px", fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer" }} onClick={() => handleDeleteUserPlant(selectedPlant.id)}>Удалить растение</button>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src="/logo.svg" alt="Florally" className="logo" />
          <nav className="navigation">
            <Link to="/plants/my_plants" className={`nav-link ${isMyPlantsActive ? "calendar-active" : ""}`}>Мои растения</Link>
            <Link to="/" className={`nav-link ${isCalendarActive ? "calendar-active" : ""}`}>Календарь</Link>
            <Link to="/user" className={`nav-link ${isUserActive ? "calendar-active" : ""}`}>Профиль</Link>
          </nav>
          <div className="auth-section">
            {isLoggedIn ? <div className="user-info"><button className="auth-button logout-button" onClick={handleLogoutClick}>Выйти</button></div> : <button className="auth-button login-button" onClick={handleLoginClick}>Войти</button>}
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
                  <p className="registration-date">Зарегистрирован {formatRegistrationDate()}</p>
                </div>
                <div className="user-form">
                  <h2>Редактировать профиль</h2>
                  {error && <div className="error-message" style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
                  {successMessage && <div className="success-message" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{successMessage}</div>}
                  <div className="form-grid">
                    <div className="form-group"><label htmlFor="username">Имя</label><input type="text" id="username" name="username" value={formData.username} onChange={handleFormChange} placeholder="Имя" /></div>
                    <div className="form-group"><label htmlFor="email">Почта</label><input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Почта" /></div>
                    <div className="form-group"><label htmlFor="password">Текущий пароль</label><input type="password" id="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Текущий пароль" autoComplete="current-password" /></div>
                    <div className="form-group"><label htmlFor="newPassword">Новый пароль</label><input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Новый пароль" autoComplete="new-password" /></div>
                  </div>
                  <button className="save-changes-btn" onClick={handleSaveChanges} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? "Сохранение..." : "Сохранить изменения"}</button>
                </div>
                <div className="user-plants">
                  <h2>Мои растения</h2>
                  {plants && plants.length > 0 ? (
                    <>
                      <div style={{ backgroundColor: '#f0f0f0', borderRadius: '16px', padding: '16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
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
              <div className="not-logged-in">
                <h2>Зарегистрируйся,<br />чтобы знать больше<br />о своих растениях!</h2>
                <div className="buttonContainerStyle">
                  <button type="submit" className="registration-buttom" style={{ margin: "0 auto" }}><Link to="/auth/signup" className="LinkSelectR">Зарегистрироваться</Link></button>
                </div>
                <div style={{ margin: "1vh" }}><span style={{ fontSize: "1.7vh" }} className="login-link">Есть аккаунт? <Link to="/auth/signin" className="LinkSelect">Войти</Link></span></div>
              </div>
            )}
          </div>
          <div className="user-image-section"><img src="/back-img.svg" alt="Девушка поливает цветок в горшке" className="user-background-image" /></div>
        </section>
      </main>
      {modalOpen && selectedPlant && (
        <div className="modal-overlay" onClick={closePlantModal}>
          <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: "flex", gap: "33px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: '220px', height: '220px', backgroundColor: '#F5F5F5', borderRadius: '20px', overflow: 'hidden', flexShrink: 0 }}>
                <PlantImage src={selectedPlant.plant.photo} alt={selectedPlant.plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h1 style={{ fontSize: "36px", fontWeight: "500", color: "#2E2E2E", margin: "0 0 12px 0", wordBreak: "break-word" }}>{selectedPlant.plant.name}</h1>
                <p style={{ fontSize: "18px", color: "#666", margin: "0 0 16px 0", fontWeight: "450" }}>Комната: {selectedRoomName}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "500" }}>Цвет фона:</label>
                  <input type="color" value={selectedPlant.color || "#FFFFFF"} onChange={(e) => handleUpdateColor(selectedPlant.id, e.target.value)} style={{ width: "50px", height: "50px", border: "2px solid #ddd", borderRadius: "8px", cursor: "pointer" }} />
                </div>
              </div>
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "500", color: "#2E2E2E", margin: "40px 0 20px 0" }}>Уход за растением</h1>
            <div>
              <div style={{ width: "100%", display: "flex", alignItems: "flex-start", marginBottom: "20px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "12px", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><img style={{ width: "32px", height: "32px" }} src="/plant_light.svg" alt="" /></div>
                <div style={{ marginLeft: "14px", flex: 1 }}><p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0" }}>Описание</p><p style={{ fontSize: "20px", margin: 0, lineHeight: "1.5" }}>{selectedPlant.plant.description}</p></div>
              </div>
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
              <div style={{ width: "100%", display: "flex", alignItems: "flex-start", marginBottom: "20px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "12px", padding: "16px" }}>
                <div style={{ width: "52px", height: "52px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><img style={{ width: "32px", height: "32px" }} src="/plant_light.svg" alt="" /></div>
                <div style={{ marginLeft: "14px", flex: 1 }}><p style={{ fontSize: "24px", fontWeight: "450", margin: "0 0 8px 0" }}>Сезон</p><p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5" }}>{selectedPlant.plant.season}</p></div>
              </div>
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: "500", color: "#2E2E2E", margin: "40px 0 20px 0" }}>Мои заметки</h1>
            <div style={{ marginBottom: "20px" }}>
              {commentsLoading ? <p style={{ color: "#999", fontSize: "16px" }}>Загрузка заметок...</p> : comments.length === 0 ? <p style={{ color: "#999", fontSize: "16px" }}>Заметок пока нет. Добавьте первую!</p> : comments.map(comment => (
                <div key={comment.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px", backgroundColor: selectedPlant.color || "#F5F8F2", borderRadius: "12px", padding: "12px 16px" }}>
                  <div style={{ width: "52px", height: "52px", backgroundColor: selectedPlant.color || "#A8C686", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><img style={{ width: "32px", height: "32px" }} src="/plant_light.svg" alt="" /></div>
                  <div style={{ flex: 1 }}><p style={{ fontSize: "18px", margin: 0, lineHeight: "1.5", wordBreak: "break-word" }}>{comment.text}</p></div>
                  <button onClick={() => handleDeleteComment(comment.id)} title="Удалить заметку" style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "20px", flexShrink: 0, paddingTop: "14px", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#DF7171")} onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}>×</button>
                </div>
              ))}
              <hr style={{ width: "100%", margin: "20px 0", opacity: "50%", borderColor: "#A8C686" }} />
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <textarea value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="Добавить заметку..." rows={2} style={{ flex: 1, resize: "vertical", padding: "10px 14px", borderRadius: "12px", border: "1px solid #ddd", fontSize: "16px", fontFamily: "inherit", outline: "none", backgroundColor: "#FFFFFF" }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
                <button onClick={handleAddComment} disabled={commentSubmitting || !newCommentText.trim()} style={{ backgroundColor: newCommentText.trim() ? "#A8C686" : "#ddd", color: "white", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "16px", cursor: newCommentText.trim() ? "pointer" : "default", height: "48px", width: "20%", flexShrink: 0, transition: "background-color 0.2s" }}>{commentSubmitting ? "..." : "Добавить"}</button>
              </div>
            </div>
            <footer className="modal_footer" style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button style={{ backgroundColor: "#DF7171", color: "white", width: "252px", height: "48px", fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#c55a5a"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#DF7171"} onClick={() => handleDeleteUserPlant(selectedPlant.id)}>Удалить растение</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default User;