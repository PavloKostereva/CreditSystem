import { Link } from 'react-router-dom';
import '../css/app.css';
import { useNavigate } from 'react-router-dom';
const InstructionsPage = () => {

    const navigate = useNavigate();
    
    const handleLogout = () => {
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
            navigate('/mainpage');
        }
    };
    const steps = [
        {
            title: "Реєстрація в системі",
            content: "Створіть обліковий запис, вказавши свою електронну пошту та пароль. Після реєстрації ви отримаєте доступ до всіх функцій порталу.",
            icon: "📝"
        },
        {
            title: "Пошук кредитних пропозицій",
            content: "Використовуйте фільтри для пошуку оптимальних кредитних пропозицій. Ви можете задати параметри: суму, термін, процентну ставку.",
            icon: "🔍"
        },
        {
            title: "Порівняння пропозицій",
            content: "Наш сервіс автоматично порівнює умови різних кредиторів. Ви побачите детальний розрахунок переплат для кожної пропозиції.",
            icon: "⚖️"
        },
        {
            title: "Оформлення заявки",
            content: "Обравши найкращу пропозицію, заповніть онлайн-заявку. Наші експерти перевірять її протягом 1 години.",
            icon: "📄"
        },
        {
            title: "Отримання коштів",
            content: "Після схвалення заявки кошти будуть перераховані на вашу картку або рахунок у вказаному банку.",
            icon: "💳"
        },
        {
            title: "Управління кредитами",
            content: "У вашому особистому кабінеті ви можете відстежувати графік платежів, робити дострокові погашення або змінювати умови кредиту.",
            icon: "📊"
        }
    ];

    const faq = [
        {
            question: "Які документи потрібні для оформлення кредиту?",
            answer: "Зазвичай потрібен паспорт, ІПН та довідка про доходи. Але деякі кредитори пропонують кредити без довідок."
        },
        {
            question: "Скільки часу займає схвалення заявки?",
            answer: "Більшість онлайн-заявок розглядаються від 15 хвилин до 1 доби."
        },
        {
            question: "Чи можна достроково погасити кредит?",
            answer: "Так, більшість кредитів дозволяють дострокове погашення без штрафів."
        }
    ];

    return (
        <div>
      <header>
        <div className="logo">
          <h1>КредитнийПортал</h1>
          <p>Ваш надійний фінансовий помічник</p>
        </div>
      </header>

      <nav>
                <ul>
                    <li><Link to="/mainpage">Головна</Link></li>
                    <li><Link to="/aboutpage">Про нас</Link></li>
                    <li><Link to="/instructionspage">Інструкція</Link></li>
                    <li><Link to="/home">Всі кредити</Link></li>
                    <li><Link to="/calculator">Калькулятор</Link></li>
                    <li><Link to="/portfolio">Портфоліо</Link></li>
                    <li><button onClick={handleLogout} className="logout">Вихід</button></li>
                </ul>
            </nav>
            
            <main>
                <section className="instructions-hero">
                    <h1>Інструкція з використання КредитногоПорталу</h1>
                    <p>Покроковий гід по всіх функціях нашого сервісу</p>
                </section>

                <section className="steps-section">
                    <h2>Як отримати кредит за 6 кроків</h2>
                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-header">
                                    <span className="step-number">{index + 1}</span>
                                    <span className="step-icon">{step.icon}</span>
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.content}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <h2 class='video_instr'>Відеоінструкція</h2>
<div className="video-container">
    <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/PTN1RQZAQKM"
        title="Відеоінструкція"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
    ></iframe>
</div>


                <section className="faq-section">
                    <h2>Часті запитання</h2>
                    <div className="faq-list">
                        {faq.map((item, index) => (
                            <div key={index} className="faq-item">
                                <h3 className="faq-question">{item.question}</h3>
                                <p className="faq-answer">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="support-section">
                    <h2>Потрібна допомога?</h2>
                    <p>Наші консультанти завжди готові допомогти вам з вибором кредиту</p>
                    <div className="support-contacts">
                        <div className="contact-method">
                            <span className="contact-icon">📞</span>
                            <p>Телефон: <strong>0 800 123 456</strong></p>
                        </div>
                        <div className="contact-method">
                            <span className="contact-icon">✉️</span>
                            <p>Email: <strong>support@kreditnyportal.ua</strong></p>
                        </div>
                        <div className="contact-method">
                            <span className="contact-icon">💬</span>
                            <p>Онлайн-чат: <strong>доступний 24/7</strong></p>
                        </div>
                    </div>
                </section>
            </main>


            <footer>
                <p>© {new Date().getFullYear()} КредитнийПортал</p>
                <p>Контакти: info@kreditnyportal.ua</p>
            </footer>
        </div>
    );
};

export default InstructionsPage;

