import { Link, useNavigate } from 'react-router-dom';
import '../css/app.css';
const AboutPage = () => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
            navigate('/mainpage');
        }
    };

    const team = [
        {
            name: "Олександр Петренко",
            role: "Засновник & CEO",
            bio: "15+ років досвіду у фінансовому секторі. Експерт з кредитних продуктів.",
            photo: "👨‍💼"
        },
        {
            name: "Марія Іваненко",
            role: "Головний технологічний директор",
            bio: "Спеціаліст з фінтеху та цифрових банкінгових рішень.",
            photo: "👩‍💻"
        },
        {
            name: "Вікторія Сидоренко",
            role: "Кредитний експерт",
            bio: "Допомагає клієнтам знаходити найкращі кредитні рішення.",
            photo: "👩‍💼"
        }
    ];

    // Історія
    const milestones = [
        { year: "2018", event: "Заснування компанії" },
        { year: "2019", event: "Запуск першої версії порталу" },
        { year: "2020", event: "Досягли 10 000 користувачів" },
        { year: "2022", event: "Партнерство з 20+ банками" },
        { year: "2023", event: "Запуск мобільного додатку" }
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
                    <li><Link to="/sign_up">Реєстрація</Link></li>
                    <li><Link to="/profile">Профіль</Link></li>
                    <li><Link to="/portfolio">Портфоліо</Link></li>
                    <li><button onClick={handleLogout} className="logout">Вихід</button></li>
                </ul>
            </nav>
            
            
            <main>
                <section className="mission-section">
                    <div className="mission-content">
                        <h2>Наша місія</h2>
                        <p className="mission-statement">
                            Ми віримо, що кожен має право на доступні та зрозумілі кредитні рішення. 
                            Наша мета - зробити процес пошуку та оформлення кредиту максимально прозорим, 
                            зручним і вигідним для клієнта.
                        </p>
                        <div className="values-grid">
                            <div className="value-card">
                                <h3>Прозорість</h3>
                                <p>Жодних прихованих комісій чи умов</p>
                            </div>
                            <div className="value-card">
                                <h3>Незалежність</h3>
                                <p>Ми не належимо жодному банку</p>
                            </div>
                            <div className="value-card">
                                <h3>Інновації</h3>
                                <p>Постійно вдосконалюємо наш сервіс</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="team-section">
                    <h2>Наша команда</h2>
                    <p className="section-subtitle">Професіонали, які стоять за вашим зручним кредитуванням</p>
                    <div className="team-grid">
                        {team.map((member, index) => (
                            <div key={index} className="team-card">
                                <div className="team-photo">{member.photo}</div>
                                <h3>{member.name}</h3>
                                <p className="team-role">{member.role}</p>
                                <p className="team-bio">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="history-section">
                    <h2>Наша історія</h2>
                    <div className="timeline">
                        {milestones.map((item, index) => (
                            <div key={index} className="timeline-item">
                                <div className="timeline-year">{item.year}</div>
                                <div className="timeline-event">{item.event}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="principles-section">
                    <h2>Як ми працюємо</h2>
                    <div className="principles-grid">
                        <div className="principle-card">
                            <div className="principle-number">1</div>
                            <h3>Аналізуємо</h3>
                            <p>Збираємо всі доступні кредитні пропозиції на ринку</p>
                        </div>
                        <div className="principle-card">
                            <div className="principle-number">2</div>
                            <h3>Фільтруємо</h3>
                            <p>Відбираємо лише надійні фінансові установи</p>
                        </div>
                        <div className="principle-card">
                            <div className="principle-number">3</div>
                            <h3>Порівнюємо</h3>
                            <p>Знаходимо оптимальні умови для вашого випадку</p>
                        </div>
                        <div className="principle-card">
                            <div className="principle-number">4</div>
                            <h3>Рекомендуємо</h3>
                            <p>Надаємо персоналізовані пропозиції</p>
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

export default AboutPage;