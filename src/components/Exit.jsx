import { Link } from 'react-router-dom';
import '../css/app.css';

const Exit = () => {
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
        <section className="hero">
          <h2>Знайдіть ідеальний кредит</h2>
          <p>Актуальні пропозиції від банків та приватних кредиторів</p>
        </section>

      </main>

            <h1>Поставте хорошу оцінку </h1>
            
            
            <footer>
                <p>© {new Date().getFullYear()} КредитнийПортал. Усі права захищені.</p>
                <p>Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67</p>
            </footer>
        </div>
  );
};

export default Exit;