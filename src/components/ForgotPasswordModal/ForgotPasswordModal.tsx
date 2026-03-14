import "./ForgotPasswordModal.css";
import { useState } from "react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type ModalStep = 'email' | 'code' | 'newPassword';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = "" }: ForgotPasswordModalProps) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setErrors({ email: "Введите почту" });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Введите корректный email" });
      return false;
    }
    return true;
  };

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setErrors({ code: "Введите код" });
      return false;
    }
    if (code.length < 4) {
      setErrors({ code: "Код должен содержать минимум 4 символа" });
      return false;
    }
    return true;
  };

  const validateNewPassword = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) {
      newErrors.newPassword = "Введите пароль";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Пароль должен содержать минимум 6 символов";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Повторите пароль";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail()) {
      console.log("Отправка email для восстановления:", email);
      // Здесь будет API запрос
      setCurrentStep('code');
      setErrors({});
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCode()) {
      console.log("Проверка кода:", code);
      // Здесь будет API запрос
      setCurrentStep('newPassword');
      setErrors({});
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateNewPassword()) {
      console.log("Установка нового пароля");
      // Здесь будет API запрос
      onClose();
      // Сброс состояния после закрытия
      setTimeout(() => {
        setCurrentStep('email');
        setEmail("");
        setCode("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      }, 300);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCurrentStep('email');
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }, 300);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <h2 className="modal-title">Введите почту</h2>
            <form onSubmit={handleEmailSubmit} className="modal-form">
              <div className="modal-field">
                <input
                  type="email"
                  id="reset-email"
                  placeholder="Почта"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({});
                  }}
                  className={errors.email ? "input-error" : ""}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>
              
              <button type="submit" className="modal-button">
                Готово
              </button>
            </form>
          </>
        );

      case 'code':
        return (
          <>
            <h2 className="modal-title">Введите код</h2>
            <form onSubmit={handleCodeSubmit} className="modal-form">
              
              <div className="modal-note">
                Отправленный на почту {email}
              </div>
              
              <div className="modal-field">
                <input
                  type="text"
                  id="reset-code"
                  placeholder="Код"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errors.code) setErrors({});
                  }}
                  className={errors.code ? "input-error" : ""}
                />
                {errors.code && <div className="error-text">{errors.code}</div>}
              </div>
              
              <button type="submit" className="modal-button">
                Готово
              </button>
            </form>
          </>
        );

      case 'newPassword':
        return (
          <>
            <h2 className="modal-title">Придумайте новый пароль</h2>
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="modal-field">
                <input
                  type="password"
                  id="new-password"
                  placeholder="Пароль"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({});
                  }}
                  className={errors.newPassword ? "input-error" : ""}
                />
                {errors.newPassword && <div className="error-text">{errors.newPassword}</div>}
              </div>

              <div className="modal-field">
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({});
                  }}
                  className={errors.confirmPassword ? "input-error" : ""}
                />
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>
              
              <button type="submit" className="modal-button">
                Готово
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>
        {renderStep()}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;