import './SectionEntrance.css';

const SectionEntrance = () => {
  // временная заглушка 
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
  };

  /*
    ориентируясь на макет формы регистрации реализуйте макет входа 
    В папке components смотрите нужный вам файл компонента

    Учтите, что вы работаете (можете менять) в файлах папки SectionEntrance (.css и .jsx),
    App.css ( вряд ли придется что-то менять, но вдруг) и App.jsx
  */
  return (
    <section>
      <div className="image-section">
        <img src="/back-img.svg" alt="Background" className="background-image" />
      </div>
    </section>
  );
};

export default SectionEntrance;