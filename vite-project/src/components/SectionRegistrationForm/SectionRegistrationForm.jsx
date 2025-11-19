import './SectionRegistrationForm.css';

const SectionRegistrationForm = () => {
  // временная заглушка 
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Форма отправлена');
  };
  
  return (
    <section className="registration-container">
      <div className="form-section">
        <div className="registration-card">
          <h2>Регистрация</h2>
          <form onSubmit={handleSubmit} className="registration-form">
            <div>
              <label htmlFor="name" className="visually-hidden">Полное имя</label>
              <input
                type="text"
                id="name"
                placeholder="Имя"
                required
              />
            </div>
          {/*
            1. Доделайте реализацию формы, т.е. 
            2. Допишите оставшиеся поля подобно полю выше 
            3. Напишите стили для формы, в том числе для полей и h2
              ( ориентируйтесь на макет в фигме)
            4. Не забудьте добавить лого (оно уже сохранено в папке public)
            5. Стилизуйте объект ниже (<span> <a></a> </span>)

            Учтите, что вы работаете (можете менять) в файлах папки SectionRegistrationForm
            (.css и .jsx), App.css ( вряд ли придется что-то менять, но вдруг) и App.jsx
          */}
          </form>
          <span className="login-link">
            Eсть аккаунт? <a href="/login">Войти</a>
          </span>
        </div>
      </div>
      <div className="image-section">
        <img src="/back-img.svg" alt="Background" className="background-image" />
      </div>
    </section>
  );
};

export default SectionRegistrationForm;