import './SectionRegistrationForm.css';
import { Link } from 'react-router-dom';

const RegistrationForm = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Форма отправлена");

    if (e.target.checkValidity()) {
      window.location.href = "ССЫЛКА НА САЙТ";
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  const buttonContainerStyle = {
    margin: "1.2vh",
  };

  const linkContainerStyle = {
    margin: "1vh",
  };

  return (
    <section className="registration-container">
      <div className="form-section">
        <div className="registration-card">
          <h2>Регистрация</h2>
          <form className="registration-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="visually-hidden">
                Полное имя
              </label>
              <input type="text" id="name" placeholder="Имя" required />
            </div>
            <div>
              <label htmlFor="mail" className="visually-hidden">
                Email
              </label>
              <input type="email" id="mail" placeholder="Почта" required />
            </div>
            <div>
              <label htmlFor="password" className="visually-hidden">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                placeholder="Пароль"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="visually-hidden">
                Повторите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Повторите пароль"
                required
              />
            </div>
            <div style={buttonContainerStyle}>
              <button
                type="submit"
                className="registration-buttom"
                style={{ width: "76%", margin: "0 auto" }}
              >
                Зарегистрироваться
              </button>
            </div>
            <div className="login-link">
              <span>
                Есть аккаунт?{" "}
                <a href="/login" onClick={handleLoginClick}>
                  Войти
                </a>
              </span>
            </div>
            <div className="logoStyle">
              <img src="logo.svg" alt="logo" />
            </div>
          </form>
        </div>
      </div>
      <div className="image-section">
        <img
          src="OBJECTS.svg"
          alt="Девушка поливает цветок в горшке"
          className="background-image"
        />
      </div>
    </section>
  );
};

export default RegistrationForm;