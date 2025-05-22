import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sign_up from './Sign_up';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
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

describe('Sign_up Component', () => {
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
    getDocs.mockResolvedValue({ empty: true, docs: [] });
    addDoc.mockResolvedValue({ id: 'user123' });

    collection.mockImplementation((db, path) => ({ path }));
    query.mockReturnValue({ path: 'users' });
    where.mockReturnValue({ path: 'users' });
  });

  test('renders Sign_up component correctly', () => {
    render(<Sign_up />);
    
    expect(screen.getByText('КредитнийПортал')).toBeInTheDocument();
    expect(screen.getByText('Ваш надійний фінансовий помічник')).toBeInTheDocument();
    expect(screen.getByText('Реєстрація')).toBeInTheDocument();
    expect(screen.getByText('← На головну')).toBeInTheDocument();
    expect(screen.getByText('Вже маєте акаунт? Увійти')).toBeInTheDocument();
    expect(screen.getByText('Експортувати логи')).toBeInTheDocument();
  });

  test('handles successful sign-up', async () => {
    render(<Sign_up />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText("Повне ім'я"), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Телефон (необов’язково)'), { target: { value: '+380123456789' } });
    fireEvent.click(screen.getByText('Зареєструватися'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+380123456789',
          password: 'password123',
          role: 'user',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Реєстрація успішна')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Перенаправлення на головну сторінку після реєстрації')
      );
    });
  });

  test('displays error for existing email', async () => {
    getDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'user123', data: () => ({ email: 'test@example.com' }) }],
    });
    
    render(<Sign_up />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText("Повне ім'я"), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByText('Зареєструватися'));

    await waitFor(() => {
      expect(screen.getByText('Ця електронна пошта вже використовується')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Ця електронна пошта вже використовується')
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('displays error for Firebase failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    addDoc.mockRejectedValue(new Error('Firebase error'));
    
    render(<Sign_up />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText("Повне ім'я"), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByText('Зареєструватися'));

    await waitFor(() => {
      expect(screen.getByText('Сталася помилка під час реєстрації')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Сталася помилка під час реєстрації')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Сталася помилка під час реєстрації'),
        expect.any(Error)
      );
    });
  });

  test('disables submit button during loading', async () => {
    render(<Sign_up />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText("Повне ім'я"), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByText('Зареєструватися'));

    expect(screen.getByText('Обробка...')).toBeDisabled();
  });

  test('logs input changes', () => {
    render(<Sign_up />);
    
    fireEvent.change(screen.getByLabelText('Електронна пошта'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText("Повне ім'я"), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Телефон (необов’язково)'), { target: { value: '+380123456789' } });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля email')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля пароля')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля повного імені')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Оновлення поля телефону')
    );
  });

  test('navigates to login page', () => {
    render(<Sign_up />);
    
    fireEvent.click(screen.getByText('Увійти'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід до сторінки входу зі сторінки реєстрації')
    );
    expect(screen.getByText('Увійти')).toHaveAttribute('href', '/log_in');
  });

  test('navigates to main page', () => {
    render(<Sign_up />);
    
    fireEvent.click(screen.getByText('← На головну'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід на головну зі сторінки реєстрації')
    );
    expect(screen.getByText('← На головну')).toHaveAttribute('href', '/');
  });

  test('exports logs correctly', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['test log 1', 'test log 2']));
    render(<Sign_up />);
    
    fireEvent.click(screen.getByText('Експортувати логи'));

    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://test-log');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('app_logs');
  });

  test('renders footer correctly', () => {
    render(<Sign_up />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} КредитнийПортал. Усі права захищені.`)).toBeInTheDocument();
    expect(screen.getByText('Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67')).toBeInTheDocument();
  });
});