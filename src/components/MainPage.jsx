import { Link } from 'react-router-dom';
import '../css/app.css';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }
}

export const logger = new Logger();

const MainPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    logger.log('MainPage component mounted');
    return () => {
      logger.log('MainPage component unmounted');
    };
  }, []);

  const handleLogout = () => {
    try {
      logger.log('Logout initiated');
      const confirmLogout = window.confirm("Ви точно хочете вийти?");
      if (confirmLogout) {
        logger.log('User confirmed logout');
        navigate('/mainpage');
      } else {
        logger.log('User cancelled logout');
      }
    } catch (error) {
      logger.error('Error during logout process', error);
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

  try {
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
            <li><Link to="/mainpage" onClick={() => logger.log('Navigated to MainPage')}>Головна</Link></li>
            <li><Link to="/aboutpage" onClick={() => logger.log('Navigated to AboutPage')}>Про нас</Link></li>
            <li><Link to="/instructionspage" onClick={() => logger.log('Navigated to InstructionsPage')}>Інструкція</Link></li>
            <li><Link to="/home" onClick={() => logger.log('Navigated to All Credits')}>Всі кредити</Link></li>
            <li><Link to="/calculator" onClick={() => logger.log('Navigated to Calculator')}>Калькулятор</Link></li>
            <li><Link to="/sign_up" onClick={() => logger.log('Navigated to SignUp')}>Реєстрація</Link></li>
            <li><Link to="/profile" onClick={() => logger.log('Navigated to Profile')}>Профіль</Link></li>
            <li><Link to="/portfolio" onClick={() => logger.log('Navigated to Portfolio')}>Портфоліо</Link></li>
            <li><button onClick={handleLogout} className="logout">Вихід</button></li>
          </ul>
        </nav>
        
        <main>
          <section className="hero-banner">
            <div className="hero-content">
              <h2>Знайдіть ідеальний кредит</h2>
              <p>Актуальні пропозиції від 50+ банків та кредитних спілок України</p>
              <Link to="/calculator" className="cta-button" onClick={() => logger.log('Clicked CTA button')}>Підібрати кредит</Link>
            </div>
          </section>
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
          <button 
            onClick={() => logger.exportLogs()}
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
  } catch (error) {
    logger.error('Error rendering MainPage', error);
    return (
      <div className="error-message">
        <h2>Сталася помилка</h2>
        <p>Будь ласка, спробуйте оновити сторінку або поверніться пізніше.</p>
      </div>
    );
  }
};

export default MainPage;