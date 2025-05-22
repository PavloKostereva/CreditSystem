import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Log_in from './Log_in';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

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
  clear: jest.fn(),
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

describe('Log_in Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReset();
    createElementMock.mockReturnValue({ href: '', click: jest.fn() });
    createObjectURLMock.mockReturnValue('blob://test-log');
    revokeObjectURLMock.mockReset();

    // Мок для Firebase getDocs
    getDocs.mockImplementation(async () => ({
      empty: false,
      docs: [
        {
          id: 'user123',
          data: () => ({
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
            role: 'user',
          }),
        },
      ],
    }));

    collection.mockImplementation((db, path) => ({ path }));
    query.mockReturnValue({ path: 'users' });
    where.mockReturnValue({ path: 'users' });
  });

  test('renders Log_in component correctly', () => {
    render(<Log_in />);
    
    expect(screen.getByText('КредитнийПортал')).toBeInTheDocument();
    expect(screen.getByText('Ваш надійний фінансовий помічник')).toBeInTheDocument();
    expect(screen.getByText('Вхід в профіль')).toBeInTheDocument();
    expect(screen.getByText('← На головну')).toBeInTheDocument();
    expect(screen.getByText('Ще не маєте акаунт? Зареєстуватися')).toBeInTheDocument();
    expect(screen.getByText('Експортувати логи')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Увійти'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({
          id: 'user123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'user',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Успішний вхід, збережено дані користувача')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Перенаправлення на сторінку профілю')
      );
    });
  });

  test('displays error for non-existent user', async () => {
    getDocs.mockResolvedValue({ empty: true, docs: [] });
    
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'nonexistent@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Увійти'));

    await waitFor(() => {
      expect(screen.getByText('Користувача з такою поштою не знайдено')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Користувача з такою поштою не знайдено')
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('displays error for incorrect password', async () => {
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByText('Увійти'));

    await waitFor(() => {
      expect(screen.getByText('Неправильний пароль')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Неправильний пароль')
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('displays error for Firebase failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Firebase error'));
    
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Увійти'));

    await waitFor(() => {
      expect(screen.getByText('Сталася помилка під час входу')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Сталася помилка під час входу')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Сталася помилка під час входу'),
        expect.any(Error)
      );
    });
  });

  test('disables submit button during loading', async () => {
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Увійти'));

    expect(screen.getByText('Завантаження...')).toBeDisabled();
  });

  test('logs input changes', () => {
    render(<Log_in />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля email')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля пароля')
    );
  });

  test('navigates to sign-up page', () => {
    render(<Log_in />);
    
    fireEvent.click(screen.getByText('Зареєстуватися'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід до сторінки реєстрації зі сторінки входу')
    );
    expect(screen.getByText('Зареєстуватися')).toHaveAttribute('href', '/sign_up');
  });

  test('navigates to main page', () => {
    render(<Log_in />);
    
    fireEvent.click(screen.getByText('← На головну'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід на головну зі сторінки входу')
    );
    expect(screen.getByText('← На головну')).toHaveAttribute('href', '/');
  });

  test('exports logs correctly', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['test log 1', 'test log 2']));
    render(<Log_in />);
    
    fireEvent.click(screen.getByText('Експортувати логи'));

    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://test-log');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('app_logs');
  });

  test('renders footer correctly', () => {
    render(<Log_in />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} КредитнийПортал. Усі права захищені.`)).toBeInTheDocument();
    expect(screen.getByText('Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67')).toBeInTheDocument();
  });
});