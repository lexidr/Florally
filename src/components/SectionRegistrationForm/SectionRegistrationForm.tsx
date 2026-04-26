import "./SectionRegistrationForm.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegistrationForm = () => {
  const navigate = useNavigate();


  const isLoading = false;
  const error = null;

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
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegistrationFormData> = {};
    
    if (!formData.username.trim()) {
      errors.username = "Имя обязательно";
    }
    if (!formData.email.trim()) {
      errors.email = "Email обязателен";
    }
    if (!formData.password) {
      errors.password = "Пароль обязателен";
    }
    if (formData.password !== formData.confirmPassword) {
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

    setRegisteredUser({
      username: formData.username,
      email: formData.email,
    });
    setShowModal(true);
  };

  const linkContainerStyle = {
    margin: "1vh",
  };

  const linkTextStyle = {
    fontSize: "1.7vh",
  };

  return (
    <>
      <section className="registration-container">
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
                  <div className="error-text">{formErrors.username}</div>
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
                  <div className="error-text">{formErrors.email}</div>
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
                  <div className="error-text">{formErrors.password}</div>
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
                  <div className="error-text">{formErrors.confirmPassword}</div>
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
              <div className="text_1"><span className="text_1">На почту выслано письмо для подтверждения</span></div>
              <div className="text_2"><span className="text_2">*при неверно введенных данных никнейм будет доступен через 15 минут</span></div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default RegistrationForm;
