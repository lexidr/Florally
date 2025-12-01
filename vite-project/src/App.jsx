import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SectionRegistrationForm from './components/SectionRegistrationForm/SectionRegistrationForm';
import SectionEntrance from './components/SectionEntrance/SectionEntrance';
import './App.css';
import HomePage from './components/HomePage/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/auth/signup" replace />} />
          <Route path="auth">
            <Route path="signup" element={<SectionRegistrationForm />} />
            <Route path="signin" element={<SectionEntrance />} />
          </Route>
          <Route path="*" element={<Navigate to="/auth/signup" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
