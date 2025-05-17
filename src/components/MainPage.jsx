import { Link } from 'react-router-dom';
import '../css/app.css';
import { useNavigate } from 'react-router-dom';
const MainPage = () => {
        const navigate = useNavigate();
        
        const handleLogout = () => {
            const confirmLogout = window.confirm("Ви точно хочете вийти?");
            if (confirmLogout) {
                navigate('/mainpage');
            }
        };
    const testimonials = [
        {
            name: "Андрій Коваленко",
            role: "Малий бізнес",
            text: "Завдяки КредитномуПорталу знайшов вигідний кредит для розширення кафе. Ставка на 3% нижча, ніж пропонували у моєму банку!",
            rating: 5
        },
        {
            name: "Олена Петренко",
            role: "Фрілансер",
            text: "Як самозайнятій мені важко було отримати кредит. Цей сервіс допоміг знайти пропозицію без офіційного підтвердження доходів.",
            rating: 4
        },
        {
            name: "Віктор Іваненко",
            role: "IT-спеціаліст",
            text: "Порівняв 12 пропозицій за 5 хвилин. Оформив кредит на авто онлайн - без візитів у банк!",
            rating: 5
        }
    ];

    const stats = [
        { value: "15 000+", label: "Користувачів" },
        { value: "₴2.5 млрд", label: "Видано кредитів" },
        { value: "50+", label: "Банків-партнерів" },
        { value: "4.8/5", label: "Середня оцінка" }
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
                {/* Герой-секція */}
                <section className="hero-banner">
                    <div className="hero-content">
                        <h2>Знайдіть ідеальний кредит</h2>
                        <p>Актуальні пропозиції від 50+ банків та кредитних спілок України</p>
                        <Link to="/calculator" className="cta-button">Підібрати кредит</Link>
                    </div>
                </section>

                {/* Секція переваг */}
                <section className="benefits">
                    <h2>Чому обирають нас?</h2>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <div className="icon">💳</div>
                            <h3>Повна прозорість</h3>
                            <p>Жодних прихованих комісій - ви бачите реальну вартість кредиту</p>
                        </div>
                        <div className="benefit-card">
                            <div className="icon">⚡</div>
                            <h3>Швидкий підбір</h3>
                            <p>Порівняння 100+ пропозицій за 2 хвилини</p>
                        </div>
                        <div className="benefit-card">
                            <div className="icon">🛡️</div>
                            <h3>Надійність</h3>
                            <p>Працюємо лише з ліцензованими фінансовими установами</p>
                        </div>
                    </div>
                </section>

                {/* Секція статистики */}
                <section className="stats-section">
                    <h2>Наші досягнення</h2>
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Секція відгуків */}
                <section className="testimonials">
                    <h2>Що кажуть наші користувачі</h2>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="rating">
                                    {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                                </div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="author">
                                    <strong>{testimonial.name}</strong>, {testimonial.role}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Секція партнерів */}
                <section className="partners">
                    <h2>Наші партнери</h2>
                    <div className="partners-logos">
                        <div className="partner-logo">ПриватБанк</div>
                        <div className="partner-logo">Ощадбанк</div>
                        <div className="partner-logo">Укрексімбанк</div>
                        <div className="partner-logo">КредитМаркет</div>
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

export default MainPage;