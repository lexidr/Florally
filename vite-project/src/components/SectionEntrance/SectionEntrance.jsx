import './SectionEntrance.css';

const SectionEntrance = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
    window.location.href = '/';
  };

  return (
    <div className="entrance-container">
      <section className="form-section">
        <div className="entrance-card">
          <h2>Вход</h2>
          
          <form className="entrance-form" onSubmit={handleSubmit}>
            <input type="email" placeholder="Почта" required />
            
            <input type="password" placeholder="Пароль" required />
            
            <div className="forgot-password">
              <a href="#">Забыли пароль?</a>
            </div>
            
            <button type="submit">Войти</button>
            
            <div className="form-links">
              <span>
                Нет аккаунта?{' '}
                <a href="#">Зарегистрироваться</a>
              </span>
            </div>
          </form>
          
          <div className="logo-container">
            <img src="/logo.svg" alt="Логотип" />
          </div>
        </div>
        
        <div className="image-section">
          <img 
            src="/back-img.svg" 
            alt="Дувушка поливает цветок в горшке" 
            className="background-image" 
          />
        </div>
      </section>
    </div>
  );
};

export default SectionEntrance;