import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../css/app.css';
import { useNavigate } from 'react-router-dom';
const Home = () => {
  const navigate = useNavigate();
    
  const handleLogout = () => {
      const confirmLogout = window.confirm("Ви точно хочете вийти?");
      if (confirmLogout) {
          navigate('/mainpage');
      }
  };
  const [bankCredits, setBankCredits] = useState([]);
  const [privateCredits, setPrivateCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const bankQuery = await getDocs(collection(db, 'bankCredits'));
        const bankData = bankQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const privateQuery = await getDocs(collection(db, 'privateCredits'));
        const privateData = privateQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBankCredits(bankData);
        setPrivateCredits(privateData);
      } catch (error) {
        console.error("Помилка завантаження даних:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  const handleDetailsClick = (credit) => {
    setSelectedCredit(credit);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCredit(null);
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

        <section className="credit-offers">
          <h3>Кредити від банків</h3>
          {bankCredits.length > 0 ? (
            bankCredits.map(credit => (
              <div key={credit.id} className="offer-card">
                <div className="offer-details">
                  <h4>{credit.creditName}</h4>
                  <p className="bank-name">{credit.bankName}</p>
                  <div className="offer-params">
                    <div>
                      <span>Ставка:</span>
                      <strong>{credit.interestRate}%</strong>
                    </div>
                    <div>
                      <span>Сума:</span>
                      <strong>{credit.amount.toLocaleString()} грн</strong>
                    </div>
                    <div>
                      <span>Термін:</span>
                      <strong>{credit.term} міс.</strong>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn apply-btn"
                  onClick={() => handleDetailsClick(credit)}
                >
                  Детальніше
                </button>
              </div>
            ))
          ) : (
            <p>Наразі немає доступних банківських кредитів</p>
          )}
        </section>

        <section className="credit-offers">
          <h3>Кредити від приватних осіб</h3>
          {privateCredits.length > 0 ? (
            privateCredits.map(credit => (
              <div key={credit.id} className="offer-card">
                <div className="offer-details">
                  <h4>Пропозиція від {credit.lenderName}</h4>
                  <div className="offer-params">
                    <div>
                      <span>Ставка:</span>
                      <strong>{credit.interestRate}%</strong>
                    </div>
                    <div>
                      <span>Сума:</span>
                      <strong>{credit.amount.toLocaleString()} грн</strong>
                    </div>
                    <div>
                      <span>Термін:</span>
                      <strong>{credit.term} міс.</strong>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn apply-btn"
                  onClick={() => handleDetailsClick(credit)}
                >
                  Зв'язатися
                </button>
              </div>
            ))
          ) : (
            <p>Наразі немає пропозицій від приватних осіб</p>
          )}
        </section>
      </main>

{showModal && selectedCredit && (
  <div className="modal-overlay">
    <div className="modal">
      <button className="close-btn" onClick={closeModal}>×</button>
      <h3>{selectedCredit.creditName || `Пропозиція від ${selectedCredit.lenderName}`}</h3>
      <div className="modal-content">
        <p><strong>Банк/Кредитор:</strong> {selectedCredit.bankName || selectedCredit.lenderName}</p>
        <p><strong>Ставка:</strong> {selectedCredit.interestRate}%</p>
        <p><strong>Сума:</strong> {selectedCredit.amount.toLocaleString()} грн</p>
        <p><strong>Термін:</strong> {selectedCredit.term} місяців</p>
        {selectedCredit.description && (
          <p><strong>Опис:</strong> {selectedCredit.description}</p>
        )}
        {selectedCredit.requirements && (
          <p><strong>Вимоги:</strong> {selectedCredit.requirements}</p>
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
        <p>© 2023 КредитнийПортал. Усі права захищені.</p>
        <p>Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67</p>
      </footer>
    </div>
  );
};

export default Home;