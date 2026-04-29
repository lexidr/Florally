import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import { getUserPlants, type UserPlant } from "../../api/plantsApi";
import { getUserRooms, type Room } from "../../api/roomsApi";
import "./HomePage.css";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthData {
  isAuthenticated: boolean;
  user: User | null;
}

type CalendarDay = number | string;

interface Task {
  id: string;
  title: string;
  type: string;
  plantIds: string[];
  date: string;
  completed: boolean;
}

const HomePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[][]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [screenSize, setScreenSize] = useState<"desktop" | "mobile">("desktop");

  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    type: "",
    customType: "",
    plantIds: [] as string[],
    selectAll: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const taskTypes = ["Полив", "Пересадка", "Прополка", "Собрать урожай", "Другое"];

  const location = useLocation();
  const navigate = useNavigate();

  const loadUserData = async () => {
    if (!isLoggedIn) return;
    try {
      const plants = await getUserPlants();
      setUserPlants(plants as UserPlant[]);
      const roomsData = await getUserRooms();
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  };

  const loadTasks = () => {
    const savedTasks = localStorage.getItem("user_tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  };

  const saveTasks = (updatedTasks: Task[]) => {
    localStorage.setItem("user_tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  useEffect(() => {
    const checkScreenSize = (): void => {
      const width = window.innerWidth;
      setScreenSize(width <= 810 ? "mobile" : "desktop");
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const authCheck = async (): Promise<void> => {
      try {
        const authData: AuthData = checkAuth();
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);

        if (authData.isAuthenticated) {
          await loadUserData();
          loadTasks();
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

  const getDaysInMonth = (date: Date): CalendarDay[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push("");
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        days.push([...currentWeek]);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push("");
      }
      days.push(currentWeek);
    }

    return days;
  };

  const getMonthName = (date: Date): string => {
    const months = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
    ];
    return months[date.getMonth()];
  };

  const prevMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: CalendarDay): boolean => {
    const today = new Date();
    return (
      day !== "" &&
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: CalendarDay): boolean => {
    return (
      day !== "" &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayClick = (day: CalendarDay): void => {
    if (day !== "") {
      const dayNum = typeof day === "string" ? parseInt(day, 10) : day;
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum));
    }
  };

  const handleLoginClick = (): void => {
    navigate("/auth/signin");
  };

  const handleLogoutClick = async (): Promise<void> => {
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
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.date === dateStr && !task.completed);
  };

  const toggleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const openTaskModal = () => {
    setNewTask({
      title: "",
      type: "",
      customType: "",
      plantIds: [],
      selectAll: false,
    });
    setSearchQuery("");
    setSelectedRoomFilter("all");
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setIsTypeDropdownOpen(false);
    setIsFilterOpen(false);
  };

  const handleTypeSelect = (type: string) => {
    if (type === "Другое") {
      setNewTask(prev => ({ ...prev, type: "Другое", customType: "" }));
    } else {
      setNewTask(prev => ({ ...prev, type, customType: "" }));
    }
    setIsTypeDropdownOpen(false);
  };

  const handleSelectAllPlants = () => {
    const filteredPlants = getFilteredPlants();
    if (newTask.selectAll) {
      setNewTask(prev => ({ ...prev, selectAll: false, plantIds: [] }));
    } else {
      setNewTask(prev => ({
        ...prev,
        selectAll: true,
        plantIds: filteredPlants.map(p => p.id)
      }));
    }
  };

  const handlePlantToggle = (plantId: string) => {
    if (newTask.plantIds.includes(plantId)) {
      setNewTask(prev => ({
        ...prev,
        plantIds: prev.plantIds.filter(id => id !== plantId),
        selectAll: false
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        plantIds: [...prev.plantIds, plantId],
        selectAll: false
      }));
    }
  };

  const getFilteredPlants = () => {
    let filtered = userPlants;
    
    if (selectedRoomFilter !== "all") {
      filtered = filtered.filter(plant => plant.room?.id === selectedRoomFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(plant =>
        plant.plant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleAddTask = async () => {
    const finalType = newTask.type === "Другое" ? newTask.customType : newTask.type;
    
    if (!newTask.title.trim()) {
      alert("Введите название задачи");
      return;
    }
    if (!finalType) {
      alert("Выберите тип задачи");
      return;
    }
    if (newTask.plantIds.length === 0) {
      alert("Выберите хотя бы одно растение");
      return;
    }

    setIsSubmitting(true);

    const newTaskObj: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      type: finalType,
      plantIds: newTask.plantIds,
      date: selectedDate.toISOString().split('T')[0],
      completed: false,
    };

    saveTasks([...tasks, newTaskObj]);
    setIsSubmitting(false);
    closeTaskModal();
  };

  useEffect(() => {
    const days = getDaysInMonth(currentDate);
    setCalendarDays(days);
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear().toString());
  }, [currentDate]);

  useEffect(() => {
    const days = getDaysInMonth(currentDate);
    setCalendarDays(days);
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear().toString());
    setSelectedDate(new Date());
  }, []);

  const isCalendarActive = location.pathname === "/";
  const isMyPlantsActive = location.pathname === "/plants/my_plants";
  const isUserActive = location.pathname === "/user";

  const todayTasks = getTasksForDate(selectedDate);

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <Link to="/"><img src={"/logo.svg"} alt="Florally" className="logo" /></Link>
            <div className="loading-auth">Загрузка...</div>
          </div>
        </header>
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Проверка аутентификации...</p>
          </div>
        </main>
      </div>
    );
  }

  if (screenSize === "mobile") {
    return (
      <div className="mobile-app">
        <header className="mobile-header">
          <div className="mobile-header-content">
            <Link to="/"> <img src="/logo.svg" alt="Florally" className="mobile-logo" /> </Link>
          </div>
        </header>

        <main className="mobile-main-content">
          <div className="mobile-content-wrapper">
            <div className="mobile-form-container full-height">
              {!isLoggedIn ? (
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
              ) : (
                <div className="mobile-calendar-wrapper">
                  <h2 className="mobile-calendar-title">Календарь</h2>

                  <div className="mobile-calendar-container">
                    <div className="mobile-calendar-nav">
                      <button className="mobile-calendar-nav-button" onClick={prevMonth}>
                        &lt;
                      </button>
                      <h3 className="mobile-calendar-month">
                        {currentMonth} {currentYear}
                      </h3>
                      <button className="mobile-calendar-nav-button" onClick={nextMonth}>
                        &gt;
                      </button>
                    </div>

                    <div className="mobile-calendar">
                      <ul className="mobile-weekdays">
                        <li>Пн</li>
                        <li>Вт</li>
                        <li>Ср</li>
                        <li>Чт</li>
                        <li>Пт</li>
                        <li>Сб</li>
                        <li>Вс</li>
                      </ul>
                      <div className="mobile-calendar-days">
                        {calendarDays.map((week, weekIndex) => (
                          <div key={weekIndex} className="mobile-week">
                            {week.map((day, dayIndex) => {
                              const today = isToday(day);
                              const selected = isSelected(day);

                              return (
                                <div
                                  key={`${weekIndex}-${dayIndex}`}
                                  className={`mobile-calendar-day ${
                                    day === "" ? "mobile-empty" : ""
                                  } ${today ? "mobile-today" : ""} ${
                                    selected ? "mobile-selected" : ""
                                  }`}
                                  onClick={() => handleDayClick(day)}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <h2 className="mobile-tasks-title">
                      Задачи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </h2>
                    <button
                      className="add-task-button"
                      onClick={openTaskModal}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '0',
                        width: '40px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#A8C686',
                        border: 'none',
                        fontSize: '24px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div className="mobile-tasks-container">
                    <div className="mobile-tasks-list">
                      {todayTasks.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '20px', 
                          color: '#999',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '550px',
                          width: '100%'
                        }}>
                          Нет задач на этот день
                        </div>
                      ) : (
                        todayTasks.map(task => (
                          <div key={task.id} className="mobile-task-item">
                            <div 
                              className="mobile-task-checkbox"
                              onClick={() => toggleTaskComplete(task.id)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '2px solid #A8C686',
                                cursor: 'pointer',
                                backgroundColor: task.completed ? '#A8C686' : 'transparent'
                              }}
                            />
                            <div className="mobile-task-content" style={{ flex: 1 }}>
                              <p className="mobile-task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                                {task.title}
                              </p>
                              <p className="mobile-task-time" style={{ fontSize: '12px', color: '#666' }}>
                                Тип: {task.type}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#DF7171'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <div className="mobile-bottom-menu">
          <Link to="/plants/my_plants" className="mobile-menu-item">
            <img
              src="/ph_plant-light.svg"
              alt="Мои растения"
              className={`mobile-menu-icon ${isMyPlantsActive ? "active-icon" : ""}`}
            />
          </Link>

          <Link to="/" className="mobile-menu-item">
            <img
              src="/proicons_calendar.svg"
              alt="Календарь"
              className={`mobile-menu-icon ${isCalendarActive ? "active-icon" : ""}`}
            />
          </Link>

          <Link to="/user" className="mobile-menu-item">
            <img
              src="/ion_person-outline.svg"
              alt="Профиль"
              className={`mobile-menu-icon ${isUserActive ? "active-icon" : ""}`}
            />
          </Link>
        </div>

        {isTaskModalOpen && (
          <div className="modal-overlay" onClick={closeTaskModal}>
            <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{
              width: '90%',
              maxWidth: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '20px',
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '20px'
            }}>
              <button
                onClick={closeTaskModal}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #ddd',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                ✕
              </button>

              <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Новая задача</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Задача *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Полить монстеру"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Тип задачи *</label>
                <div
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{newTask.type === "Другое" ? newTask.customType || "Другое" : newTask.type || "Выберите тип"}</span>
                  <span>▼</span>
                </div>
                {isTypeDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    zIndex: 20,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {taskTypes.map(type => (
                      <div
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
                {newTask.type === "Другое" && (
                  <input
                    type="text"
                    value={newTask.customType}
                    onChange={(e) => setNewTask(prev => ({ ...prev, customType: e.target.value }))}
                    placeholder="Введите свой тип задачи"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      marginTop: '8px',
                      fontSize: '16px'
                    }}
                  />
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Выбрать растения *</label>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск растений..."
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🔽
                  </button>
                </div>

                {isFilterOpen && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Фильтр по комнате</label>
                    <select
                      value={selectedRoomFilter}
                      onChange={(e) => setSelectedRoomFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    >
                      <option value="all">Все комнаты</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newTask.selectAll}
                      onChange={handleSelectAllPlants}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Выбрать все</span>
                  </label>
                </div>

                <div style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '8px'
                }}>
                  {getFilteredPlants().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      Нет растений для отображения
                    </div>
                  ) : (
                    getFilteredPlants().map(plant => (
                      <label
                        key={plant.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newTask.plantIds.includes(plant.id)}
                          onChange={() => handlePlantToggle(plant.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={plant.plant.photo || `/plug-image-plant1.png`}
                            alt={plant.plant.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{plant.plant.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Комната: {plant.room?.name || "Без комнаты"}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <footer style={{ marginTop: '20px' }}>
                <button
                  onClick={handleAddTask}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#A8C686',
                    color: 'white',
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSubmitting ? 'default' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? "Добавление..." : "Добавить задачу"}
                </button>
              </footer>
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
              <button className="auth-section-button logout-button" onClick={handleLogoutClick}>
                Выйти
              </button>
            ) : (
              <button className="auth-section-button login-button" onClick={handleLoginClick}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        <section className="info-card" style={{ position: 'relative' }}>
          <h2 className="card-title">Задачи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</h2>
          {!isLoggedIn && (
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
          )}
          {isLoggedIn && (
            <>
              <div className="tasks-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {todayTasks.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '550px',
                    width: '100%',
                  }}>
                    Нет задач на этот день
                  </div>
                ) : (
                  todayTasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid #eee'
                    }}>
                      <div
                        onClick={() => toggleTaskComplete(task.id)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid #A8C686',
                          cursor: 'pointer',
                          backgroundColor: task.completed ? '#A8C686' : 'transparent'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '16px', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Тип: {task.type}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          color: '#DF7171'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                className="add-task-button"
                onClick={openTaskModal}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '48px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#A8C686',
                  border: 'none',
                  fontSize: '28px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                +
              </button>
            </>
          )}
        </section>
        <div className="calendar-with-plants">
          <section className="calendar-container">
            <div className="calendar-header">
              <nav className="calendar-nav">
                <button className="calendar-nav-button" onClick={prevMonth}>
                  &lt;
                </button>
                <h2 className="calendar-title">
                  {currentMonth} {currentYear}
                </h2>
                <button className="calendar-nav-button" onClick={nextMonth}>
                  &gt;
                </button>
              </nav>
            </div>
            <div className="calendar">
              <ul className="weekdays">
                <li className="weekday">Пн</li>
                <li className="weekday">Вт</li>
                <li className="weekday">Ср</li>
                <li className="weekday">Чт</li>
                <li className="weekday">Пт</li>
                <li className="weekday">Сб</li>
                <li className="weekday">Вс</li>
              </ul>
              <div className="calendar-days">
                {calendarDays.map((week, weekIndex) => (
                  <div key={weekIndex} className="week">
                    {week.map((day, dayIndex) => {
                      const today = isToday(day);
                      const selected = isSelected(day);

                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`calendar-day ${
                            day === "" ? "empty" : ""
                          } ${today ? "today" : ""} ${selected ? "selected" : ""}`}
                          onClick={() => handleDayClick(day)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="plants-container-wrapper">
            <div className="plant-image-left"></div>
            <div className="plant-image-right"></div>
          </section>
        </div>
      </main>

      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{
            maxWidth: '600px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '20px'
          }}>
            <button
              onClick={closeTaskModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#FFFFFF',
                border: '1px solid #ddd',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <h2 style={{ marginBottom: '24px', fontSize: '28px' }}>Новая задача</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Задача *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Например: Полить монстеру"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Тип задачи *</label>
              <div
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{newTask.type === "Другое" ? newTask.customType || "Другое" : newTask.type || "Выберите тип"}</span>
                <span>▼</span>
              </div>
              {isTypeDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  zIndex: 20,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {taskTypes.map(type => (
                    <div
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
              {newTask.type === "Другое" && (
                <input
                  type="text"
                  value={newTask.customType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, customType: e.target.value }))}
                  placeholder="Введите свой тип задачи"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    marginTop: '8px',
                    fontSize: '16px'
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Выбрать растения *</label>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск растений..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  🔽 Фильтр
                </button>
              </div>

              {isFilterOpen && (
                <div style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px'
                }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Фильтр по комнате</label>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="all">Все комнаты</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newTask.selectAll}
                    onChange={handleSelectAllPlants}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Выбрать все</span>
                </label>
              </div>

              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '8px'
              }}>
                {getFilteredPlants().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    Нет растений для отображения
                  </div>
                ) : (
                  getFilteredPlants().map(plant => (
                    <label
                      key={plant.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newTask.plantIds.includes(plant.id)}
                        onChange={() => handlePlantToggle(plant.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={plant.plant.photo || `/plug-image-plant1.png`}
                          alt={plant.plant.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{plant.plant.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Комната: {plant.room?.name || "Без комнаты"}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <footer style={{ marginTop: '24px' }}>
              <button
                onClick={handleAddTask}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#A8C686',
                  color: 'white',
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'default' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  fontWeight: '500'
                }}
              >
                {isSubmitting ? "Добавление..." : "Добавить задачу"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default HomePage;