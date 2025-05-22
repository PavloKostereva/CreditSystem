import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import '../css/sign_up.css';

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

const Sign_up = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        logger.log('Початок процесу реєстрації', { email });

        try {
            logger.log('Перевірка існування email', { email });
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const errorMsg = 'Ця електронна пошта вже використовується';
                logger.error(errorMsg, { email });
                setError(errorMsg);
                setLoading(false);
                return;
            }

            logger.log('Створення нового користувача', { email, fullName, phone });
            await addDoc(collection(db, 'users'), {
                email: email,
                fullName: fullName,
                phone: phone,
                password: password,
                createdAt: new Date().toISOString(),
                role: 'user'
            });

            logger.log('Реєстрація успішна', { email });
            navigate('/');
            logger.log('Перенаправлення на головну сторінку після реєстрації', { email });
        } catch (err) {
            const errorMsg = 'Сталася помилка під час реєстрації';
            logger.error(errorMsg, err);
            setError(errorMsg);
        } finally {
            setLoading(false);
            logger.log('Завершення процесу реєстрації', { email });
        }
    };

    return (
        <div className="signup-page">
            <header>
                <div className="logo">
                    <h1>КредитнийПортал</h1>
                    <p>Ваш надійний фінансовий помічник</p>
                </div>
            </header>
            <Link 
                to="/" 
                className="back-link"
                onClick={() => logger.log('Перехід на головну зі сторінки реєстрації')}
            >
                ← На головну
            </Link>
            
            <main>
                <div className="signup-container">
                    <h2>Реєстрація</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form className="signup-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Електронна пошта</label>
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Введіть вашу пошту" 
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    logger.log('Оновлення поля email', { email: e.target.value });
                                }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Пароль</label>
                            <input 
                                type="password" 
                                id="password" 
                                placeholder="Введіть пароль" 
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    logger.log('Оновлення поля пароля');
                                }}
                                minLength="6"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="fullName">Повне ім'я</label>
                            <input 
                                type="text" 
                                id="fullName" 
                                placeholder="Іван Петренко" 
                                required
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    logger.log('Оновлення поля повного імені', { fullName: e.target.value });
                                }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="phone">Телефон (необов'язково)</label>
                            <input 
                                type="tel" 
                                id="phone" 
                                placeholder="+380 XX XXX XX XX" 
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    logger.log('Оновлення поля телефону', { phone: e.target.value });
                                }}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn"
                            disabled={loading}
                        >
                            {loading ? 'Обробка...' : 'Зареєструватися'}
                        </button>
                        
                        <div className="login-link">
                            Вже маєте акаунт? <Link 
                                to="/log_in"
                                onClick={() => logger.log('Перехід до сторінки входу зі сторінки реєстрації')}
                            >
                                Увійти
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
            
            <footer>
                <p>© {new Date().getFullYear()} КредитнийПортал. Усі права захищені.</p>
                <p>Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67</p>
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
};

export default Sign_up;