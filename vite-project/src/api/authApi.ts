
import { Http, API } from "../constants/api";
import { ISignIn, ISignUp } from "./authApi.types";

console.log("authApi.ts: Импортированные переменные:");
console.log("  - API:", API);
console.log("  - Http:", {
  defaults: Http.defaults,
  baseURL: Http.defaults.baseURL,
  headers: Http.defaults.headers,
  interceptors: "present",
});

export const SignUp = async (userData: ISignUp) => {
  console.log("SignUp: Начало регистрации пользователя");
  console.log("SignUp: Входные данные:", {
    username: userData.username,
    email: userData.email,
    password: "[СКРЫТО]",
  });

  try {
    const url = `${API}/auth/signup`;
    console.log("SignUp: URL запроса:", url);

    const response = await Http({
      method: "post",
      url: url,
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      },
    });

    console.log("SignUp: Ответ от сервера:", {
      status: response.status,
      statusText: response.statusText,
      data: {
        access_token: response.data.access_token
          ? "присутствует"
          : "отсутствует",
        user: response.data.user,
      },
    });

    if (response.data.access_token) {
      console.log("SignUp: Получен access_token, настраиваю заголовки");
      Http.defaults.headers[
        "Authorization"
      ] = `Bearer ${response.data.access_token}`;
      localStorage.setItem("access_token", response.data.access_token);
      console.log("SignUp: Токен сохранен в localStorage");

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("SignUp: Данные пользователя сохранены в localStorage");
      }
    }

    console.log("SignUp: Регистрация успешно завершена");
    return response.data;
  } catch (error: any) {
    console.error("SignUp: Ошибка при регистрации:", error);
    console.error("SignUp: Детали ошибки:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config.data) : null,
      },
    });
    throw error;
  }
};

export const SignIn = async (userData: ISignIn) => {
  console.log("SignIn: Начало входа пользователя");
  console.log("SignIn: Входные данные:", {
    email: userData.email,
    password: "[СКРЫТО]",
  });

  try {
    const url = `${API}/auth/signin`;
    console.log("SignIn: URL запроса:", url);
    console.log("SignIn: Текущие заголовки Http:", Http.defaults.headers);

    const response = await Http({
      method: "post",
      url: url,
      data: {
        email: userData.email,
        password: userData.password,
      },
    });

    console.log("SignIn: Ответ от сервера:", {
      status: response.status,
      statusText: response.statusText,
      data: {
        access_token: response.data.access_token
          ? "присутствует"
          : "отсутствует",
        user: response.data.user,
      },
    });

    if (response.data.access_token) {
      console.log("SignIn: Получен access_token, настраиваю заголовки");
      Http.defaults.headers[
        "Authorization"
      ] = `Bearer ${response.data.access_token}`;
      localStorage.setItem("access_token", response.data.access_token);
      console.log("SignIn: Токен сохранен в localStorage");

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("SignIn: Данные пользователя сохранены в localStorage");
      }

      console.log("SignIn: Обновленные заголовки Http:", Http.defaults.headers);
    }

    console.log("SignIn: Вход успешно завершен");
    return response.data;
  } catch (error: any) {
    console.error("SignIn: Ошибка при входе:", error);
    console.error("SignIn: Детали ошибки:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data ? JSON.parse(error.config.data) : null,
      },
    });
    throw error;
  }
};

export const SignOut = async () => {
  console.log("SignOut: Выход из системы");
  console.log("SignOut: Проверка localStorage перед выходом:", {
    access_token: localStorage.getItem("access_token")
      ? "присутствует"
      : "отсутствует",
    user: localStorage.getItem("user") ? "присутствует" : "отсутствует",
  });

  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    console.log("SignOut: Данные удалены из localStorage");

    delete Http.defaults.headers["Authorization"];
    console.log("SignOut: Заголовок Authorization удален из Http");
    console.log("SignOut: Текущие заголовки Http:", Http.defaults.headers);

    console.log("SignOut: Выход успешно выполнен");
    return { success: true };
  } catch (error: any) {
    console.error("SignOut: Ошибка при выходе:", error);
    throw error;
  }
};

