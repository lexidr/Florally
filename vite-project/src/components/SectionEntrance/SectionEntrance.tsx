import "./SectionEntrance.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormData {
  email: string;
  password: string;
}

const SectionEntrance = () => {
  console.log("SectionEntrance: Компонент монтируется");

  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});

  console.log("SectionEntrance: Начальное состояние:", {
    isLoading,
    error,
    isAuthenticated,
    formData: {
      email: formData.email,
      password: "[СКРЫТО]",
    },
    formErrors,
  });

  useEffect(() => {
    console.log("SectionEntrance: useEffect запущен");
    console.log(
      "SectionEntrance: isAuthenticated изменился на:",
      isAuthenticated
    );

    if (isAuthenticated) {
      console.log(
        "SectionEntrance: Пользователь аутентифицирован, перенаправляем на главную"
      );
      navigate("/");
    }

    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    console.log("SectionEntrance: Проверка localStorage:", {
      token: token ? "присутствует" : "отсутствует",
      user: user ? "присутствует" : "отсутствует",
    });
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    console.log(
      `SectionEntrance: Изменение поля ${id}: "${
        id === "password" ? "[СКРЫТО]" : value
      }"`
    );

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (formErrors[id as keyof LoginFormData]) {
      console.log(`SectionEntrance: Очистка ошибки для поля ${id}`);
      setFormErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }

    if (error) {
      console.log("SectionEntrance: Очистка ошибки из useAuth");
      clearError();
    }
  };

  const validateForm = (): boolean => {
    console.log("SectionEntrance: Начало валидации формы");
    console.log("SectionEntrance: Данные для валидации:", {
      email: formData.email,
      passwordLength: formData.password.length,
    });

    const errors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      console.log("SectionEntrance: Валидация ошибка - email обязателен");
      errors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      console.log(
        `SectionEntrance: Валидация ошибка - некорректный email: ${formData.email}`
      );
      errors.email = "Введите корректный email";
    }

    if (!formData.password) {
      console.log("SectionEntrance: Валидация ошибка - пароль обязателен");
      errors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      console.log(
        `SectionEntrance: Валидация ошибка - пароль слишком короткий: ${formData.password.length} символов`
      );
      errors.password = "Пароль должен содержать минимум 6 символов";
    }

    console.log("SectionEntrance: Результат валидации:", {
      isValid: Object.keys(errors).length === 0,
      errorsCount: Object.keys(errors).length,
      errors,
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("SectionEntrance: Отправка формы");
    console.log("SectionEntrance: Данные формы:", {
      email: formData.email,
      passwordLength: formData.password.length,
    });

    if (!validateForm()) {
      console.log("SectionEntrance: Валидация не пройдена, отправка отменена");
      return;
    }

    console.log("SectionEntrance: Валидация пройдена, вызываю signIn");
    console.log("SectionEntrance: Вызов signIn с данными:", {
      email: formData.email,
      password: "[СКРЫТО]",
    });

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      });

      console.log("SectionEntrance: signIn успешно выполнен:", result);
      console.log(
        "SectionEntrance: Проверка localStorage после входа:",
        {
          access_token: localStorage.getItem("access_token")
            ? "присутствует"
            : "отсутствует",
          user: localStorage.getItem("user") ? "присутствует" : "отсутствует",
        }
      );
    } catch (err: any) {
      console.error("SectionEntrance: Ошибка при входе:", err);
      console.error("SectionEntrance: Детали ошибки:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("SectionEntrance: Клик по 'Забыли пароль?' для email:", formData.email);
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

  const logoStyle = {
    position: "absolute" as const,
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
  };

  console.log("SectionEntrance: Рендер компонента с состоянием:", {
    isLoading,
    error,
    formErrors,
    formData: {
      email: formData.email,
      password: "[СКРЫТО]",
    },
  });

  return (
    <section className="entrance-container">
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
            <div>
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
                <span style={{ color: "red", fontSize: "0.8rem" }}>
                  {formErrors.email}
                </span>
              )}
            </div>

            <div>
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
                <span style={{ color: "red", fontSize: "0.8rem" }}>
                  {formErrors.password}
                </span>
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
                style={{ width: "76%", margin: "0 auto" }}
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

          <img style={logoStyle} src="/logo.svg" alt="logo" />
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