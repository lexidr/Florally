import "./SectionEntrance.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import ForgotPasswordModal from "../ForgotPasswordModal/ForgotPasswordModal";

interface LoginFormData {
  email: string;
  password: string;
}

const SectionEntrance: React.FC<{ isDarkMode: boolean; toggleTheme: () => void }> = ({ 
  isDarkMode, 
  toggleTheme 
}) => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (formErrors[id as keyof LoginFormData]) {
      setFormErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }

    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signIn({
        email: formData.email,
        password: formData.password,
      });
    } catch (err: any) {
      console.error("Ошибка при входе:", err);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const buttonContainerStyle = {
    margin: "1.2vh",
  };

  const linkContainerStyle = {
    margin: "1vh",
  };

  const linkTextStyle = {
    fontSize: "1.7vh",
  };

  return (
    <section className="entrance-container">
      <div className="theme-switch-wrapper" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <label className="theme-switch" htmlFor="checkbox-entrance">
          <input type="checkbox" id="checkbox-entrance" checked={isDarkMode} onChange={toggleTheme} />
          <div className="slider round"></div>
        </label>
      </div>

      <div className="form-section">
        <div className="entrance-card">
          <h2>Вход</h2>

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

          <form className="entrance-form" onSubmit={handleSubmit}>
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

            <div className="forgot-password">
              <a href="#" onClick={handleForgotPassword}>
                Забыли пароль?
              </a>
            </div>

            <div style={buttonContainerStyle}>
              <button
                type="submit"
                className="submit-button"
                style={{ width: "80%", margin: "0 auto" }}
                disabled={isLoading}
              >
                {isLoading ? "Вход..." : "Войти"}
              </button>
            </div>

            <div style={linkContainerStyle}>
              <span style={linkTextStyle} className="login-link">
                Нет аккаунта? <Link to="/auth/signup">Зарегистрироваться</Link>
              </span>
            </div>
          </form>

          <img className="logoStyle" src="/logo.svg" alt="logo" />
        </div>
      </div>

      <div className="image-section">
        <img
          src="/back-img.svg"
          alt="Девушка поливает цветок в горшке"
          className="background-image"
        />
      </div>

      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialEmail={formData.email}
      />
    </section>
  );
};

export default SectionEntrance;