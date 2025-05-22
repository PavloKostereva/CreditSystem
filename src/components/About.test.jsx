import { render, screen, fireEvent } from '@testing-library/react';
import AboutPage from './AboutPage';
import { useNavigate } from 'react-router-dom';

// Мокуємо react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children }) => <a>{children}</a>,
}));

describe('AboutPage Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders AboutPage component correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо заголовки та основний контент
    expect(screen.getByText('КредитнийПортал')).toBeInTheDocument();
    expect(screen.getByText('Ваш надійний фінансовий помічник')).toBeInTheDocument();
    expect(screen.getByText('Наша місія')).toBeInTheDocument();
    expect(screen.getByText('Наша команда')).toBeInTheDocument();
    expect(screen.getByText('Наша історія')).toBeInTheDocument();
    expect(screen.getByText('Як ми працюємо')).toBeInTheDocument();
    expect(screen.getByText('Вихід')).toBeInTheDocument();
  });

  test('renders navigation links correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо наявність навігаційних посилань
    expect(screen.getByText('Головна')).toBeInTheDocument();
    expect(screen.getByText('Про нас')).toBeInTheDocument();
    expect(screen.getByText('Інструкція')).toBeInTheDocument();
    expect(screen.getByText('Всі кредити')).toBeInTheDocument();
    expect(screen.getByText('Калькулятор')).toBeInTheDocument();
    expect(screen.getByText('Реєстрація')).toBeInTheDocument();
    expect(screen.getByText('Профіль')).toBeInTheDocument();
    expect(screen.getByText('Портфоліо')).toBeInTheDocument();
  });

  test('renders mission section correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо текст місії
    expect(screen.getByText(/Ми віримо, що кожен має право на доступні та зрозумілі кредитні рішення/)).toBeInTheDocument();
    
    // Перевіряємо картки цінностей
    expect(screen.getByText('Прозорість')).toBeInTheDocument();
    expect(screen.getByText('Жодних прихованих комісій чи умов')).toBeInTheDocument();
    expect(screen.getByText('Незалежність')).toBeInTheDocument();
    expect(screen.getByText('Ми не належимо жодному банку')).toBeInTheDocument();
    expect(screen.getByText('Інновації')).toBeInTheDocument();
    expect(screen.getByText('Постійно вдосконалюємо наш сервіс')).toBeInTheDocument();
  });

  test('renders team section correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо відображення членів команди
    expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
    expect(screen.getByText('Засновник & CEO')).toBeInTheDocument();
    expect(screen.getByText('15+ років досвіду у фінансовому секторі. Експерт з кредитних продуктів.')).toBeInTheDocument();
    
    expect(screen.getByText('Марія Іваненко')).toBeInTheDocument();
    expect(screen.getByText('Головний технологічний директор')).toBeInTheDocument();
    expect(screen.getByText('Спеціаліст з фінтеху та цифрових банкінгових рішень.')).toBeInTheDocument();
    
    expect(screen.getByText('Вікторія Сидоренко')).toBeInTheDocument();
    expect(screen.getByText('Кредитний експерт')).toBeInTheDocument();
    expect(screen.getByText('Допомагає клієнтам знаходити найкращі кредитні рішення.')).toBeInTheDocument();
  });

  test('renders history section correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо відображення історії
    expect(screen.getByText('2018')).toBeInTheDocument();
    expect(screen.getByText('Заснування компанії')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('Запуск першої версії порталу')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Досягли 10 000 користувачів')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('Партнерство з 20+ банками')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('Запуск мобільного додатку')).toBeInTheDocument();
  });

  test('renders principles section correctly', () => {
    render(<AboutPage />);
    
    // Перевіряємо принципи роботи
    expect(screen.getByText('Аналізуємо')).toBeInTheDocument();
    expect(screen.getByText('Збираємо всі доступні кредитні пропозиції на ринку')).toBeInTheDocument();
    expect(screen.getByText('Фільтруємо')).toBeInTheDocument();
    expect(screen.getByText('Відбираємо лише надійні фінансові установи')).toBeInTheDocument();
    expect(screen.getByText('Порівнюємо')).toBeInTheDocument();
    expect(screen.getByText('Знаходимо оптимальні умови для вашого випадку')).toBeInTheDocument();
    expect(screen.getByText('Рекомендуємо')).toBeInTheDocument();
    expect(screen.getByText('Надаємо персоналізовані пропозиції')).toBeInTheDocument();
  });

  test('handles logout confirmation', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AboutPage />);
    
    const logoutButton = screen.getByText('Вихід');
    fireEvent.click(logoutButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).toHaveBeenCalledWith('/mainpage');
  });

  test('does not navigate if logout is cancelled', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AboutPage />);
    
    const logoutButton = screen.getByText('Вихід');
    fireEvent.click(logoutButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('renders footer correctly', () => {
    render(<AboutPage />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} КредитнийПортал`)).toBeInTheDocument();
    expect(screen.getByText('Контакти: info@kreditnyportal.ua')).toBeInTheDocument();
  });
});