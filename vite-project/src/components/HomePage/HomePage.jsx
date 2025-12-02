import React, { useState, useEffect } from 'react';
import './HomePage.css';

function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');

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

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={'/logo.svg'} alt="Florally" className="logo" />
          <nav className="navigation">
            <a href="#" className="nav-link">Мои растения</a>
            <a href="#" className="nav-link calendar-active">Календарь</a>
            <a href="#" className="nav-link">Профиль</a>
            <a href="#" className="nav-link">Настройки</a>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <div className="info-card">
          <h2 className="card-title">Информация о растениях</h2>
        </div>
        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button className="calendar-nav-button" onClick={prevMonth}>
                &lt;
              </button>
              <h2 className="calendar-title">
                {currentMonth} {currentYear}
              </h2>
              <button className="calendar-nav-button" onClick={nextMonth}>
                &gt;
              </button>
            </div>
          </div>
          <div className="calendar">
            <div className="weekdays">
              <div className="weekday">Пн</div>
              <div className="weekday">Вт</div>
              <div className="weekday">Ср</div>
              <div className="weekday">Чт</div>
              <div className="weekday">Пт</div>
              <div className="weekday">Сб</div>
              <div className="weekday">Вс</div>
            </div>
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
        </div>
        <div className="plants-container">
          <div className="plant-image-left"></div>
          <div className="plant-image-right"></div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;