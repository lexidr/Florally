import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SectionRegistrationForm from './components/SectionRegistrationForm/SectionRegistrationForm';
import SectionEntrance from './components/SectionEntrance/SectionEntrance';
import HomePage from './components/HomePage/HomePage';
import MyPlant from './components/MyPlant/MyPlant';
import User from './components/User/User';
import EMailVerification from './components/EMailVerification/EMailVerification';

import './App.css';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <BrowserRouter>
      <div className={`App ${isDarkMode ? 'dark-theme' : ''}`}>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route 
            path="/plants/my_plants" 
            element={<MyPlant isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route 
            path="/user" 
            element={<User isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route 
            path="/auth/signup" 
            element={<SectionRegistrationForm isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route 
            path="/auth/signin" 
            element={<SectionEntrance isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route path="/auth/signup/confirmation/:confirmationToken" element={<EMailVerification />} />
          
          <Route 
            path="*" 
            element={<HomePage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}