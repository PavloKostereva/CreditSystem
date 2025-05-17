import React, { useState, useEffect } from 'react';
import '../css/calculator.css';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
const Calculator = () => {

    const navigate = useNavigate();
    
    const handleLogout = () => {
        const confirmLogout = window.confirm("Ви точно хочете вийти?");
        if (confirmLogout) {
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
    const [loanLimit, setLoanLimit] = useState(2);

    useEffect(() => {
        const fetchAllCredits = async () => {
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
            } catch (error) {
                console.error("Помилка завантаження кредитів:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCredits();
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

    const handleSelectLoan = async (e) => {
        e.preventDefault();
        if (!loanChoice) {
            alert("Будь ласка, введіть ID кредиту");
            return;
        }

        try {
            const userLoansQuery = await getDocs(collection(db, 'userLoans'));
            if (userLoansQuery.size >= loanLimit) {
                alert(`Ви досягли максимальної кількості кредитів (${loanLimit}). Спростіть існуючі кредити перед оформленням нового.`);
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

            await addDoc(collection(db, 'userLoans'), {
                amount: selectedLoan.amount,
                bankName: selectedLoan.type === 'bank' ? selectedLoan.bankName || selectedLoan.creditName : "",
                interestRate: selectedLoan.interestRate,
                lenderName: selectedLoan.type === 'private' ? selectedLoan.lenderName : "",
                loanId: selectedLoan.id,
                loanType: selectedLoan.type,
                monthlyPayment: monthlyPayment,
                paidMonths: 0,
                status: 'active',
                takenDate: new Date().toISOString(),
                term: selectedLoan.term,
                userId: "" 
            });
            alert("Кредит успішно додано!");
        } catch (error) {
            console.error("Помилка Firebase:", error);
            alert(`Помилка: ${error.message}`);
        }
    };

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