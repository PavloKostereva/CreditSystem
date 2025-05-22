import React, { useState, useEffect } from 'react';
import '../css/calculator.css';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Calculator = () => {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
            localStorage.removeItem('user');
            navigate('/mainpage');
        }
    };
    
    const [loanType, setLoanType] = useState('bank-loans');
    const [minAmount, setMinAmount] = useState('');
    const [maxInterest, setMaxInterest] = useState('');
    const [minTerm, setMinTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loanChoice, setLoanChoice] = useState('');
    const [loading, setLoading] = useState(false);
    const [allCredits, setAllCredits] = useState([]);
    const [userLoansCount, setUserLoansCount] = useState(0);
    const [loanLimit] = useState(10);
    const [currentUser, setCurrentUser] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);

        const fetchData = async () => {
            try {
                setLoading(true);
                
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

                setAllCredits([...bankData, ...privateData]);

                if (user && user.id) {
                    const userLoansQuery = query(
                        collection(db, 'userLoans'), 
                        where('userId', '==', user.id)
                    );
                    const userLoansSnapshot = await getDocs(userLoansQuery);
                    setUserLoansCount(userLoansSnapshot.size);
                }
            } catch (error) {
                console.error("Помилка завантаження даних:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const filtered = allCredits.filter(credit => {
                if (loanType === 'bank-loans' && credit.type !== 'bank') return false;
                if (loanType === 'personal-loans' && credit.type !== 'private') return false;
                
                const amountValid = !minAmount || credit.amount >= Number(minAmount);
                const interestValid = !maxInterest || credit.interestRate <= Number(maxInterest);
                const termValid = !minTerm || credit.term >= Number(minTerm);
                
                return amountValid && interestValid && termValid;
            });
            
            setResults(filtered);
        } catch (error) {
            console.error("Помилка пошуку:", error);
            alert("Сталася помилка при пошуку кредитів");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLoan = (e) => {
        e.preventDefault();
        if (!loanChoice) {
            alert("Будь ласка, введіть ID кредиту");
            return;
        }

        const selectedLoan = results.find(loan => loan.id === loanChoice);
        if (!selectedLoan) {
            alert("Кредит з вказаним ID не знайдено");
            return;
        }
        const monthlyInterest = selectedLoan.amount * (selectedLoan.interestRate / 100) / 12;
        const monthlyPrincipal = selectedLoan.amount / selectedLoan.term;
        const monthlyPayment = Math.round(monthlyInterest + monthlyPrincipal);

        setSelectedLoanDetails({
            ...selectedLoan,
            monthlyPayment: monthlyPayment,
            totalPayment: monthlyPayment * selectedLoan.term
        });

        setShowConfirmation(true);
    };

    const confirmLoan = async () => {
        try {
            if (!currentUser) {
                alert("Будь ласка, увійдіть в систему для оформлення кредиту");
                navigate('/log_in');
                return;
            }

            if (userLoansCount >= loanLimit) {
                alert(`Ви досягли максимальної кількості кредитів (${loanLimit}). Спростіть існуючі кредити перед оформленням нового.`);
                setShowConfirmation(false);
                return;
            }

            const newLoanRef = await addDoc(collection(db, 'userLoans'), {
                amount: selectedLoanDetails.amount,
                bankName: selectedLoanDetails.type === 'bank' ? selectedLoanDetails.bankName || selectedLoanDetails.creditName : "",
                interestRate: selectedLoanDetails.interestRate,
                lenderName: selectedLoanDetails.type === 'private' ? selectedLoanDetails.lenderName : "",
                loanId: selectedLoanDetails.id,
                loanType: selectedLoanDetails.type,
                monthlyPayment: selectedLoanDetails.monthlyPayment,
                paidMonths: 0,
                status: 'active',
                takenDate: new Date().toISOString(),
                term: selectedLoanDetails.term,
                userId: currentUser.id
            });

            const userRef = doc(db, 'users', currentUser.id);
            await updateDoc(userRef, {
                creditIds: arrayUnion(newLoanRef.id)
            });

            setUserLoansCount(prev => prev + 1);
            alert("Кредит успішно додано!");
            setLoanChoice('');
            setShowConfirmation(false);
        } catch (error) {
            console.error("Помилка Firebase:", error);
            alert(`Помилка: ${error.message}`);
            setShowConfirmation(false);
        }
    };

    const cancelLoan = () => {
        setShowConfirmation(false);
        setSelectedLoanDetails(null);
    };

    return (
        <div>
            {showConfirmation && selectedLoanDetails && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Підтвердження кредиту</h3>
                        <div className="loan-details-confirm">
                            <p><strong>Тип кредиту:</strong> {selectedLoanDetails.type === 'bank' ? 'Банківський кредит' : 'Приватний кредит'}</p>
                            <p><strong>{selectedLoanDetails.type === 'bank' ? 'Банк:' : 'Кредитор:'}</strong> {selectedLoanDetails.type === 'bank' ? selectedLoanDetails.bankName || selectedLoanDetails.creditName : selectedLoanDetails.lenderName}</p>
                            <p><strong>Сума кредиту:</strong> {selectedLoanDetails.amount.toLocaleString()} грн</p>
                            <p><strong>Відсоткова ставка:</strong> {selectedLoanDetails.interestRate}%</p>
                            <p><strong>Термін:</strong> {selectedLoanDetails.term} місяців</p>
                            <p><strong>Щомісячний платіж:</strong> {selectedLoanDetails.monthlyPayment} грн</p>
                            <p><strong>Загальна сума до сплати:</strong> {selectedLoanDetails.totalPayment} грн</p>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={cancelLoan} className="btn btn-cancel">Скасувати</button>
                            <button onClick={confirmLoan} className="btn btn-confirm">Підтвердити</button>
                        </div>
                    </div>
                </div>
            )}

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
                <section className="hero">
                    <h2>Кредитний калькулятор</h2>
                    <p>Розрахуйте ваші майбутні виплати за кредитом</p>
                </section>

                <section className="calculator-section">
                    <div className="calculator-form">
                        <h3>Введіть параметри кредиту для пошуку:</h3>
                        <form onSubmit={handleSearch}>
                            <div className="form-group">
                                <label htmlFor="loan-type">Оберіть тип кредиту:</label>
                                <select 
                                    id="loan-type" 
                                    value={loanType} 
                                    onChange={e => setLoanType(e.target.value)}
                                >
                                    <option value="bank-loans">Кредити від банку</option>
                                    <option value="personal-loans">Кредити від фізичних осіб</option>
                                    <option value="all-loans">Всі кредити</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="min-amount">Мінімальна сума (грн):</label>
                                <input 
                                    type="number" 
                                    id="min-amount" 
                                    min="0" 
                                    step="1000" 
                                    value={minAmount} 
                                    onChange={e => setMinAmount(e.target.value)} 
                                    placeholder="Будь-яка сума"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="max-interest">Максимальна ставка (%):</label>
                                <input 
                                    type="number" 
                                    id="max-interest" 
                                    min="0" 
                                    max="100" 
                                    step="0.1" 
                                    value={maxInterest} 
                                    onChange={e => setMaxInterest(e.target.value)} 
                                    placeholder="Будь-яка ставка"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="min-term">Мінімальний термін (міс.):</label>
                                <input 
                                    type="number" 
                                    id="min-term" 
                                    min="1" 
                                    value={minTerm} 
                                    onChange={e => setMinTerm(e.target.value)} 
                                    placeholder="Будь-який термін"
                                />
                            </div>

                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? 'Пошук...' : 'Знайти кредити'}
                            </button>
                        </form>
                    </div>

                    <div className="calculator-results">
                        <h3>Результати пошуку:</h3>
                        <div className="results-list">
                            {loading ? (
                                <p>Завантаження...</p>
                            ) : results.length > 0 ? (
                                <>
                                    <p>Знайдено {results.length} кредитів:</p>
                                    <ul>
                                        {results.map(loan => (
                                            <li key={loan.id}>
                                                <strong>
                                                    {loan.type === 'bank' 
                                                        ? `${loan.bankName} - ${loan.creditName}`
                                                        : `Приватний кредит від ${loan.lenderName}`
                                                    }
                                                </strong>
                                                <div className="loan-details">
                                                    <span>ID: {loan.id}</span>
                                                    <span>  Сума__: {loan.amount.toLocaleString()} грн</span>
                                                    <span>  Ставка: {loan.interestRate}%</span>
                                                    <span>  Термін: {loan.term} міс.</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p>Кредитів за вказаними параметрами не знайдено</p>
                            )}
                        </div>

                        {results.length > 0 && (
                            <>
                                <h3>Оберіть кредит:</h3>
                                <form onSubmit={handleSelectLoan}>
                                    <div className="form-group">
                                        <label htmlFor="loan-choice">Введіть ID кредиту:</label>
                                        <input 
                                            type="text" 
                                            id="loan-choice" 
                                            value={loanChoice} 
                                            onChange={e => setLoanChoice(e.target.value)} 
                                            placeholder="Введіть ID зі списку"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn">Підтвердити вибір</button>
                                </form>
                            </>
                        )}
                    </div>
                </section>

                <section className="calculator-info">
                    <h3>Як працює наш калькулятор?</h3>
                    <div className="info-points">
                        <div className="info-point">
                            <h4>1. Завантаження даних</h4>
                            <p>Усі доступні кредити завантажуються при відкритті сторінки, що дозволяє швидко фільтрувати їх без додаткових запитів до сервера.</p>
                        </div>
                        <div className="info-point">
                            <h4>2. Точний пошук</h4>
                            <p>Фільтрація відбувається за вказаними параметрами: тип кредиту, сума, відсоткова ставка та термін погашення.</p>
                        </div>
                        <div className="info-point">
                            <h4>3. Вибір кредиту</h4>
                            <p>Після пошуку ви можете обрати конкретний кредит за його ID для подальших дій.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <p>© {new Date().getFullYear()} КредитнийПортал. Усі права захищені.</p>
                <p>Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67</p>
            </footer>
        </div>
    );
};

export default Calculator;