import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MyPlant.css';

function MyPlant() {
  const location = useLocation();
  
  const isCalendarActive = location.pathname === '/';
  const isMyPlantsActive = location.pathname === '/plants/my_plants';
  const isUserActive = location.pathname === '/user';

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
        </div>
      </header>
      <main className="my-plants-content">
        <section className="coming-soon-container">
          <div className="plant-image-container"></div>
          <div className="coming-soon-text">
            <p>Coming</p>
            <p>soon</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MyPlant;