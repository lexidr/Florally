import "./ForgotPasswordModal.css";
import { useState } from "react";
import { forgotPassword, verifyResetCode, resetPassword } from "../../api/passwordApi";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type ModalStep = 'email' | 'code' | 'newPassword' | 'success';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = "" }: ForgotPasswordModalProps) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentStep('email');
    setErrors({});
    setIsLoading(false);
    onClose();
  };

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
    return true;
  };

  const validatePasswords = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (newPassword.length < 8) newErrors.newPassword = "Минимум 8 символов";
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Пароли не совпадают";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await forgotPassword({ email });
      setCurrentStep('code');
      setErrors({});
    } catch (err: any) {
      setErrors({ email: err.response?.data?.message || "Ошибка при отправке кода" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode()) return;

    setIsLoading(true);
    try {
      const res = await verifyResetCode({ email, code });
      if (res.verified) {
        setCurrentStep('newPassword');
        setErrors({});
      } else {
        setErrors({ code: "Неверный код" });
      }
    } catch (err: any) {
      setErrors({ code: err.response?.data?.message || "Ошибка проверки кода" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsLoading(true);
    try {
      await resetPassword({ email, newPassword });
      setCurrentStep('success');
      setErrors({});
    } catch (err: any) {
      setErrors({ newPassword: err.response?.data?.message || "Не удалось сменить пароль" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <h2 className="modal-title">Восстановление</h2>
            <form onSubmit={handleEmailSubmit}>
              <div className="modal-field">
                <input
                  type="email"
                  placeholder="Ваш Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({});
                  }}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>
              <button type="submit" className="modal-button" disabled={isLoading}>
                {isLoading ? "Отправка..." : "Отправить код"}
              </button>
            </form>
          </>
        );

      case 'code':
        return (
          <>
            <h2 className="modal-title">Введите код</h2>
            <p className="modal-note">Код отправлен на {email}</p>
            <form onSubmit={handleCodeSubmit}>
              <div className="modal-field">
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errors.code) setErrors({});
                  }}
                />
                {errors.code && <div className="error-text">{errors.code}</div>}
              </div>
              <button type="submit" className="modal-button" disabled={isLoading}>
                {isLoading ? "Проверка..." : "Подтвердить"}
              </button>
            </form>
          </>
        );

      case 'newPassword':
        return (
          <>
            <h2 className="modal-title">Новый пароль</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-field">
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({});
                  }}
                />
                {errors.newPassword && <div className="error-text">{errors.newPassword}</div>}
              </div>

              <div className="modal-field">
                <input
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({});
                  }}
                />
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>
              
              <button type="submit" className="modal-button" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Готово"}
              </button>
            </form>
          </>
        );

      case 'success':
        return (
          <>
            <h2 className="modal-title">Успешно!</h2>
            <p className="modal-note">Ваш пароль был успешно изменен.</p>
            <button className="modal-button" onClick={handleClose}>
              Войти в аккаунт
            </button>
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