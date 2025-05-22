import { render, screen, fireEvent } from '@testing-library/react';
import MainPage, { logger } from './MainPage';
import { useNavigate } from 'react-router-dom';

// Мокуємо react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Мокуємо localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Мокуємо методи для експорту логів
const createElementMock = jest.fn();
const createObjectURLMock = jest.fn();
const revokeObjectURLMock = jest.fn();
Object.defineProperty(document, 'createElement', { value: createElementMock });
Object.defineProperty(window, 'URL', {
  value: { createObjectURL: createObjectURLMock, revokeObjectURL: revokeObjectURLMock },
});

describe('MainPage Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    createElementMock.mockReturnValue({ href: '', click: jest.fn() });
    createObjectURLMock.mockReturnValue('blob://test-log');
    revokeObjectURLMock.mockReset();
  });

  test('renders MainPage component correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('КредитнийПортал')).toBeInTheDocument();
    expect(screen.getByText('Ваш надійний фінансовий помічник')).toBeInTheDocument();
    expect(screen.getByText('Знайдіть ідеальний кредит')).toBeInTheDocument();
    expect(screen.getByText('Актуальні пропозиції від 50+ банків та кредитних спілок України')).toBeInTheDocument();
    expect(screen.getByText('Чому обирають нас?')).toBeInTheDocument();
    expect(screen.getByText('Наші досягнення')).toBeInTheDocument();
    expect(screen.getByText('Що кажуть наші користувачі')).toBeInTheDocument();
    expect(screen.getByText('Наші партнери')).toBeInTheDocument();
    expect(screen.getByText('Вихід')).toBeInTheDocument();
    expect(screen.getByText('Експортувати логи')).toBeInTheDocument();
  });

  test('renders navigation links correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('Головна')).toHaveAttribute('href', '/mainpage');
    expect(screen.getByText('Про нас')).toHaveAttribute('href', '/aboutpage');
    expect(screen.getByText('Інструкція')).toHaveAttribute('href', '/instructionspage');
    expect(screen.getByText('Всі кредити')).toHaveAttribute('href', '/home');
    expect(screen.getByText('Калькулятор')).toHaveAttribute('href', '/calculator');
    expect(screen.getByText('Реєстрація')).toHaveAttribute('href', '/sign_up');
    expect(screen.getByText('Профіль')).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Портфоліо')).toHaveAttribute('href', '/portfolio');
  });

  test('renders benefits section correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('Повна прозорість')).toBeInTheDocument();
    expect(screen.getByText('Жодних прихованих комісій - ви бачите реальну вартість кредиту')).toBeInTheDocument();
    expect(screen.getByText('Швидкий підбір')).toBeInTheDocument();
    expect(screen.getByText('Порівняння 100+ пропозицій за 2 хвилини')).toBeInTheDocument();
    expect(screen.getByText('Надійність')).toBeInTheDocument();
    expect(screen.getByText('Працюємо лише з ліцензованими фінансовими установами')).toBeInTheDocument();
  });

  test('renders stats section correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('15 000+')).toBeInTheDocument();
    expect(screen.getByText('Користувачів')).toBeInTheDocument();
    expect(screen.getByText('₴2.5 млрд')).toBeInTheDocument();
    expect(screen.getByText('Видано кредитів')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Банків-партнерів')).toBeInTheDocument();
    expect(screen.getByText('4.8/5')).toBeInTheDocument();
    expect(screen.getByText('Середня оцінка')).toBeInTheDocument();
  });

  test('renders testimonials section correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('Андрій Коваленко')).toBeInTheDocument();
    expect(screen.getByText('Малий бізнес')).toBeInTheDocument();
    expect(screen.getByText(/Завдяки КредитномуПорталу знайшов вигідний кредит/)).toBeInTheDocument();
    expect(screen.getByText('★★★★★')).toBeInTheDocument();

    expect(screen.getByText('Олена Петренко')).toBeInTheDocument();
    expect(screen.getByText('Фрілансер')).toBeInTheDocument();
    expect(screen.getByText(/Як самозайнятій мені важко було отримати кредит/)).toBeInTheDocument();
    expect(screen.getByText('★★★★☆')).toBeInTheDocument();

    expect(screen.getByText('Віктор Іваненко')).toBeInTheDocument();
    expect(screen.getByText('IT-спеціаліст')).toBeInTheDocument();
    expect(screen.getByText(/Порівняв 12 пропозицій за 5 хвилин/)).toBeInTheDocument();
    expect(screen.getByText('★★★★★')).toBeInTheDocument();
  });

  test('renders partners section correctly', () => {
    render(<MainPage />);
    
    expect(screen.getByText('ПриватБанк')).toBeInTheDocument();
    expect(screen.getByText('Ощадбанк')).toBeInTheDocument();
    expect(screen.getByText('Укрексімбанк')).toBeInTheDocument();
    expect(screen.getByText('КредитМаркет')).toBeInTheDocument();
  });

  test('handles logout confirmation', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MainPage />);
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).toHaveBeenCalledWith('/mainpage');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('User confirmed logout')
    );
  });

  test('does not navigate if logout is cancelled', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<MainPage />);
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('User cancelled logout')
    );
  });

  test('logs navigation link clicks', () => {
    render(<MainPage />);
    
    fireEvent.click(screen.getByText('Калькулятор'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Navigated to Calculator')
    );
    expect(screen.getByText('Калькулятор')).toHaveAttribute('href', '/calculator');
  });

  test('logs CTA button click', () => {
    render(<MainPage />);
    
    fireEvent.click(screen.getByText('Підібрати кредит'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Clicked CTA button')
    );
    expect(screen.getByText('Підібрати кредит')).toHaveAttribute('href', '/calculator');
  });

  test('logs component mount and unmount', () => {
    const { unmount } = render(<MainPage />);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('MainPage component mounted')
    );
    
    unmount();
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('MainPage component unmounted')
    );
  });

  test('exports logs correctly', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['test log 1', 'test log 2']));
    render(<MainPage />);
    
    fireEvent.click(screen.getByText('Експортувати логи'));
    
    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://test-log');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('app_logs');
  });

  test('renders error message on render failure', () => {
    // Мокуємо помилку в рендері
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(React, 'useEffect').mockImplementation(() => {
      throw new Error('Render error');
    });
    
    render(<MainPage />);
    
    expect(screen.getByText('Сталася помилка')).toBeInTheDocument();
    expect(screen.getByText('Будь ласка, спробуйте оновити сторінку або поверніться пізніше.')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Error rendering MainPage')
    );
  });

  test('renders footer correctly', () => {
    render(<MainPage />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} КредитнийПортал`)).toBeInTheDocument();
    expect(screen.getByText('Контакти: info@kreditnyportal.ua')).toBeInTheDocument();
  });
});