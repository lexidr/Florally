import React from 'react';
import './HomePage.css';

function HomePage() {
  const calendarDays = [
    [31, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30, 31, '', '', '']
  ];

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
          <div className="plant-info">
          </div>
        </div>
        <div className="calendar-container">
          <div className="calendar-header">
            <h2 className="calendar-title">Ноябрь 2025</h2>
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
                  {week.map((day, dayIndex) => (
                    <div 
                      key={`${weekIndex}-${dayIndex}`} 
                      className={`calendar-day ${day === '' ? 'empty' : ''} ${day === 15 ? 'today' : ''}`}
                    >
                      {day}
                    </div>
                  ))}
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