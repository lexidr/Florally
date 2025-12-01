import './SectionEntrance.css';
import { Link } from 'react-router-dom';

const SectionEntrance = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
  };

  return (
    <section className="entrance-container">
      <div className="form-section">
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
                <Link to="/auth/signup">Зарегистрироваться</Link>
              </span>
            </div>
          </form>
          
          <div className="logo-container">
            <img src="/logo.svg" alt="Логотип" />
          </div>
        </div>
      </div>
      
      <div className="image-section">
        <img 
          src="/back-img.svg" 
          alt="Девушка поливает цветок в горшке" 
          className="background-image" 
        />
      </div>
    </section>
  );
};

export default SectionEntrance;