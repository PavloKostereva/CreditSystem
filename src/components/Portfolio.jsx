import React, { useState, useEffect } from 'react';
import '../css/portfolio.css';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import privatLogo from '../img/privat.png';
import monoLogo from '../img/mono.png';
import oschadLogo from '../img/oshhadbank.png';

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

const Portfolio = () => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logger.log('Користувач ініціював вихід');
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
            logger.log('Користувач підтвердив вихід');
            navigate('/mainpage');
        } else {
            logger.log('Користувач скасував вихід');
        }
    };

    const [loanLimit, setLoanLimit] = useState(2);
    const [activeLoans, setActiveLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [portfolioSummary, setPortfolioSummary] = useState({
        totalDebt: 0,
        avgInterestRate: 0,
        nextPayment: '-',
        totalLoans: 0,
        creditScore: 0
    });
    const [editMode, setEditMode] = useState(false);
    const [editedAmount, setEditedAmount] = useState(0);
    const [editedTerm, setEditedTerm] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [newLimit, setNewLimit] = useState(2);

    useEffect(() => {
        const fetchLoans = async () => {
            logger.log('Початок завантаження кредитів');
            try {
                const querySnapshot = await getDocs(collection(db, 'userLoans'));
                const loansData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                logger.log('Кредити успішно отримано', { count: loansData.length, loanIds: loansData.map(l => l.id) });
                setActiveLoans(loansData);
                calculateSummary(loansData);
                setLoading(false);
            } catch (err) {
                logger.error('Помилка завантаження кредитів', err);
                setError("Не вдалося завантажити кредити");
                setLoading(false);
            }
        };

        fetchLoans();
    }, []);

    const handleCloseSpecificLoan = async (loanId) => {
        logger.log('Ініціація погашення кредиту', { loanId });
        if (window.confirm(`Ви дійсно хочете погасити цей кредит? Ця дія незворотня.`)) {
            try {
                await deleteDoc(doc(db, 'userLoans', loanId));
                const updatedLoans = activeLoans.filter(loan => loan.id !== loanId);
                logger.log('Кредит успішно погашено', { loanId });
                setActiveLoans(updatedLoans);
                calculateSummary(updatedLoans);
                if (selectedLoan?.id === loanId) {
                    setSelectedLoan(null);
                    logger.log('Скинуто вибраний кредит після погашення', { loanId });
                }
                alert("Кредит успішно погашено!");
            } catch (err) {
                logger.error('Помилка погашення кредиту', err);
                setError("Не вдалося погасити кредит");
            }
        } else {
            logger.log('Погашення кредиту скасовано', { loanId });
        }
    };

    const handleEditSpecificLoan = (loan) => {
        logger.log('Початок редагування умов кредиту', { loanId: loan.id });
        setSelectedLoan(loan);
        setEditedAmount(loan.amount);
        setEditedTerm(loan.term);
        setEditMode(true);
    };

    const calculateNextPayment = (loans) => {
        if (loans.length === 0) return '-';
        
        const now = new Date();
        const nextPayments = loans.map(loan => {
            const takenDate = loan.takenDate?.toDate ? loan.takenDate.toDate() : new Date(loan.takenDate);
            const nextPaymentDate = new Date(takenDate);
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (loan.paidMonths || 0) + 1);
            
            return {
                date: nextPaymentDate,
                amount: Math.round(
                    (loan.amount * loan.interestRate / 100 / 12) + 
                    (loan.amount / loan.term)
                )
            };
        });
    
        nextPayments.sort((a, b) => a.date - b.date);
        const nearestPayment = nextPayments[0];

        if (nearestPayment.date < now) return 'Прострочено';

        const formattedDate = nearestPayment.date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        return `${nearestPayment.amount.toLocaleString()} грн (${formattedDate})`;
    };

    const calculateSummary = (loans) => {
        logger.log('Розрахунок підсумків портфоліо', { loanCount: loans.length });
        if (loans.length === 0) {
            setPortfolioSummary({
                totalDebt: 0,
                avgInterestRate: 0,
                nextPayment: '-',
                totalLoans: 0,
                creditScore: calculateCreditScore([], loanLimit)
            });
            return;
        }

        const totalDebt = loans.reduce((sum, loan) => sum + loan.amount, 0);
        const totalInterest = loans.reduce((sum, loan) => sum + loan.interestRate, 0);
        const avgInterestRate = (totalInterest / loans.length).toFixed(2);
        
        setPortfolioSummary({
            totalDebt,
            avgInterestRate,
            nextPayment: calculateNextPayment(loans),
            totalLoans: loans.length,
            creditScore: calculateCreditScore(loans, loanLimit)
        });
        logger.log('Підсумки портфоліо оновлено', { totalDebt, avgInterestRate, totalLoans: loans.length });
    };

    const calculateCreditScore = (loans, limit) => {
        const baseScore = 600;
        const loanUtilization = loans.length / limit;
        const interestImpact = loans.reduce((sum, loan) => sum + loan.interestRate, 0) / Math.max(loans.length, 1);
        
        const score = Math.max(
            300,
            baseScore - (loanUtilization * 100) - (interestImpact * 2)
        ).toFixed(0);
        
        logger.log('Розраховано кредитний рейтинг', { score, loanUtilization, interestImpact });
        return score;
    };

    const handleUpdateLoan = async () => {
        logger.log('Ініціація оновлення умов кредиту', { loanId: selectedLoan.id, editedAmount, editedTerm });
        if (activeLoans.length >= loanLimit) {
            logger.log('Досягнуто ліміт кредитів', { loanLimit, activeLoans: activeLoans.length });
            alert(`Ви досягли максимальної кількості кредитів (${loanLimit}). Спростіть існуючі кредити перед зміною умов.`);
            return;
        }

        try {
            const amountChange = editedAmount - selectedLoan.amount;
            const interestChange = amountChange > 0 ? amountChange / 2000 : 0;
            
            await updateDoc(doc(db, 'userLoans', selectedLoan.id), {
                amount: editedAmount,
                term: editedTerm,
                interestRate: selectedLoan.interestRate + interestChange
            });

            const updatedLoans = activeLoans.map(loan => 
                loan.id === selectedLoan.id ? { 
                    ...loan, 
                    amount: editedAmount,
                    term: editedTerm,
                    interestRate: loan.interestRate + interestChange
                } : loan
            );

            setActiveLoans(updatedLoans);
            calculateSummary(updatedLoans);
            setEditMode(false);
            logger.log('Умови кредиту успішно оновлено', { loanId: selectedLoan.id });
            alert("Умови кредиту успішно оновлено!");
        } catch (err) {
            logger.error('Помилка оновлення умов кредиту', err);
            setError("Не вдалося оновити кредит");
        }
    };

    const handleCloseLoan = async () => {
        logger.log('Ініціація погашення вибраного кредиту', { loanId: selectedLoan.id });
        if (window.confirm(`Ви дійсно хочете погасити кредит ${selectedLoan.id}? Ця дія незворотня.`)) {
            try {
                await deleteDoc(doc(db, 'userLoans', selectedLoan.id));
                const updatedLoans = activeLoans.filter(loan => loan.id !== selectedLoan.id);
                logger.log('Вибраний кредит успішно погашено', { loanId: selectedLoan.id });
                setActiveLoans(updatedLoans);
                calculateSummary(updatedLoans);
                setSelectedLoan(null);
                alert("Кредит успішно погашено!");
            } catch (err) {
                logger.error('Помилка погашення вибраного кредиту', err);
                setError("Не вдалося погасити кредит");
            }
        } else {
            logger.log('Погашення вибраного кредиту скасовано', { loanId: selectedLoan.id });
        }
    };

    const handleLimitChange = () => {
        logger.log('Ініціація зміни кредитного ліміту', { newLimit, currentLimit: loanLimit });
        if (newLimit < 1 || newLimit > 5) {
            logger.log('Невалідний кредитний ліміт', { newLimit });
            alert("Ліміт має бути від 1 до 5 кредитів");
            return;
        }

        if (newLimit >= activeLoans.length) {
            setLoanLimit(newLimit);
            setShowLimitModal(false);
            calculateSummary(activeLoans);
            logger.log('Кредитний ліміт успішно змінено', { newLimit });
            alert(`Кредитний ліміт успішно змінено на ${newLimit}`);
        } else {
            logger.log('Невалідна зміна ліміту: ліміт менший за кількість кредитів', { newLimit, activeLoans: activeLoans.length });
            alert(`Новий ліміт (${newLimit}) не може бути меншим за поточну кількість кредитів (${activeLoans.length})`);
        }
    };

    const getLimitStatusClass = () => {
        const status = activeLoans.length >= loanLimit ? 'limit-reached' : '';
        logger.log('Перевірка статусу ліміту', { status, activeLoans: activeLoans.length, loanLimit });
        return status;
    };

    if (loading) {
        logger.log('Відображення стану завантаження портфоліо');
        return <div className="loading">Завантаження даних...</div>;
    }
    if (error) {
        logger.log('Відображення помилки портфоліо', { error });
        return <div className="error">{error}</div>;
    }

    logger.log('Відображення портфоліо', { loanCount: activeLoans.length, creditScore: portfolioSummary.creditScore });

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
                    <li><Link to="/home" onClick={() => logger.log('Перехід на сторінку всіх кредитів')}>Всі кредити</Link></li>
                    <li><Link to="/calculator" onClick={() => logger.log('Перехід на сторінку калькулятора')}>Калькулятор</Link></li>
                    <li><Link to="/sign_up" onClick={() => logger.log('Перехід на сторінку реєстрації')}>Реєстрація</Link></li>
                    <li><Link to="/profile" onClick={() => logger.log('Перехід на сторінку профілю')}>Профіль</Link></li>
                    <li><Link to="/portfolio" onClick={() => logger.log('Перехід на сторінку портфоліо')}>Портфоліо</Link></li>
                    <li><button onClick={handleLogout} className="logout">Вихід</button></li>
                </ul>
            </nav>
            
            <main>
                <section className="hero">
                    <h2>Моє кредитне портфоліо</h2>
                    <p>Кредитний рейтинг: <strong>{portfolioSummary.creditScore}</strong></p>
                </section>

                <section className="portfolio-stats">
                    <div className="stat-card">
                        <h3>Загальна заборгованість</h3>
                        <p>{portfolioSummary.totalDebt.toLocaleString()} грн</p>
                    </div>
                    <div className="stat-card">
                        <h3>Середня ставка</h3>
                        <p>{portfolioSummary.avgInterestRate}%</p>
                    </div>
                    <div className={`stat-card ${getLimitStatusClass()}`}>
                        <h3>Кількість кредитів</h3>
                        <p>
                            {activeLoans.length}/{loanLimit}
                            {activeLoans.length >= loanLimit && (
                                <span className="limit-warning"> (Ліміт досягнуто!)</span>
                            )}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3>Наступний платіж</h3>
                        <p>{portfolioSummary.nextPayment}</p>
                    </div>
                </section>

                <section className="loans-section">
                    <div className="section-header">
                        <h3>Поточні кредити</h3>
                        <button 
                            onClick={() => {
                                logger.log('Відкриття модального вікна для зміни ліміту');
                                setShowLimitModal(true);
                            }}
                            className="btn-limit"
                        >
                            Змінити ліміт
                        </button>
                    </div>

                    {activeLoans.length === 0 ? (
                        <p className="empty-message">У вас немає активних кредитів</p>
                    ) : (
                        <div className="loans-grid">
                            {activeLoans.map(loan => (
                                <div 
                                    key={loan.id}
                                    className={`loan-card ${selectedLoan?.id === loan.id ? 'selected' : ''}`}
                                >
                                    <h4>{loan.bankName || loan.lenderName || `Кредит #${loan.id}`}</h4>
                                    <div className="loan-details">
                                        <p>Сума: <strong>{loan.amount.toLocaleString()} грн</strong></p>
                                        <p>Ставка: <strong>{loan.interestRate}%</strong></p>
                                        <p>Термін: <strong>{loan.term} міс.</strong></p>
                                        <p>Платіж: <strong>{
                                            Math.round(
                                                (loan.amount * loan.interestRate / 100 / 12) + 
                                                (loan.amount / loan.term)
                                            ).toLocaleString()
                                        } грн/міс</strong></p>
                                    </div>
                                    <div className="loan-actions">
                                        <button 
                                            onClick={() => handleEditSpecificLoan(loan)}
                                            className="btn-edit"
                                        >
                                            Змінити умови
                                        </button>
                                        <button 
                                            onClick={() => handleCloseSpecificLoan(loan.id)}
                                            className="btn-close"
                                        >
                                            Погасити кредит
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {selectedLoan && (
                    <section className="loan-management">
                        <h3>Управління кредитом</h3>
                        
                        {editMode ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Нова сума (грн)</label>
                                    <input
                                        type="number"
                                        value={editedAmount}
                                        onChange={(e) => {
                                            setEditedAmount(Number(e.target.value));
                                            logger.log('Оновлення суми кредиту в режимі редагування', { loanId: selectedLoan.id, newAmount: e.target.value });
                                        }}
                                        min="1000"
                                        step="500"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Новий термін (міс.)</label>
                                    <input
                                        type="number"
                                        value={editedTerm}
                                        onChange={(e) => {
                                            setEditedTerm(Number(e.target.value));
                                            logger.log('Оновлення терміну кредиту в режимі редагування', { loanId: selectedLoan.id, newTerm: e.target.value });
                                        }}
                                        min="1"
                                        max="120"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Нова ставка (%)</label>
                                    <input
                                        type="text"
                                        value={(
                                            selectedLoan.interestRate + 
                                            ((editedAmount - selectedLoan.amount) / 2000)
                                        ).toFixed(2)}
                                        readOnly
                                    />
                                    <small>Змінюється автоматично при збільшенні суми</small>
                                </div>
                                <div className="form-actions">
                                    <button onClick={handleUpdateLoan} className="btn-primary">
                                        Зберегти зміни
                                    </button>
                                    <button 
                                        onClick={() => {
                                            logger.log('Скасування редагування умов кредиту', { loanId: selectedLoan.id });
                                            setEditMode(false);
                                        }} 
                                        className="btn-secondary"
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="management-actions">
                                <div className="loan-info">
                                    <h4>Деталі кредиту</h4>
                                    <p>Залишок: {selectedLoan.amount.toLocaleString()} грн</p>
                                    <p>Сплачено: {(
                                        selectedLoan.amount - 
                                        (selectedLoan.amount / selectedLoan.term) * 
                                        (selectedLoan.term - selectedLoan.paidMonths || 0)
                                    ).toLocaleString()} грн</p>
                                </div>
                                <div className="action-buttons">
                                    <button 
                                        onClick={() => {
                                            setEditedAmount(selectedLoan.amount);
                                            setEditedTerm(selectedLoan.term);
                                            setEditMode(true);
                                            logger.log('Перехід до режиму редагування умов кредиту', { loanId: selectedLoan.id });
                                        }}
                                        className="btn-primary"
                                    >
                                        Змінити умови
                                    </button>
                                    <button 
                                        onClick={handleCloseLoan}
                                        className="btn-danger"
                                    >
                                        Погасити кредит
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <section className="portfolio-analysis">
                    <h3>Аналіз вашого портфоліо</h3>
                    <div className="analysis-content">
                        <div className="chart-placeholder">
                            <p>За бажанням ви можете замовити додатковий функціонал, який допоможе вам переглядати<br></br> статистику взятих кредитів, а також будувати потрібні графіки для її перегляду, за бажанням<br></br>ви можете звернутися до технічної підтримки.</p>
                        </div>
                        <div className="recommendations">
                            <h4>Рекомендації</h4>
                            <ul>
                                {portfolioSummary.creditScore < 500 && (
                                    <li className="warning">Ваш кредитний рейтинг низький. Утримайтесь від нових кредитів.</li>
                                )}
                                {activeLoans.length >= loanLimit && (
                                    <li className="warning">Ви використали весь кредитний ліміт.</li>
                                )}
                                {portfolioSummary.avgInterestRate > 20 && (
                                    <li>Погасіть кредити з високою відсотковою ставкою першими.</li>
                                )}
                                <li>Ідеальна кількість кредитів: 2-3 одночасно.</li>
                                <li>Не беріть кредит, якщо не зможете його покрити</li>
                                <li>Банк не бере відповідальності за ваші дії</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="financial-tips">
                    <h2>Фінансові поради</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <h3>Як знизити відсоткову ставку</h3>
                            <ul>
                                <li>Покращіть свій кредитний рейтинг</li>
                                <li>Обговоріть умови з банком</li>
                                <li>Розгляньте рефінансування</li>
                            </ul>
                        </div>
                        <div className="tip-card">
                            <h3>Оптимальне навантаження</h3>
                            <p>Кредитні платежі не повинні перевищувати 30% вашого місячного доходу.</p>
                        </div>
                        <div className="tip-card">
                            <h3>Стратегії погашення</h3>
                            <ul>
                                <li>Метод "сніжної кулі" - спочатку маленькі кредити</li>
                                <li>Метод "лавини" - спочатку кредити з високими ставками</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bank-partners">
                    <h2>Наші банки-партнери</h2>
                    <div className="banks-grid">
                        <div className="bank-card">
                            <img src={privatLogo} alt="ПриватБанк" />
                            <h3>ПриватБанк</h3>
                            <p>Спеціальні умови для наших клієнтів</p>
                        </div>
                        <div className="bank-card">
                            <img src={oschadLogo} alt="Ощадбанк" />
                            <h3>Ощадбанк</h3>
                            <p>Найкращі ставки по іпотеці</p>
                        </div>
                        <div className="bank-card">
                            <img src={monoLogo} alt="Укрексімбанк" />
                            <h3>Укрексімбанк</h3>
                            <p>Вигідні кредити для бізнесу</p>
                        </div>
                    </div>
                </section>

                <section className="faq-section">
                    <h2>Часті запитання</h2>
                    <div className="faq-list">
                        <div className="faq-item">
                            <h3>Як підвищити кредитний рейтинг?</h3>
                            <p>Своєчасно сплачуйте платежі, утримуйтесь від зайвих запитів до бюро кредитних історій, погасіть частину існуючих кредитів.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Що робити, якщо не можу сплатити кредит?</h3>
                            <p>Незабаром зверніться до банку для реструктуризації, розгляньте можливість рефінансування.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Як вибрати оптимальний кредит?</h3>
                            <p>Звертайте увагу не лише на ставку, а й на додаткові комісії, страховки, гнучкість умов.</p>
                        </div>
                    </div>
                </section>

                <section className="testimonials">
                    <h2>Відгуки наших клієнтів</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <p>"Завдяки КредитномуПорталу знайшла кредит на 5% дешевший, ніж пропонували у моєму банку!"</p>
                            <div className="author">- Анна, Київ</div>
                        </div>
                        <div className="testimonial-card">
                            <p>"Зручний кабінет, все наочно. Тепер контролюю всі свої кредити в одному місці."</p>
                            <div className="author">- Олексій, Львів</div>
                        </div>
                    </div>
                </section>
            </main>

            {showLimitModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Зміна кредитного ліміту</h3>
                        <p>Поточний ліміт: {loanLimit} кредитів</p>
                        <div className="form-group">
                            <label>Новий ліміт (1-5):</label>
                            <input
                                type="number"
                                value={newLimit}
                                onChange={(e) => {
                                    setNewLimit(Math.min(Math.max(1, e.target.value), 5));
                                    logger.log('Оновлення нового ліміту в модальному вікні', { newLimit: e.target.value });
                                }}
                                min="1"
                                max="5"
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleLimitChange} className="btn-primary">
                                Підтвердити
                            </button>
                            <button 
                                onClick={() => {
                                    logger.log('Скасування зміни ліміту');
                                    setShowLimitModal(false);
                                }} 
                                className="btn-secondary"
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
};

export default Portfolio;