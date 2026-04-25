import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { checkAuth, SignOut } from "../../api/authApi";
import "./HomePage.css";

// Типы для пользователя и ответа аутентификации
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthData {
  isAuthenticated: boolean;
  user: User | null;
}

// Тип для элемента календаря (число или пустая строка)
type CalendarDay = number | string;

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

  const location = useLocation();
  const navigate = useNavigate();

  // Определение размера экрана
  useEffect(() => {
    const checkScreenSize = (): void => {
      const width = window.innerWidth;
      setScreenSize(width <= 810 ? "mobile" : "desktop");
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Проверка аутентификации
  useEffect(() => {
    const authCheck = async (): Promise<void> => {
      try {
        console.log("HomePage: Проверка аутентификации...");
        const authData: AuthData = checkAuth();
        console.log("HomePage: Результат проверки:", authData);

        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);

        if (authData.isAuthenticated) {
          console.log("HomePage: Пользователь авторизован:", authData.user);
        } else {
          console.log("HomePage: Пользователь не авторизован");
        }
      } catch (error) {
        console.error("HomePage: Ошибка при проверке аутентификации:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authCheck();
  }, []);

  // Получение дней месяца с выравниванием по неделям
  const getDaysInMonth = (date: Date): CalendarDay[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Понедельник = 0, Воскресенье = 6
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
    console.log("HomePage: Перенаправление на страницу входа");
    navigate("/auth/signin");
  };

  const handleLogoutClick = async (): Promise<void> => {
    console.log("HomePage: Начало выхода из системы");

    try {
      const confirmLogout = window.confirm("Вы уверены, что хотите выйти?");
      if (!confirmLogout) return;

      console.log("HomePage: Вызываю SignOut API");
      await SignOut();

      setIsLoggedIn(false);
      setUser(null);

      console.log("HomePage: Выход успешно выполнен");

      if (location.pathname === "/user") {
        navigate("/");
      }
    } catch (error) {
      console.error("HomePage: Ошибка при выходе:", error);
    }
  };

  // Обновление календаря при изменении месяца
  useEffect(() => {
    const days = getDaysInMonth(currentDate);
    setCalendarDays(days);
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear().toString());
  }, [currentDate]);

  // Инициализация календаря при монтировании
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

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src="/logo.svg" alt="Florally" className="logo" />
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

  // Мобильная верстка
  if (screenSize === "mobile") {
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

                  <h2 className="mobile-tasks-title">Задачи на день</h2>

                  <div className="mobile-tasks-container">
                    <div className="mobile-tasks-list">
                      <div className="mobile-task-item">
                        <div className="mobile-task-checkbox"></div>
                        <div className="mobile-task-content">
                          <p className="mobile-task-title">Полить цветы</p>
                          <p className="mobile-task-time">Сегодня, 18:00</p>
                        </div>
                      </div>
                      <div className="mobile-task-item">
                        <div className="mobile-task-checkbox"></div>
                        <div className="mobile-task-content">
                          <p className="mobile-task-title">Удобрить растения</p>
                          <p className="mobile-task-time">Завтра, 10:00</p>
                        </div>
                      </div>
                      <div className="mobile-task-item">
                        <div className="mobile-task-checkbox"></div>
                        <div className="mobile-task-content">
                          <p className="mobile-task-title">Опрыскать листья</p>
                          <p className="mobile-task-time">Сегодня, 15:30</p>
                        </div>
                      </div>
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
      </div>
    );
  }

  // Десктопная верстка
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src="/logo.svg" alt="Florally" className="logo" />
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
              <button className="auth-button logout-button" onClick={handleLogoutClick}>
                Выйти
              </button>
            ) : (
              <button className="auth-button login-button" onClick={handleLoginClick}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        <section className="info-card">
          <h2 className="card-title">Задачи на день</h2>
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
    </div>
  );
};

export default HomePage;