export const checkAuth = () => {
  console.log("checkAuth: Проверка аутентификации");
  const token = localStorage.getItem("access_token");
  const user = localStorage.getItem("user");

  console.log("checkAuth: Проверка localStorage:", {
    token: token ? "присутствует" : "отсутствует",
    user: user ? "присутствует" : "отсутствует",
  });

  if (token) {
    console.log("checkAuth: Токен найден, настраиваю заголовки");
    Http.defaults.headers["Authorization"] = `Bearer ${token}`;
    console.log(
      "checkAuth: Заголовки Http после настройки:",
      Http.defaults.headers
    );
  }

  const result = {
    isAuthenticated: !!token,
    token,
    user: user ? JSON.parse(user) : null,
  };

  console.log("checkAuth: Результат проверки:", result);
  return result;
};

export const getCurrentUser = async () => {
  console.log("getCurrentUser: Получение текущего пользователя");

  try {
    const url = `${API}/auth/me`;
    console.log("getCurrentUser: URL запроса:", url);
    console.log("getCurrentUser: Текущие заголовки:", Http.defaults.headers);

    const response = await Http({
      method: "get",
      url: url,
    });

    console.log("getCurrentUser: Ответ от сервера:", {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    console.error("getCurrentUser: Ошибка при запросе:", error);

    const user = localStorage.getItem("user");
    if (user) {
      console.log("getCurrentUser: Использую пользователя из localStorage");
      return JSON.parse(user);
    }

    console.error(
      "getCurrentUser: Пользователь не найден ни в ответе, ни в localStorage"
    );
    throw error;
  }
};

export const refreshToken = async () => {
  console.log("refreshToken: Обновление токена");
  console.log(
    "refreshToken: Текущий токен в localStorage:",
    localStorage.getItem("access_token") ? "присутствует" : "отсутствует"
  );

  try {
    const url = `${API}/auth/refresh`;
    console.log("refreshToken: URL запроса:", url);

    const response = await Http({
      method: "post",
      url: url,
    });

    console.log("refreshToken: Ответ от сервера:", {
      status: response.status,
      data: {
        access_token: response.data.access_token
          ? "присутствует"
          : "отсутствует",
      },
    });

    if (response.data.access_token) {
      console.log("refreshToken: Получен новый токен, обновляю заголовки");
      Http.defaults.headers[
        "Authorization"
      ] = `Bearer ${response.data.access_token}`;
      localStorage.setItem("access_token", response.data.access_token);
      console.log("refreshToken: Новый токен сохранен в localStorage");
    }

    console.log("refreshToken: Токен успешно обновлен");
    return response.data;
  } catch (error: any) {
    console.error("refreshToken: Ошибка при обновлении токена:", error);
    console.error("refreshToken: Детали ошибки:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    console.log(
      "refreshToken: Выполняю выход из системы после ошибки обновления токена"
    );
    await SignOut();
    throw error;
  }
};

console.log("authApi.ts: Настройка interceptors для Http");

Http.interceptors.response.use(
  (response: any) => {
    console.log("Http interceptor: Успешный ответ", {
      url: response.config.url,
      status: response.status,
      method: response.config.method,
    });
    return response;
  },
  async (error: any) => {
    console.error("Http interceptor: Ошибка ответа", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(
        "Http interceptor: Обнаружена ошибка 401, пытаюсь обновить токен"
      );
      originalRequest._retry = true;

      try {
        console.log("Http interceptor: Вызываю refreshToken");
        await refreshToken();
        console.log(
          "Http interceptor: Токен обновлен, повторяю запрос:",
          originalRequest.url
        );

        return Http(originalRequest);
      } catch (refreshError) {
        console.error(
          "Http interceptor: Ошибка при обновлении токена:",
          refreshError
        );
        console.log("Http interceptor: Перенаправляю на страницу входа");
        window.location.href = "/auth/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

console.log("authApi.ts: Модуль инициализирован");

export default {
  SignUp,
  SignIn,
  SignOut,
  checkAuth,
  getCurrentUser,
  refreshToken,
};


