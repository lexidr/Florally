import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SectionRegistrationForm from './components/SectionRegistrationForm/SectionRegistrationForm';
import SectionEntrance from './components/SectionEntrance/SectionEntrance';
import HomePage from './components/HomePage/HomePage';
import MyPlant from './components/MyPlant/MyPlant';
import User from './components/User/User';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Главная страница (календарь) */}
          <Route path="/" element={<HomePage />} />
          
          {/* Страница "Мои растения" */}
          <Route path="/plants/my_plants" element={<MyPlant />} />
          
          {/* Страница "Профиль" */}
          <Route path="/user" element={<User />} />
          
          {/* Страницы аутентификации */}
          <Route path="/auth/signup" element={<SectionRegistrationForm />} />
          <Route path="/auth/signin" element={<SectionEntrance />} />
          
          {/* Резервный маршрут */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}