import './SectionEntrance.css';

const SectionEntrance = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
    window.location.href = '/'; // Перенаправление на главную страницу
  };
  /*
    ориентируясь на макет формы регистрации реализуйте макет входа 
    В папке components смотрите нужный вам файл компонента

    Учтите, что вы работаете (можете менять) в файлах папки SectionEntrance (.css и .jsx),
    App.css ( вряд ли придется что-то менять, но вдруг) и App.jsx
  */
 return(
   <form id="loginForm" onSubmit={handleSubmit}>
      <section className="form-section">
        <div className="entrance-card">
          <div style={{ textAlign: 'center', margin: 'auto', paddingTop: '2vh' }}>
            <h2 style={{ fontSize: '5vh' }}>Вход</h2>
            
            <label>
              <input type="email" placeholder="Почта" required />
            </label>
            
            <label>
              <input type="password" placeholder="Пароль" required />
            </label>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px', marginBottom: '12px' }}>
              <a target="_blank" style={{ color: '#B9D19F' }} href="сасайти.html">
                Забыли пароль?
              </a>
            </div>
            
            <button type="submit">
              Войти
            </button>
            
            <div>
              <span>
                Нет аккаунта?{' '}
                <a target="_blank" style={{ color: '#B9D19F' }} href="сасайти.html">
                  Зарегистрироваться
                </a>
              </span>
            </div>
          </div>
          
          <div style={{ position: 'relative', top: 'auto', textAlign: 'center', height: '2vh' }}>
            <img src="/logo.svg" alt="" />
          </div>
        </div>
        
        <div className="image-section" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <img 
            style={{ height: '100vh', paddingBottom: '52px' }} 
            src="/back-img.svg" 
            alt="Background" 
            className="background-image" 
          />
        </div>
      </section>
    </form>
  );
};
export default SectionEntrance;