import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../css/log_in.css';

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

const Log_in = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        logger.log('Початок процесу входу', { email });

        try {
            logger.log('Перевірка існування користувача', { email });
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const errorMsg = 'Користувача з такою поштою не знайдено';
                logger.error(errorMsg, { email });
                setError(errorMsg);
                setLoading(false);
                return;
            }

            const userData = querySnapshot.docs[0].data();
            logger.log('Користувача знайдено', { email, userId: querySnapshot.docs[0].id });
            if (userData.password !== password) {
                const errorMsg = 'Неправильний пароль';
                logger.error(errorMsg, { email });
                setError(errorMsg);
                setLoading(false);
                return;
            }

            const userInfo = {
                id: querySnapshot.docs[0].id,
                email: userData.email,
                fullName: userData.fullName,
                role: userData.role || 'user',
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            logger.log('Успішний вхід, збережено дані користувача', { userId: userInfo.id });
            navigate('/profile');
            logger.log('Перенаправлення на сторінку профілю', { userId: userInfo.id });
        } catch (err) {
            const errorMsg = 'Сталася помилка під час входу';
            logger.error(errorMsg, err);
            setError(errorMsg);
        } finally {
            setLoading(false);
            logger.log('Завершення процесу входу', { email });
        }
    };

    return (
        <div className="log_in-page">
            <header>
                <div className="logo">
                    <h1>КредитнийПортал</h1>
                    <p>Ваш надійний фінансовий помічник</p>
                </div>
            </header>
            <Link 
                to="/" 
                className="back-link"
                onClick={() => logger.log('Перехід на головну зі сторінки входу')}
            >
                ← На головну
            </Link>

            <main>
                <div className="log_in-container">
                    <h2>Вхід в профіль</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form className="log_in-form" onSubmit={handleSubmit}>
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
                            />
                        </div>
                        
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Завантаження...' : 'Увійти'}
                        </button>
                        
                        <div className="sign_up-link">
                            Ще не маєте акаунт? <Link 
                                to="/sign_up"
                                onClick={() => logger.log('Перехід до сторінки реєстрації зі сторінки входу')}
                            >
                                Зареєстуватися
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

export default Log_in;