import React from 'react';
import SectionRegistrationForm from './components/SectionRegistrationForm/SectionRegistrationForm';
import SectionEntrance from './components/SectionEntrance/SectionEntrance'
import './App.css';

export default function App() {
  return (
    <div className="App">
      <SectionRegistrationForm />
      {/*<SectionEntrance /> - расскомментируйте как закончите реализацию соответствующего
      компонента и закомментируйте компонент выше,
       чтобы было удобно сверять и не было конфликтов*/}
    </div>
  );
}