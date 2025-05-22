import { Link } from 'react-router-dom';
import '../css/app.css';
import { useNavigate } from 'react-router-dom';

class Logger {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    }

    log(message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = `${timestamp} [INFO] ${message} ${data ? JSON.stringify(data) : ''}`;
        this._saveLog(entry);
        console.log(`[INFO] ${timestamp} - ${message}`, data || '');
    }

    error(message, error) {
        const timestamp = new Date().toISOString();
        const entry = `${timestamp} [ERROR] ${message} ${error?.stack || ''}`;
        this._saveLog(entry);
        console.error(`[ERROR] ${timestamp} - ${message}`, error);
    }

    _saveLog(entry) {
        this.logs.push(entry);
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        localStorage.setItem('app_logs', JSON.stringify(this.logs));
    }

    exportLogs() {
        const logText = this.logs.join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

const logger = new Logger();

const InstructionsPage = () => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logger.log('Спроба виходу з системи');
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
            logger.log('Підтвердження виходу, перенаправлення на головну сторінку');
            navigate('/mainpage');
        } else {
            logger.log('Вихід скасовано користувачем');
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
                    <li><Link to="/mainpage" onClick={() => logger.log('Перехід на головну сторінку з інструкцій')}>Головна</Link></li>
                    <li><Link to="/aboutpage" onClick={() => logger.log('Перехід на сторінку "Про нас"')}>Про нас</Link></li>
                    <li><Link to="/instructionspage" onClick={() => logger.log('Оновлення сторінки інструкцій')}>Інструкція</Link></li>
                    <li><Link to="/home" onClick={() => logger.log('Перехід до сторінки всіх кредитів')}>Всі кредити</Link></li>
                    <li><Link to="/calculator" onClick={() => logger.log('Перехід до калькулятора')}>Калькулятор</Link></li>
                    <li><Link to="/sign_up" onClick={() => logger.log('Перехід до сторінки реєстрації')}>Реєстрація</Link></li>
                    <li><Link to="/profile" onClick={() => logger.log('Перехід до профілю')}>Профіль</Link></li>
                    <li><Link to="/portfolio" onClick={() => logger.log('Перехід до портфоліо')}>Портфоліо</Link></li>
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

                <h2 className='video_instr'>Відеоінструкція</h2>
                <div className="video-container">
                    <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/PTN1RQZAQKM"
                        title="Відеоінструкція"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => logger.log('Завантажено відеоінструкцію')}
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
                <button 
                    onClick={() => {
                        logger.log('Експорт логів зі сторінки інструкцій');
                        logger.exportLogs();
                    }}
                    style={{
                        padding: '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    Експортувати логи
                </button>
            </footer>
        </div>
    );
};

export default InstructionsPage;