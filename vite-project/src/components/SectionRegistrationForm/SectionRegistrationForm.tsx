import "./SectionRegistrationForm.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegistrationForm = () => {
  console.log("RegistrationForm: Компонент монтируется");

  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<RegistrationFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<RegistrationFormData>>(
    {}
  );

  console.log("RegistrationForm: Начальное состояние:", {
    isLoading,
    error,
    isAuthenticated,
    formData: {
      ...formData,
      password: "[СКРЫТО]",
      confirmPassword: "[СКРЫТО]",
    },
    formErrors,
  });

  useEffect(() => {
    console.log("RegistrationForm: useEffect запущен");
    console.log(
      "RegistrationForm: isAuthenticated изменился на:",
      isAuthenticated
    );

    if (isAuthenticated) {
      console.log(
        "RegistrationForm: Пользователь аутентифицирован, перенаправляем на главную"
      );
      navigate("/");
    }

    // Проверяем localStorage
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    console.log("RegistrationForm: Проверка localStorage:", {
      token: token ? "присутствует" : "отсутствует",
      user: user ? "присутствует" : "отсутствует",
    });
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    console.log(
      `RegistrationForm: Изменение поля ${id}: "${
        id === "password" || id === "confirmPassword" ? "[СКРЫТО]" : value
      }"`
    );

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (formErrors[id as keyof RegistrationFormData]) {
      console.log(`RegistrationForm: Очистка ошибки для поля ${id}`);
      setFormErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }

    if (error) {
      console.log("RegistrationForm: Очистка ошибки из useAuth");
      clearError();
    }
  };

  const validateForm = (): boolean => {
    console.log("RegistrationForm: Начало валидации формы");
    console.log("RegistrationForm: Данные для валидации:", {
      username: formData.username,
      email: formData.email,
      passwordLength: formData.password.length,
      confirmPasswordLength: formData.confirmPassword.length,
    });

    const errors: Partial<RegistrationFormData> = {};

    if (!formData.username.trim()) {
      console.log("RegistrationForm: Валидация ошибка - имя обязательно");
      errors.username = "Имя обязательно";
    } else if (formData.username.length < 2) {
      console.log(
        `RegistrationForm: Валидация ошибка - имя слишком короткое: ${formData.username.length} символов`
      );
      errors.username = "Имя должно содержать минимум 2 символа";
    }

    if (!formData.email.trim()) {
      console.log("RegistrationForm: Валидация ошибка - email обязателен");
      errors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      console.log(
        `RegistrationForm: Валидация ошибка - некорректный email: ${formData.email}`
      );
      errors.email = "Введите корректный email";
    }

    if (!formData.password) {
      console.log("RegistrationForm: Валидация ошибка - пароль обязателен");
      errors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      console.log(
        `RegistrationForm: Валидация ошибка - пароль слишком короткий: ${formData.password.length} символов`
      );
      errors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (!formData.confirmPassword) {
      console.log(
        "RegistrationForm: Валидация ошибка - подтверждение пароля обязательно"
      );
      errors.confirmPassword = "Подтверждение пароля обязательно";
    } else if (formData.password !== formData.confirmPassword) {
      console.log("RegistrationForm: Валидация ошибка - пароли не совпадают");
      errors.confirmPassword = "Пароли не совпадают";
    }

    console.log("RegistrationForm: Результат валидации:", {
      isValid: Object.keys(errors).length === 0,
      errorsCount: Object.keys(errors).length,
      errors,
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("RegistrationForm: Отправка формы");
    console.log("RegistrationForm: Данные формы:", {
      username: formData.username,
      email: formData.email,
      passwordLength: formData.password.length,
      confirmPasswordLength: formData.confirmPassword.length,
    });

    if (!validateForm()) {
      console.log("RegistrationForm: Валидация не пройдена, отправка отменена");
      return;
    }

    console.log("RegistrationForm: Валидация пройдена, вызываю signUp");
    console.log("RegistrationForm: Вызов signUp с данными:", {
      username: formData.username,
      email: formData.email,
      password: "[СКРЫТО]",
    });

    try {
      const result = await signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      console.log("RegistrationForm: signUp успешно выполнен:", result);
      console.log(
        "RegistrationForm: Проверка localStorage после регистрации:",
        {
          access_token: localStorage.getItem("access_token")
            ? "присутствует"
            : "отсутствует",
          user: localStorage.getItem("user") ? "присутствует" : "отсутствует",
        }
      );
    } catch (err: any) {
      console.error("RegistrationForm: Ошибка при регистрации:", err);
      console.error("RegistrationForm: Детали ошибки:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
    }
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

  console.log("RegistrationForm: Рендер компонента с состоянием:", {
    isLoading,
    error,
    formErrors,
    formData: {
      ...formData,
      password: "[СКРЫТО]",
      confirmPassword: "[СКРЫТО]",
    },
  });

  return (
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
            <div>
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
                <span style={{ color: "red", fontSize: "0.8rem" }}>
                  {formErrors.username}
                </span>
              )}
            </div>

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

            <div>
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
                <span style={{ color: "red", fontSize: "0.8rem" }}>
                  {formErrors.confirmPassword}
                </span>
              )}
            </div>

            <div style={buttonContainerStyle}>
              <button
                type="submit"
                className="registration-buttom"
                style={{ width: "76%", margin: "0 auto" }}
                disabled={isLoading}
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </div>

            <div style={linkContainerStyle}>
              <span style={linkTextStyle} className="login-link">
                Есть аккаунт? <Link to="/auth/signin">Войти</Link>
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

export default RegistrationForm;
