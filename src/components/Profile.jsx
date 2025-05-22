import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import '../css/profile.css';
import defaultAvatar from '../img/default-avatar.png';

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

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [userLoans, setUserLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (!localUser || !localUser.id) {
                logger.log('Користувач не авторизований - перенаправлення на сторінку входу');
                navigate('/log_in');
                return;
            }

            logger.log('Початок завантаження даних профілю', { userId: localUser.id });

            try {
                const userRef = doc(db, 'users', localUser.id);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    logger.log('Дані користувача успішно отримані', { 
                        userId: localUser.id,
                        data: userSnap.data() 
                    });
                    setUserData(userSnap.data());
                    const loansQuery = query(
                        collection(db, 'userLoans'),
                        where('userId', '==', localUser.id)
                    );
                    const loansSnapshot = await getDocs(loansQuery);
                    const loansData = loansSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    logger.log('Кредити користувача отримано', {
                        count: loansData.length,
                        loans: loansData.map(l => l.id)
                    });
                    setUserLoans(loansData);
                } else {
                    const errorMsg = 'Користувача не знайдено в базі даних';
                    logger.error(errorMsg, { userId: localUser.id });
                    setError(errorMsg);
                }
            } catch (err) {
                const errorMsg = 'Не вдалося завантажити дані користувача';
                logger.error(errorMsg, err);
                setError(errorMsg);
            } finally {
                setLoading(false);
                logger.log('Завершено завантаження профілю');
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        logger.log('Користувач вийшов з системи', { 
            userId: JSON.parse(localStorage.getItem('user'))?.id 
        });
        localStorage.removeItem('user');
        navigate('/log_in');
    };

    if (loading) {
        logger.log('Відображення стану завантаження профілю');
        return <p className="loading">Завантаження профілю...</p>;
    }
    
    if (error) {
        logger.log('Відображення помилки профілю', { error });
        return <p className="error">{error}</p>;
    }

    logger.log('Відображення профілю користувача', { 
        userId: JSON.parse(localStorage.getItem('user'))?.id,
        userData 
    });

    return (
        <div className="profile-page">
            <header>
                <div className="logo">
                    <Link 
                        to="/" 
                        className="back-link"
                        onClick={() => logger.log('Перехід на головну з профілю')}
                    >
                        ← На головну
                    </Link>
                    <h1>КредитнийПортал</h1>
                    <p>Ваш надійний фінансовий помічник</p>
                </div>
            </header>

            <main>
                <div className="profile-container">
                    <div className="profile-header">
                        <img 
                            src={defaultAvatar} 
                            alt="Аватар користувача" 
                            className="profile-avatar"
                        />
                        <h2>Мій профіль</h2>
                        <button 
                            className="logout-btn" 
                            onClick={handleLogout}
                        >
                            Вийти
                        </button>
                    </div>
                    
                    <div className="profile-info">
                        <div className="info-row">
                            <span className="info-label">Повне ім'я:</span>
                            <span className="info-value">{userData.fullName || 'Не вказано'}</span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">Електронна пошта:</span>
                            <span className="info-value">{userData.email}</span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">Телефон:</span>
                            <span className="info-value">{userData.phone || 'Не вказано'}</span>
                        </div>
                        
                        <div className="info-row">
                            <span className="info-label">Кількість кредитів:</span>
                            <span className="info-value">{userLoans.length}</span>
                        </div>
                    </div>

                    <div className="portfolio-section">
                        <h3>Бажаєте переглянути своє кредитне портфоліо?</h3>
                        <p>У вашому особистому кабінеті ви можете переглянути всі ваші кредити та їх статуси.</p>
                        <Link 
                            to="/portfolio" 
                            className="btn portfolio-btn"
                            onClick={() => logger.log('Перехід до портфоліо з профілю')}
                        >
                            Перейти до портфоліо
                        </Link>
                    </div>
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

export default Profile;