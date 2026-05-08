import "./SectionRegistrationForm.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SignUp } from "../../api/authApi";

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegistrationForm: React.FC<{ isDarkMode: boolean; toggleTheme: () => void }> = ({ 
  isDarkMode, 
  toggleTheme 
}) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<RegistrationFormData>>({});

  const [showModal, setShowModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ username: string; email: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (formErrors[id as keyof RegistrationFormData]) {
      setFormErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }

    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegistrationFormData> = {};
    
    if (!formData.username.trim()) {
      errors.username = "Имя обязательно";
    }
    if (!formData.email.trim()) {
      errors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Введите корректный email";
    }
    if (!formData.password) {
      errors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов";
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Подтверждение пароля обязательно";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const closeModal = () => {
    setShowModal(false);
    setRegisteredUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await SignUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setRegisteredUser({
        username: formData.username,
        email: formData.email,
      });
      setShowModal(true);
      
    } catch (err: any) {
      console.error("RegistrationForm: Ошибка при регистрации:", err);
      const errorMessage = err.message || "Ошибка при регистрации";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const linkContainerStyle = {
    margin: "1vh",
  };

  const linkTextStyle = {
    fontSize: "1.7vh",
  };

  return (
    <>
      <style>
        {`
          @keyframes modalSlideIn {
            from {
              transform: translateY(-50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            backdrop-filter: blur(3px);
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-contentMail {
            background-color: white;
            border-radius: 20px;
            width: 100%;
            padding: 34px;
            max-width: 788px;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            animation: modalSlideIn 0.3s ease-out;
            overflow: hidden;
            height: 461px;
            display: flex;
            flex-direction: column;
            justify-content: center;  
            align-items: center;      
            text-align: center;
          }

          .text_1{
            margin:auto;
            margin-top: 150px;
            display:flex;
            justify-content:center;
            align-items:center;
            max-height: 68px;
            max-width: 632px;
            line-height: 1.0;
          }

          .text_1>span{
            margin:auto;
            font-size: 40px;
            font-weight: 500;
            text-align:center;
          }

          .text_2{
            height: 15svh;
            display:flex;
            justify-content:center;
            align-items:flex-end;
          }

          .text_2>span{
            margin-bottom:5px;
          }

          .box_button{
            height: 15svh;
            display:flex;
            justify-content:flex-end;
          }

          .modal-close-btnMail {
            position: absolute;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #68863F;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            transition: all 0.2s ease;
            z-index: 100;
            padding: 0;
            margin-bottom: 131px;
            position: absolute;
            right: 32px;
            top: 32px;
          }

          .modal-close-btnMail:hover {
            background-color: #f0f0f0;
            color: #333;
            border: none;
          }
          
           @media (width <= 788px) {
            .modal-contentMail {
              max-width: 75%;
              padding: 28px;
              height: 400px;
            }

            .text_1 {
              margin-top: 100px;
              max-width: 80%;
            }

            .text_1 > span {
              font-size: 30px;
            }

            .modal-close-btnMail {
              right: 28px;
              top: 28px;
            }
          }

          @media (width <= 376px) {
            .modal-overlay {
              padding: 16px;
            }

            .modal-contentMail {
              max-width: 342px;
              padding: 32px 24px 24px;
              min-height: 320px;
            }

            .modal-close-btnMail {
              width: 24px;
              height: 24px;
              font-size: 20px;
              right: 20px;
              top: 20px;
            }

            .text_1 {
              margin-top: 70px;
              max-height: auto;
              max-width: 100%;
            }

            .text_1 > span {
              font-size: 24px;
            }

            .text_2 {
              height: auto;
              margin-top: 16px;
              align-items: center;
            }

            .box_button {
              height: auto;
              margin-top: 20px;
              justify-content: center;
            }
          }

          @media (width <= 320px) {
            .modal-contentMail {
              padding: 24px 16px;
            }

            .text_1 > span {
              font-size: 20px;
            }

            .modal-close-btnMail {
              right: 16px;
              top: 16px;
            }
          }

          @media (width <= 376px) and (height <= 813px) {
            .modal-contentMail {
              width: 100%;
              padding: 32px 32px 24px;
              max-width: 342px;
              height: 320px;
            }

            .modal-close-btnMail {
              width: 20px;
              height: 20px;
              right: 32px;
              top: 32px;
            }

            .text_1{
              margin-top: 90px;
              max-height: 65px;
              max-width: 256px;
            }

            .text_1>span{
              font-size: 24px;
            }
            
            .text_2{
              height: 15svh;
              line-height: 1.0;
            }
          }

          .theme-switch-wrapper {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 100;
            display: flex;
            align-items: center;
          }

          .theme-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
          }

          .theme-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: 34px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
            background: #f1c40f;
          }

          input:checked + .slider {
            background-color: #A8C686;
          }

          input:checked + .slider:before {
            transform: translateX(26px);
          }

          @media (max-width: 810px) {
            .theme-switch-wrapper {
              top: 16px;
              right: 16px;
            }
            
            .theme-switch {
              width: 50px;
              height: 28px;
            }
            
            .slider:before {
              height: 22px;
              width: 22px;
              left: 3px;
              bottom: 3px;
            }
            
            input:checked + .slider:before {
              transform: translateX(22px);
            }
          }
        `}
      </style>

      <section className="registration-container">
        <div className="theme-switch-wrapper">
          <label className="theme-switch" htmlFor="checkbox-registration">
            <input type="checkbox" id="checkbox-registration" checked={isDarkMode} onChange={toggleTheme} />
            <div className="slider round"></div>
          </label>
        </div>

        <div className="form-section">
          <div className="registration-card">
            <h2>Регистрация</h2>

            {error && (
              <div
                className="error-message"
                style={{
                  color: "red",
                  marginBottom: "1rem",
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="username" className="visually-hidden">
                  Полное имя
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Имя"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={formErrors.username ? "input-error" : ""}
                />
                {formErrors.username && (
                  <div className="error-text1">{formErrors.username}</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email" className="visually-hidden">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Почта"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={formErrors.email ? "input-error" : ""}
                />
                {formErrors.email && (
                  <div className="error-text1">{formErrors.email}</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="password" className="visually-hidden">
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={formErrors.password ? "input-error" : ""}
                />
                {formErrors.password && (
                  <div className="error-text1">{formErrors.password}</div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword" className="visually-hidden">
                  Повторите пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Повторите пароль"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={formErrors.confirmPassword ? "input-error" : ""}
                />
                {formErrors.confirmPassword && (
                  <div className="error-text1">{formErrors.confirmPassword}</div>
                )}
              </div>

              <div className="buttonContainerStyle">
                <button
                  type="submit"
                  className="registration-buttom"
                  style={{ margin: "0 auto" }}
                  disabled={isLoading}
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
              </div>

              <div style={linkContainerStyle}>
                <span style={linkTextStyle} className="login-link">
                  Есть аккаунт? <Link to="/auth/signin" className="LinkSelect">Войти</Link>
                </span>
              </div>

              <img className="LogotypeStyle" src="/logo.svg" alt="logo" />
            </form>
          </div>
        </div>

        <div className="image-section">
          <img
            src="/back-img.svg"
            alt="Девушка поливает цветок в горшке"
            className="background-image"
          />
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-contentMail">
              <button className="modal-close-btnMail" onClick={closeModal}>✕</button>
              <div className="text_1"><span>На почту выслано письмо для подтверждения</span></div>
              <div className="text_2">
                <span>
                  *при неверно введенных данных никнейм будет доступен через 15 минут
                  <br />
                  **Нет письма? Не страшно! Скорее всего оно спряталось в спаме
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default RegistrationForm;