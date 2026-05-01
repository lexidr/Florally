import React, { useState, useEffect, useRef } from "react";
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
  color: string;
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
  const [isTaskInfoModalOpen, setIsTaskInfoModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [newTask, setNewTask] = useState({
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

  const colorsEnrichedRef = useRef(false);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeTaskDate = (task: Task): Task => {
    if (task.date && task.date.includes('T')) {
      const localDate = new Date(task.date);
      if (!isNaN(localDate.getTime())) {
        return { ...task, date: formatLocalDate(localDate) };
      }
    }
    return task;
  };

  const getPlantColorFromDB = (plantId: string): string => {
    const userPlant = userPlants.find(p => p.id === plantId);
    if (userPlant && userPlant.color && userPlant.color !== "#FFFFFF") {
      return userPlant.color;
    }
    return "#A8C686";
  };

  const getUniquePlantIdsForDate = (date: Date): string[] => {
    const dateStr = formatLocalDate(date);
    const tasksForDate = tasks.filter(task => task.date === dateStr && !task.completed);
    const plantIds = new Set<string>();
    tasksForDate.forEach(task => {
      task.plantIds.forEach(pid => plantIds.add(pid));
    });
    return Array.from(plantIds);
  };

  const loadUserData = async () => {
    if (!isLoggedIn) return;
    try {
      const [plants, roomsData] = await Promise.all([getUserPlants(), getUserRooms()]);
      setRooms(roomsData || []);
      const plantsWithRooms = (plants as UserPlant[]).map(plant => ({
        ...plant,
        room: plant.room || (plant.room_id ? roomsData.find(r => r.id === plant.room_id) : undefined)
      }));
      setUserPlants(plantsWithRooms);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  };

  const enrichTasksWithColors = (plants: UserPlant[]) => {
    const savedTasks = localStorage.getItem("user_tasks");
    if (!savedTasks) return false;
    let parsed = JSON.parse(savedTasks);
    let needUpdate = false;
    const enriched = parsed.map((task: any) => {
      if (!task.color && task.plantIds && task.plantIds.length > 0) {
        needUpdate = true;
        const plant = plants.find(p => p.id === task.plantIds[0]);
        const color = plant && plant.color && plant.color !== "#FFFFFF" ? plant.color : "#A8C686";
        return { ...task, color };
      }
      return task;
    });
    if (needUpdate) {
      localStorage.setItem("user_tasks", JSON.stringify(enriched));
      setTasks(enriched.map(normalizeTaskDate));
      return true;
    }
    return false;
  };

  const loadTasks = () => {
    const savedTasks = localStorage.getItem("user_tasks");
    if (savedTasks) {
      let parsed = JSON.parse(savedTasks);
      if (Array.isArray(parsed)) {
        parsed = parsed.map(normalizeTaskDate);
        setTasks(parsed);
      }
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

  useEffect(() => {
    if (userPlants.length > 0 && !colorsEnrichedRef.current) {
      const enriched = enrichTasksWithColors(userPlants);
      if (enriched) colorsEnrichedRef.current = true;
    }
  }, [userPlants]);

  const getDaysInMonth = (date: Date): CalendarDay[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    for (let i = 0; i < startDayOfWeek; i++) currentWeek.push("");
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        days.push([...currentWeek]);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push("");
      days.push(currentWeek);
    }
    return days;
  };

  const getMonthName = (date: Date): string => {
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    return months[date.getMonth()];
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: CalendarDay): boolean => {
    const today = new Date();
    return day !== "" && day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: CalendarDay): boolean => {
    return day !== "" && day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handleDayClick = (day: CalendarDay): void => {
    if (day !== "") {
      const dayNum = typeof day === "string" ? parseInt(day, 10) : day;
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum));
    }
  };

  const handleLoginClick = () => navigate("/auth/signin");
  
  const handleLogoutClick = async () => {
    try {
      if (!window.confirm("Вы уверены, что хотите выйти?")) return;
      await SignOut();
      setIsLoggedIn(false);
      setUser(null);
      if (location.pathname === "/user") navigate("/");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = formatLocalDate(date);
    const tasksForDate = tasks.filter(task => task.date === dateStr);
    return [...tasksForDate.filter(t => !t.completed), ...tasksForDate.filter(t => t.completed)];
  };

  const toggleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task);
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить задачу?")) {
      saveTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const getPlantNamesByIds = (plantIds: string[]): string => {
    if (!userPlants.length) return "Загрузка...";
    const names = plantIds.map(id => {
      const plant = userPlants.find(p => p.id === id);
      return plant?.plant.name || `Растение (ID: ${id})`;
    });
    return names.join(", ");
  };

  const getUniqueRoomsByPlantIds = (plantIds: string[]): string => {
    const roomNames = new Set<string>();
    plantIds.forEach(id => {
      const plant = userPlants.find(p => p.id === id);
      if (plant?.room?.name) {
        roomNames.add(plant.room.name);
      } else {
        roomNames.add("Без комнаты");
      }
    });
    return Array.from(roomNames).join(", ");
  };

  const openTaskModal = async () => {
    await loadUserData();
    setNewTask({
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

  const openTaskInfoModal = async (task: Task) => {
    await loadUserData();
    setSelectedTask(task);
    setIsTaskInfoModalOpen(true);
  };

  const closeTaskInfoModal = () => {
    setIsTaskInfoModalOpen(false);
    setSelectedTask(null);
  };

  const handleToggleCompleteAndClose = () => {
    if (selectedTask) {
      toggleTaskComplete(selectedTask.id);
      closeTaskInfoModal();
    }
  };

  const handleDeleteTaskAndClose = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      closeTaskInfoModal();
    }
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
    const filtered = getFilteredPlants();
    if (newTask.selectAll) {
      setNewTask(prev => ({ ...prev, selectAll: false, plantIds: [] }));
    } else {
      setNewTask(prev => ({ ...prev, selectAll: true, plantIds: filtered.map(p => p.id) }));
    }
  };

  const handlePlantToggle = (plantId: string) => {
    if (newTask.plantIds.includes(plantId)) {
      setNewTask(prev => ({ ...prev, plantIds: prev.plantIds.filter(id => id !== plantId), selectAll: false }));
    } else {
      setNewTask(prev => ({ ...prev, plantIds: [...prev.plantIds, plantId], selectAll: false }));
    }
  };

  const getFilteredPlants = () => {
    let filtered = userPlants;
    if (selectedRoomFilter !== "all") {
      filtered = filtered.filter(plant => plant.room?.id === selectedRoomFilter);
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(plant =>
        plant.plant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const handleAddTask = async () => {
    const finalType = newTask.type === "Другое" ? newTask.customType : newTask.type;
    if (!finalType) {
      alert("Выберите тип задачи");
      return;
    }
    if (newTask.plantIds.length === 0) {
      alert("Выберите хотя бы одно растение");
      return;
    }

    const plantNames = getPlantNamesByIds(newTask.plantIds);
    const autoTitle = `${finalType} ${plantNames}`;

    let taskColor = "#A8C686";
    if (newTask.plantIds.length > 0) {
      const mainPlant = userPlants.find(p => p.id === newTask.plantIds[0]);
      if (mainPlant && mainPlant.color && mainPlant.color !== "#FFFFFF") {
        taskColor = mainPlant.color;
      }
    }

    setIsSubmitting(true);
    const newTaskObj: Task = {
      id: Date.now().toString(),
      title: autoTitle,
      type: finalType,
      plantIds: newTask.plantIds,
      date: formatLocalDate(selectedDate),
      completed: false,
      color: taskColor,
    };
    saveTasks([...tasks, newTaskObj]);
    setIsSubmitting(false);
    closeTaskModal();
  };

  useEffect(() => {
    setCalendarDays(getDaysInMonth(currentDate));
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear().toString());
  }, [currentDate]);

  useEffect(() => {
    setCalendarDays(getDaysInMonth(currentDate));
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
            <Link to="/"><img src="/logo.svg" alt="Florally" className="logo" /></Link>
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
            <Link to="/"><img src="/logo.svg" alt="Florally" className="mobile-logo" /></Link>
          </div>
        </header>
        <main className="mobile-main-content">
          <div className="mobile-content-wrapper">
            <div className="mobile-form-container full-height">
              {!isLoggedIn ? (
                <>
                  <h2 className="mobile-title">
                    Зарегистрируйся,<br />чтобы знать больше<br />о своих растениях!
                  </h2>
                  <div className="mobile-button-container">
                    <Link to="/auth/signup" className="mobile-registration-link">
                      <button className="mobile-registration-button">Зарегистрироваться</button>
                    </Link>
                  </div>
                  <div className="mobile-login-container">
                    <span className="mobile-login-text">
                      Есть аккаунт? <Link to="/auth/signin" className="mobile-login-link">Войти</Link>
                    </span>
                  </div>
                </>
              ) : (
                <div className="mobile-calendar-wrapper">
                  <h2 className="mobile-calendar-title">Календарь</h2>
                  <div className="mobile-calendar-container">
                    <div className="mobile-calendar-nav">
                      <button className="mobile-calendar-nav-button" onClick={() => prevMonth()}>&lt;</button>
                      <h3 className="mobile-calendar-month">{currentMonth} {currentYear}</h3>
                      <button className="mobile-calendar-nav-button" onClick={() => nextMonth()}>&gt;</button>
                    </div>
                    <div className="mobile-calendar">
                      <ul className="mobile-weekdays"><li>Пн</li><li>Вт</li><li>Ср</li><li>Чт</li><li>Пт</li><li>Сб</li><li>Вс</li></ul>
                      <div className="mobile-calendar-days">
                        {calendarDays.map((week, weekIndex) => (
                          <div key={weekIndex} className="mobile-week">
                            {week.map((day, dayIndex) => {
                              const today = isToday(day);
                              const selected = isSelected(day);
                              const dayNum = typeof day === "string" ? (day ? parseInt(day, 10) : null) : day;
                              const plantIdsForDay = dayNum !== null && day !== ""
                                ? getUniquePlantIdsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))
                                : [];
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
                                  {day !== "" && <span className="mobile-day-number">{day}</span>}
                                  {plantIdsForDay.length > 0 && (
                                    <div className="mobile-task-indicators">
                                      {plantIdsForDay.slice(0, 3).map(pid => (
                                        <span
                                          key={pid}
                                          className="mobile-task-color-dot"
                                          style={{ backgroundColor: getPlantColorFromDB(pid) }}
                                        />
                                      ))}
                                      {plantIdsForDay.length > 3 && (
                                        <span className="mobile-task-color-dot more">+{plantIdsForDay.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginTop: '20px' }}>
                    <h2 className="mobile-tasks-title">
                      Задачи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </h2>
                    {todayTasks.length > 0 && (
                      <button
                        className="add-task-button"
                        onClick={() => { openTaskModal(); }}
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
                      >+</button>
                    )}
                  </div>
                  <div className="mobile-tasks-container">
                    <div className="mobile-tasks-list">
                      {todayTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', width: '100%' }}>
                          <p style={{ marginBottom: '16px', fontSize: '16px' }}>Пока нет задач</p>
                          <button onClick={() => { openTaskModal(); }} style={{ backgroundColor: '#A8C686', border: 'none', borderRadius: '24px', padding: '10px 20px', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer',width: "40%" }}>Добавить задачу</button>
                        </div>
                      ) : (
                        todayTasks.map(task => {
                          const taskColor = task.color || getPlantColorFromDB(task.plantIds[0] || "");
                          return (
                            <div 
                              key={task.id} 
                              className={`mobile-task-item ${task.completed ? 'completed-task' : ''}`} 
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: task.completed ? '#f0f0f0' : 'white',
                                borderRadius: '8px',
                                marginBottom: '8px'
                              }} 
                              onClick={() => openTaskInfoModal(task)}
                            >
                              <div
                                className="mobile-task-checkbox"
                                onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  border: `2px solid ${taskColor}`,
                                  cursor: 'pointer',
                                  backgroundColor: task.completed ? taskColor : 'transparent'
                                }}
                              />
                              <div className="mobile-task-content" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <p className="mobile-task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', margin: 0 }}>{task.title}</p>
                              </div>
                            </div>
                          );
                        })
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
            <img src="/ph_plant-dark.svg" alt="Мои растения" className={`mobile-menu-icon ${isMyPlantsActive ? "active-icon" : ""}`} />
          </Link>
          <Link to="/" className="mobile-menu-item">
            <img src="/proicons_calendar.svg" alt="Календарь" className={`mobile-menu-icon ${isCalendarActive ? "active-icon" : ""}`} />
          </Link>
          <Link to="/user" className="mobile-menu-item">
            <img src="/ion_person-outline.svg" alt="Профиль" className={`mobile-menu-icon ${isUserActive ? "active-icon" : ""}`} />
          </Link>
        </div>

        {isTaskModalOpen && (
          <div className="modal-overlay" onClick={() => closeTaskModal()}>
            <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', position: 'relative', backgroundColor: 'white', borderRadius: '20px', minHeight: '0' }}>
              <button onClick={() => closeTaskModal()} style={{ position: 'absolute', top: '12px', right: '12px', background: '#FFFFFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '20px', cursor: 'pointer', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
              <h2 style={{ marginBottom: '20px', fontSize: '24px'  }}>Новая задача</h2>
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  <label style={{ minWidth: '80px', fontWeight: '500',margin:'6px' }}>Тип задачи</label>
                  <div onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{newTask.type === "Другое" ? newTask.customType || "Другое" : newTask.type || "Выберите тип"}</span><span>▼</span>
                  </div>
                </div>
                {isTypeDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                    {taskTypes.map(type => <div key={type} onClick={() => handleTypeSelect(type)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>{type}</div>)}
                  </div>
                )}
                {newTask.type === "Другое" && (
                  <input type="text" value={newTask.customType} onChange={e => setNewTask(prev => ({ ...prev, customType: e.target.value }))} placeholder="Введите свой тип задачи" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px', fontSize: '16px' }} />
                )}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500',margin:'6px' }}>Выбрать растения</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск растений..." style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }} />
                  <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ width: '80px', height: '36px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',color:'#2d3436' }}>Фильтр</button>
                </div>
                {isFilterOpen && (
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Фильтр по комнате</label>
                    <select value={selectedRoomFilter} onChange={e => setSelectedRoomFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <option value="all">Все комнаты</option>
                      {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newTask.selectAll} onChange={() => handleSelectAllPlants()} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span>Выбрать все</span>
                  </label>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '8px' }}>
                  {getFilteredPlants().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Нет растений для отображения</div>
                  ) : (
                    getFilteredPlants().map(plant => (
                      <label key={plant.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                        <input type="checkbox" checked={newTask.plantIds.includes(plant.id)} onChange={() => handlePlantToggle(plant.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <div style={{ width: '30px', height: '30px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                          <img src={plant.plant.photo || `/plug-image-plant1.png`} alt={plant.plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div><div style={{ fontWeight: '500' }}>{plant.plant.name}</div><div style={{ fontSize: '12px', color: '#666' }}>Комната: {plant.room?.name || "Без комнаты"}</div></div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <footer style={{ marginTop: '20px' }}>
                <button onClick={() => { handleAddTask(); }} disabled={isSubmitting} style={{ backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '12px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'default' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>{isSubmitting ? "Добавление..." : "Добавить задачу"}</button>
              </footer>
            </section>
          </div>
        )}

        {isTaskInfoModalOpen && selectedTask && (
          <div className="modal-overlay" onClick={() => closeTaskInfoModal()}>
            <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', position: 'relative', backgroundColor: 'white', borderRadius: '20px', minHeight: '0' }}>
              <button onClick={() => closeTaskInfoModal()} style={{ position: 'absolute', top: '12px', right: '12px', background: '#FFFFFF', border: '1px solid #ddd', borderRadius: '50%', width: '32px', height: '32px', fontSize: '20px', cursor: 'pointer', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
              <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Детали задачи</h2>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>{selectedTask.title}</p>
                <p><strong>Дата:</strong> {new Date(selectedTask.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Тип:</strong> {selectedTask.type}</p>
                <p><strong>Растения:</strong> {getPlantNamesByIds(selectedTask.plantIds)}</p>
                <p><strong>Комнаты:</strong> {getUniqueRoomsByPlantIds(selectedTask.plantIds)}</p>
                <p><strong>Статус:</strong> {selectedTask.completed ? "Выполнена" : "Не выполнена"}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                {!selectedTask.completed && (
                  <button onClick={() => handleToggleCompleteAndClose()} style={{ flex: 1, backgroundColor: '#A8C686', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Отметить выполненной</button>
                )}
                <button onClick={() => handleDeleteTaskAndClose()} style={{ flex: 1, backgroundColor: '#DF7171', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Удалить задачу</button>
              </div>
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
            <Link to="/plants/my_plants" className={`nav-link ${isMyPlantsActive ? "calendar-active" : ""}`}>Мои растения</Link>
            <Link to="/" className={`nav-link ${isCalendarActive ? "calendar-active" : ""}`}>Календарь</Link>
            <Link to="/user" className={`nav-link ${isUserActive ? "calendar-active" : ""}`}>Профиль</Link>
          </nav>
          <div className="auth-section">
            {isLoggedIn ? (
              <button className="auth-section-button logout-button" onClick={() => { handleLogoutClick(); }}>Выйти</button>
            ) : (
              <button className="auth-section-button login-button" onClick={() => handleLoginClick()}>Войти</button>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        <section className="info-card" style={{ position: 'relative' }}>
          <h2 className="card-title">Задачи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</h2>
          {!isLoggedIn && (
            <div className="not-authorized-container">
              <div className="not-authorized-message"><p>Зарегистрируйся,<br />чтобы знать больше<br />о своих растениях!</p></div>
              <div className="registration-form-section">
                <div style={{ margin: "1.2vh 0" }}><button className="registration-button" style={{ width: "100%", margin: "0 auto" }} onClick={() => navigate("/auth/signup")}>Зарегистрироваться</button></div>
                <div style={{ margin: "1vh 0", textAlign: "center" }}><span style={{ fontSize: "1.7vh" }} className="login-link">Есть аккаунт? <Link to="/auth/signin" style={{ color: "#74885d", textDecoration: "none" }}>Войти</Link></span></div>
              </div>
            </div>
          )}
          {isLoggedIn && (
            <>
              <div className="tasks-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {todayTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', width: '100%' }}>
                    <p style={{ marginBottom: '16px', fontSize: '16px' }}>Пока нет задач</p>
                    <button onClick={() => { openTaskModal(); }} style={{ backgroundColor: '#A8C686', border: 'none', borderRadius: '24px', padding: '10px 20px', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer', width:'40%' }}>Добавить задачу</button>
                  </div>
                ) : (
                  todayTasks.map(task => {
                    const taskColor = task.color || getPlantColorFromDB(task.plantIds[0] || "");
                    return (
                      <div 
                        key={task.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '12px', 
                          borderBottom: '1px solid #eee', 
                          cursor: 'pointer',
                          backgroundColor: task.completed ? '#f5f5f5' : 'white',
                          borderRadius: '8px',
                          marginBottom: '4px'
                        }} 
                        onClick={() => openTaskInfoModal(task)}
                      >
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `2px solid ${taskColor}`,
                            cursor: 'pointer',
                            backgroundColor: task.completed ? taskColor : 'transparent'
                          }}
                        />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ margin: 0, fontSize: '16px', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {todayTasks.length > 0 && (
                <button
                  className="add-task-button"
                  onClick={() => { openTaskModal(); }}
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
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >+</button>
              )}
            </>
          )}
        </section>
        <div className="calendar-with-plants">
          <section className="calendar-container">
            <div className="calendar-header">
              <nav className="calendar-nav">
                <button className="calendar-nav-button" onClick={() => prevMonth()}>&lt;</button>
                <h2 className="calendar-title">{currentMonth} {currentYear}</h2>
                <button className="calendar-nav-button" onClick={() => nextMonth()}>&gt;</button>
              </nav>
            </div>
            <div className="calendar">
              <ul className="weekdays">
                <li className="weekday">Пн</li><li className="weekday">Вт</li><li className="weekday">Ср</li><li className="weekday">Чт</li><li className="weekday">Пт</li><li className="weekday">Сб</li><li className="weekday">Вс</li>
              </ul>
              <div className="calendar-days">
                {calendarDays.map((week, weekIndex) => (
                  <div key={weekIndex} className="week">
                    {week.map((day, dayIndex) => {
                      const today = isToday(day);
                      const selected = isSelected(day);
                      const dayNum = typeof day === "string" ? (day ? parseInt(day, 10) : null) : day;
                      const plantIdsForDay = dayNum !== null && day !== ""
                        ? getUniquePlantIdsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))
                        : [];
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`calendar-day ${
                            day === "" ? "empty" : ""
                          } ${today ? "today" : ""} ${selected ? "selected" : ""}`}
                          onClick={() => handleDayClick(day)}
                        >
                          {day !== "" && (
                            <>
                              <span className="day-number">{day}</span>
                              {plantIdsForDay.length > 0 && (
                                <div className="task-indicators">
                                  {plantIdsForDay.slice(0, 3).map(pid => (
                                    <span
                                      key={pid}
                                      className="task-color-dot"
                                      style={{ backgroundColor: getPlantColorFromDB(pid) }}
                                    />
                                  ))}
                                  {plantIdsForDay.length > 3 && (
                                    <span className="task-color-dot more">+{plantIdsForDay.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </>
                          )}
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
        <div className="modal-overlay" onClick={() => closeTaskModal()}>
          <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', position: 'relative', backgroundColor: 'white', borderRadius: '20px', minHeight: '0' }}>
            <button onClick={() => closeTaskModal()} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FFFFFF', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '22px', cursor: 'pointer', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
            <h2 style={{ marginBottom: '24px', fontSize: '28px' }}>Новая задача</h2>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ width: '100px', fontWeight: '500',margin:'6px'  }}>Тип задачи</label>
                <div onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38.4px' }}>
                  <span>{newTask.type === "Другое" ? newTask.customType || "Другое" : newTask.type || "Выберите тип"}</span><span>▼</span>
                </div>
              </div>
              {isTypeDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: '112px', right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                  {taskTypes.map(type => <div key={type} onClick={() => handleTypeSelect(type)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>{type}</div>)}
                </div>
              )}
              {newTask.type === "Другое" && (
                <input type="text" value={newTask.customType} onChange={e => setNewTask(prev => ({ ...prev, customType: e.target.value }))} placeholder="Введите свой тип задачи" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '8px', fontSize: '16px' }} />
              )}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500',margin:'6px'  }}>Выбрать растения</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск растений..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }} />
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ width: '80px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color:'#2d3436' }}>Фильтр</button>
              </div>
              {isFilterOpen && (
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Фильтр по комнате</label>
                  <select value={selectedRoomFilter} onChange={e => setSelectedRoomFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <option value="all">Все комнаты</option>
                    {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newTask.selectAll} onChange={() => handleSelectAllPlants()} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span>Выбрать все</span>
                </label>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '8px' }}>
                {getFilteredPlants().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Нет растений для отображения</div>
                ) : (
                  getFilteredPlants().map(plant => (
                    <label key={plant.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                      <input type="checkbox" checked={newTask.plantIds.includes(plant.id)} onChange={() => handlePlantToggle(plant.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={plant.plant.photo || `/plug-image-plant1.png`} alt={plant.plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div><div style={{ fontWeight: '500' }}>{plant.plant.name}</div><div style={{ fontSize: '12px', color: '#666' }}>Комната: {plant.room?.name || "Без комнаты"}</div></div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <footer style={{ marginTop: '24px' }}>
              <button onClick={() => { handleAddTask(); }} disabled={isSubmitting} style={{ backgroundColor: '#A8C686', color: 'white', width: '100%', padding: '14px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'default' : 'pointer', opacity: isSubmitting ? 0.7 : 1, fontWeight: '500' }}>{isSubmitting ? "Добавление..." : "Добавить задачу"}</button>
            </footer>
          </section>
        </div>
      )}

      {isTaskInfoModalOpen && selectedTask && (
        <div className="modal-overlay" onClick={() => closeTaskInfoModal()}>
          <section className="modal-contentMP" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', position: 'relative', backgroundColor: 'white', borderRadius: '20px', minHeight: '0' }}>
            <button onClick={() => closeTaskInfoModal()} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FFFFFF', border: '1px solid #ddd', borderRadius: '50%', width: '36px', height: '36px', fontSize: '22px', cursor: 'pointer', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
            <h2 style={{ marginBottom: '24px', fontSize: '28px' }}>Детали задачи</h2>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>{selectedTask.title}</p>
              <p><strong>Дата:</strong> {new Date(selectedTask.date).toLocaleDateString('ru-RU')}</p>
              <p><strong>Тип:</strong> {selectedTask.type}</p>
              <p><strong>Растения:</strong> {getPlantNamesByIds(selectedTask.plantIds)}</p>
              <p><strong>Комнаты:</strong> {getUniqueRoomsByPlantIds(selectedTask.plantIds)}</p>
              <p><strong>Статус:</strong> {selectedTask.completed ? "Выполнена" : "Не выполнена"}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {!selectedTask.completed && (
                <button onClick={() => handleToggleCompleteAndClose()} style={{ flex: 1, backgroundColor: '#A8C686', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Отметить выполненной</button>
              )}
              <button onClick={() => handleDeleteTaskAndClose()} style={{ flex: 1, backgroundColor: '#DF7171', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Удалить задачу</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HomePage;