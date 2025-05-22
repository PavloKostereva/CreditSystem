import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../css/app.css';

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

const Home = () => {
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

    const [bankCredits, setBankCredits] = useState([]);
    const [privateCredits, setPrivateCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('amount');
    const [sortOrder, setSortOrder] = useState('asc');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [minTerm, setMinTerm] = useState('');
    const [maxTerm, setMaxTerm] = useState('');
    const [minRate, setMinRate] = useState('');
    const [maxRate, setMaxRate] = useState('');

    useEffect(() => {
        const fetchCredits = async () => {
            logger.log('Початок завантаження кредитних пропозицій');
            setLoading(true);
            try {
                const bankQuery = await getDocs(collection(db, 'bankCredits'));
                const bankData = bankQuery.docs.map(doc => ({
                    id: doc.id,
                    type: 'bank',
                    ...doc.data()
                }));
                
                const privateQuery = await getDocs(collection(db, 'privateCredits'));
                const privateData = privateQuery.docs.map(doc => ({
                    id: doc.id,
                    type: 'private',
                    ...doc.data()
                }));

                logger.log('Успішно завантажено пропозиції', {
                    bankCreditsCount: bankData.length,
                    privateCreditsCount: privateData.length
                });
                
                setBankCredits(bankData);
                setPrivateCredits(privateData);
            } catch (error) {
                logger.error('Помилка завантаження кредитних пропозицій', error);
                console.error("Помилка завантаження даних:", error);
            } finally {
                setLoading(false);
                logger.log('Завершення завантаження кредитних пропозицій');
            }
        };

        fetchCredits();
    }, []);

    const handleDetailsClick = (credit) => {
        logger.log('Перегляд деталей кредиту', {
            creditId: credit.id,
            type: credit.type,
            name: credit.creditName || credit.lenderName
        });
        setSelectedCredit(credit);
        setShowModal(true);
    };

    const closeModal = () => {
        logger.log('Закриття модального вікна');
        setShowModal(false);
        setSelectedCredit(null);
    };

    const handleSort = (field) => {
        logger.log('Зміна сортування', { field, currentSortBy: sortBy, currentSortOrder: sortOrder });
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const applyFilters = (credits) => {
        return credits.filter(credit => {
            const matchesSearch = searchTerm === '' || 
                (credit.type === 'bank' 
                    ? (credit.creditName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       credit.bankName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    : credit.lenderName?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesAmount = 
                (minAmount === '' || credit.amount >= Number(minAmount)) && 
                (maxAmount === '' || credit.amount <= Number(maxAmount));

            const matchesTerm = 
                (minTerm === '' || credit.term >= Number(minTerm)) && 
                (maxTerm === '' || credit.term <= Number(maxTerm));

            const matchesRate = 
                (minRate === '' || credit.interestRate >= Number(minRate)) && 
                (maxRate === '' || credit.interestRate <= Number(maxRate));
            
            return matchesSearch && matchesAmount && matchesTerm && matchesRate;
        }).sort((a, b) => {
            if (sortBy === 'amount') {
                return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
            } else if (sortBy === 'term') {
                return sortOrder === 'asc' ? a.term - b.term : b.term - a.term;
            } else if (sortBy === 'rate') {
                return sortOrder === 'asc' ? a.interestRate - b.interestRate : b.interestRate - a.interestRate;
            } else if (sortBy === 'name') {
                const nameA = a.type === 'bank' ? a.creditName || a.bankName : a.lenderName;
                const nameB = b.type === 'bank' ? b.creditName || b.bankName : b.lenderName;
                return sortOrder === 'asc' 
                    ? nameA?.localeCompare(nameB) 
                    : nameB?.localeCompare(nameA);
            }
            return 0;
        });
    };

    const filteredBankCredits = applyFilters(bankCredits);
    const filteredPrivateCredits = applyFilters(privateCredits);

    const resetFilters = () => {
        logger.log('Скидання фільтрів');
        setSearchTerm('');
        setMinAmount('');
        setMaxAmount('');
        setMinTerm('');
        setMaxTerm('');
        setMinRate('');
        setMaxRate('');
        setSortBy('amount');
        setSortOrder('asc');
    };

    if (loading) return <div className="loading">Завантаження даних...</div>;

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
                    <li><Link to="/mainpage" onClick={() => logger.log('Перехід на головну сторінку')}>Головна</Link></li>
                    <li><Link to="/aboutpage" onClick={() => logger.log('Перехід на сторінку "Про нас"')}>Про нас</Link></li>
                    <li><Link to="/instructionspage" onClick={() => logger.log('Перехід на сторінку інструкцій')}>Інструкція</Link></li>
                    <li><Link to="/home" onClick={() => logger.log('Оновлення сторінки всіх кредитів')}>Всі кредити</Link></li>
                    <li><Link to="/calculator" onClick={() => logger.log('Перехід до калькулятора')}>Калькулятор</Link></li>
                    <li><Link to="/sign_up" onClick={() => logger.log('Перехід до сторінки реєстрації')}>Реєстрація</Link></li>
                    <li><Link to="/profile" onClick={() => logger.log('Перехід до профілю')}>Профіль</Link></li>
                    <li><Link to="/portfolio" onClick={() => logger.log('Перехід до портфоліо')}>Портфоліо</Link></li>
                    <li><button onClick={handleLogout} className="logout">Вихід</button></li>
                </ul>
            </nav>

            <main>
                <section className="hero">
                    <h2>Знайдіть ідеальний кредит</h2>
                    <p>Актуальні пропозиції від банків та приватних кредиторів</p>
                </section>

                <section className="filters-section">
                    <h3>Фільтри та сортування</h3>
                    <div className="filters-container">
                        <div className="filter-group">
                            <label htmlFor="search">Пошук:</label>
                            <input
                                type="text"
                                id="search"
                                placeholder="Назва кредиту або кредитора"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    logger.log('Оновлення пошукового запиту', { searchTerm: e.target.value });
                                }}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Сума кредиту (грн):</label>
                            <div className="range-inputs">
                                <input
                                    type="number"
                                    placeholder="Від"
                                    value={minAmount}
                                    onChange={(e) => {
                                        setMinAmount(e.target.value);
                                        logger.log('Оновлення мінімальної суми', { minAmount: e.target.value });
                                    }}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="До"
                                    value={maxAmount}
                                    onChange={(e) => {
                                        setMaxAmount(e.target.value);
                                        logger.log('Оновлення максимальної суми', { maxAmount: e.target.value });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Термін (міс):</label>
                            <div className="range-inputs">
                                <input
                                    type="number"
                                    placeholder="Від"
                                    value={minTerm}
                                    onChange={(e) => {
                                        setMinTerm(e.target.value);
                                        logger.log('Оновлення мінімального терміну', { minTerm: e.target.value });
                                    }}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="До"
                                    value={maxTerm}
                                    onChange={(e) => {
                                        setMaxTerm(e.target.value);
                                        logger.log('Оновлення максимального терміну', { maxTerm: e.target.value });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Ставка (%):</label>
                            <div className="range-inputs">
                                <input
                                    type="number"
                                    placeholder="Від"
                                    value={minRate}
                                    onChange={(e) => {
                                        setMinRate(e.target.value);
                                        logger.log('Оновлення мінімальної ставки', { minRate: e.target.value });
                                    }}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="До"
                                    value={maxRate}
                                    onChange={(e) => {
                                        setMaxRate(e.target.value);
                                        logger.log('Оновлення максимальної ставки', { maxRate: e.target.value });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Сортувати за:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    logger.log('Оновлення критерію сортування', { sortBy: e.target.value });
                                }}
                            >
                                <option value="name">Назвою</option>
                                <option value="amount">Сумою</option>
                                <option value="term">Терміном</option>
                                <option value="rate">Ставкою</option>
                            </select>
                            <select
                                value={sortOrder}
                                onChange={(e) => {
                                    setSortOrder(e.target.value);
                                    logger.log('Оновлення порядку сортування', { sortOrder: e.target.value });
                                }}
                            >
                                <option value="asc">За зростанням</option>
                                <option value="desc">За спаданням</option>
                            </select>
                        </div>

                        <button onClick={resetFilters} className="btn reset-btn">
                            Скинути фільтри
                        </button>
                    </div>
                </section>
        <section className="credit-offers">
          <div className="section-header">
            <h3>Кредити від банків</h3>
            <span className="results-count">{filteredBankCredits.length} пропозицій</span>
          </div>
          {filteredBankCredits.length > 0 ? (
            <div className="offers-grid">
              {filteredBankCredits.map(credit => (
                <div key={credit.id} className="offer-card">
                  <div className="offer-header">
                    <h4>{credit.creditName}</h4>
                    <p className="bank-name">{credit.bankName}</p>
                  </div>
                  <div className="offer-details">
                    <div className="offer-param">
                      <span>Ставка:</span>
                      <strong>{credit.interestRate}%</strong>
                    </div>
                    <div className="offer-param">
                      <span>Сума:</span>
                      <strong>{credit.amount.toLocaleString()} грн</strong>
                    </div>
                    <div className="offer-param">
                      <span>Термін:</span>
                      <strong>{credit.term} міс.</strong>
                    </div>
                  </div>
                  <button 
                    className="btn apply-btn"
                    onClick={() => handleDetailsClick(credit)}
                  >
                    Детальніше
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">Наразі немає доступних банківських кредитів за обраними критеріями</p>
          )}
        </section>

        <section className="credit-offers">
          <div className="section-header">
            <h3>Кредити від приватних осіб</h3>
            <span className="results-count">{filteredPrivateCredits.length} пропозицій</span>
          </div>
          {filteredPrivateCredits.length > 0 ? (
            <div className="offers-grid">
              {filteredPrivateCredits.map(credit => (
                <div key={credit.id} className="offer-card">
                  <div className="offer-header">
                    <h4>Пропозиція від {credit.lenderName}</h4>
                    <p className="lender-type">Приватний кредитор</p>
                  </div>
                  <div className="offer-details">
                    <div className="offer-param">
                      <span>Ставка:</span>
                      <strong>{credit.interestRate}%</strong>
                    </div>
                    <div className="offer-param">
                      <span>Сума:</span>
                      <strong>{credit.amount.toLocaleString()} грн</strong>
                    </div>
                    <div className="offer-param">
                      <span>Термін:</span>
                      <strong>{credit.term} міс.</strong>
                    </div>
                  </div>
                  <button 
                    className="btn apply-btn"
                    onClick={() => handleDetailsClick(credit)}
                  >
                    Зв'язатися
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">Наразі немає пропозицій від приватних осіб за обраними критеріями</p>
          )}
        </section>
      </main>

      {showModal && selectedCredit && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-btn" onClick={closeModal}>×</button>
            <h3>{selectedCredit.creditName || `Пропозиція від ${selectedCredit.lenderName}`}</h3>
            <div className="modal-content">
              <div className="modal-row">
                <span className="modal-label">Банк/Кредитор:</span>
                <span className="modal-value">{selectedCredit.bankName || selectedCredit.lenderName}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Ставка:</span>
                <span className="modal-value">{selectedCredit.interestRate}%</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Сума:</span>
                <span className="modal-value">{selectedCredit.amount.toLocaleString()} грн</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Термін:</span>
                <span className="modal-value">{selectedCredit.term} місяців</span>
              </div>
              {selectedCredit.description && (
                <div className="modal-row">
                  <span className="modal-label">Опис:</span>
                  <span className="modal-value">{selectedCredit.description}</span>
                </div>
              )}
              {selectedCredit.requirements && (
                <div className="modal-row">
                  <span className="modal-label">Вимоги:</span>
                  <span className="modal-value">{selectedCredit.requirements}</span>
                </div>
              )}
            </div>
            <Link
              to={{
                pathname: "/calculator",
                state: {
                  prefillData: {
                    amount: selectedCredit.amount,
                    term: selectedCredit.term,
                    rate: selectedCredit.interestRate
                  }
                }
              }}
              className="btn primary-btn"
            >
              {selectedCredit.bankName ? 'Подати заявку' : 'Зв\'язатися'}
            </Link>
          </div>
        </div>
      )}

      <footer>
        <p>© {new Date().getFullYear()} КредитнийПортал. Усі права захищені.</p>
        <p>Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67</p>
      </footer>
    </div>
  );
};

export default Home;