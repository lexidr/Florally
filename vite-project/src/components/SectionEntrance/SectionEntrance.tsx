import "./SectionEntrance.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormData {
  email: string;
  password: string;
}

const SectionEntrance = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});

  useEffect(() => {
    console.log("SectionEntrance: Компонент смонтирован");
    console.log("Текущий статус аутентификации:", isAuthenticated);

    if (isAuthenticated) {
      console.log("Пользователь уже авторизован, перенаправляем на главную");
      navigate("/");
    }

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    console.log("Проверка localStorage:");
    console.log("  - Токен:", token ? "присутствует" : "отсутствует");
    console.log("  - Пользователь:", userStr ? "присутствует" : "отсутствует");

    console.log("Переменные окружения:");
    console.log(
      "  - VITE_API_URL:",
      (import.meta as any).env.VITE_API_URL || "не установлена"
    );

    return () => {
      console.log("SectionEntrance: Компонент размонтирован");
    };
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    console.log(`Изменение поля ${name}: "${value}"`);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name as keyof LoginFormData]) {
      console.log(`Очистка ошибки для поля ${name}`);
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (error) {
      console.log("Очистка ошибки из useAuth");
      clearError();
    }
  };

  const validateForm = (): boolean => {
    console.log("Валидация формы...");

    const errors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      console.log("Ошибка валидации: email обязателен");
      errors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      console.log(`Ошибка валидации: некорректный email "${formData.email}"`);
      errors.email = "Введите корректный email";
    }

    if (!formData.password) {
      console.log("Ошибка валидации: пароль обязателен");
      errors.password = "Пароль обязателен";
    }

    console.log(
      "Результат валидации:",
      Object.keys(errors).length === 0 ? "успешно" : "есть ошибки",
      errors
    );
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Отправка формы входа...");
    console.log("Данные формы:", {
      email: formData.email,
      password: "[СКРЫТО]",
    });

    if (!validateForm()) {
      console.log("Валидация не пройдена, отправка отменена");
      return;
    }

    console.log("Валидация пройдена, вызываем signIn...");

    try {
      console.log("Вызов signIn с данными:", {
        email: formData.email,
        password: "[СКРЫТО]",
      });
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      });

      console.log("signIn успешно выполнен:", result);
      console.log(
        "Токен сохранен в localStorage:",
        localStorage.getItem("token") ? "да" : "нет"
      );
      console.log(
        "Данные пользователя сохранены:",
        localStorage.getItem("user") ? "да" : "нет"
      );
    } catch (err: any) {
      console.error("Ошибка при входе:", err);
      console.error("Детали ошибки:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config?.url,
      });
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Клик по 'Забыли пароль?' для email:", formData.email);
  };

  console.log("Рендер компонента SectionEntrance:");
  console.log("  - isLoading:", isLoading);
  console.log("  - error:", error);
  console.log("  - formData:", { email: formData.email, password: "[СКРЫТО]" });
  console.log("  - formErrors:", formErrors);

  return (
    <section className="entrance-container">
      <div className="form-section">
        <div className="entrance-card">
          <h2>Вход</h2>

          {error && <div className="error-message">{error}</div>}

          <form className="entrance-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
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

            <div className="form-group">
              <input
                type="password"
                name="password"
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

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </button>

            <div className="form-links">
              <span>
                Нет аккаунта? <Link to="/auth/signup">Зарегистрироваться</Link>
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
