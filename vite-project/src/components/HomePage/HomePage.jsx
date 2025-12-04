import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkAuth, SignOut } from "../../api/authApi";
import './HomePage.css';

function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const authCheck = async () => {
      try {
        console.log('HomePage: Проверка аутентификации...');
        const authData = checkAuth();
        console.log('HomePage: Результат проверки:', authData);
        
        setIsLoggedIn(authData.isAuthenticated);
        setUser(authData.user);
        
        if (authData.isAuthenticated) {
          console.log('HomePage: Пользователь авторизован:', authData.user);
        } else {
          console.log('HomePage: Пользователь не авторизован');
        }
      } catch (error) {
        console.error('HomePage: Ошибка при проверке аутентификации:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authCheck();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    let currentWeek = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push('');
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
        currentWeek.push('');
      }
      days.push(currentWeek);
    }

    return days;
  };

  const getMonthName = (date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[date.getMonth()];
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day !== '' &&
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day !== '' &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayClick = (day) => {
    if (day !== '') {
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
  };

  const handleLoginClick = () => {
    console.log('HomePage: Перенаправление на страницу входа');
    navigate('/auth/signin');
  };

  const handleLogoutClick = async () => {
    console.log('HomePage: Начало выхода из системы');
    
    try {
      const confirmLogout = window.confirm('Вы уверены, что хотите выйти?');
      if (!confirmLogout) return;
      
      console.log('HomePage: Вызываю SignOut API');
      await SignOut();
      
      setIsLoggedIn(false);
      setUser(null);
      
      console.log('HomePage: Выход успешно выполнен');
    
      alert('Вы успешно вышли из системы');
      
      if (location.pathname === '/user') {
        navigate('/');
      }
    } catch (error) {
      console.error('HomePage: Ошибка при выходе:', error);
      alert('Произошла ошибка при выходе из системы');
    }
  };

  useEffect(() => {
    const days = getDaysInMonth(currentDate);
    setCalendarDays(days);
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear());
  }, [currentDate]);

  useEffect(() => {
    const days = getDaysInMonth(currentDate);
    setCalendarDays(days);
    setCurrentMonth(getMonthName(currentDate));
    setCurrentYear(currentDate.getFullYear());
    setSelectedDate(new Date());
  }, []);


  const isCalendarActive = location.pathname === '/';
  const isMyPlantsActive = location.pathname === '/plants/my_plants';
  const isUserActive = location.pathname === '/user';

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <img src={'/logo.svg'} alt="Florally" className="logo" />
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

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={'/logo.svg'} alt="Florally" className="logo" />
          <nav className="navigation">
            <Link
              to="/plants/my_plants"
              className={`nav-link ${isMyPlantsActive ? 'calendar-active' : ''}`}
            >
              Мои растения
            </Link>
            <Link
              to="/"
              className={`nav-link ${isCalendarActive ? 'calendar-active' : ''}`}
            >
              Календарь
            </Link>
            <Link 
              to="/user" 
              className={`nav-link ${isUserActive ? 'calendar-active' : ''}`}
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
      <main className="main-content">
        <section className="info-card">
          <h2 className="card-title">Задачи на день</h2>
          {!isLoggedIn && (
            <div className="not-authorized-container">
              <div className="not-authorized-message">
                Вы не авторизованы
              </div>
              <button 
                className="info-card-login-button"
                onClick={handleLoginClick}
              >
                Войти
              </button>
            </div>
          )}
        </section>
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
                        className={`calendar-day ${day === '' ? 'empty' : ''} ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
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
        <section className="plants-container">
          <div className="plant-image-left"></div>
          <div className="plant-image-right"></div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;