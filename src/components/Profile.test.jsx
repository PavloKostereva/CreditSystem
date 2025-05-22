import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
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

// Мокуємо зображення аватара
jest.mock('../img/default-avatar.png', () => 'default-avatar.png');

describe('Profile Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ id: 'user123', email: 'test@example.com' })
    );
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    createElementMock.mockReturnValue({ href: '', click: jest.fn() });
    createObjectURLMock.mockReturnValue('blob://test-log');
    revokeObjectURLMock.mockReset();

    // Мок для Firebase
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+380123456789',
      }),
    });
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'loan1',
          data: () => ({
            userId: 'user123',
            amount: 100000,
            bankName: 'Test Bank',
            interestRate: 10,
            term: 12,
          }),
        },
      ],
    });

    doc.mockReturnValue({ id: 'user123' });
    collection.mockImplementation((db, path) => ({ path }));
    query.mockReturnValue({ path: 'userLoans' });
    where.mockReturnValue({ path: 'userLoans' });
  });

  test('renders loading state initially', () => {
    render(<Profile />);
    expect(screen.getByText('Завантаження профілю...')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Відображення стану завантаження профілю')
    );
  });

  test('redirects to login if user is not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<Profile />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/log_in');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Користувач не авторизований - перенаправлення на сторінку входу')
    );
  });

  test('renders profile data correctly', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+380123456789')).toBeInTheDocument();
      expect(screen.getByText('Кількість кредитів: 1')).toBeInTheDocument();
      expect(screen.getByText('Бажаєте переглянути своє кредитне портфоліо?')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Відображення профілю користувача')
      );
    });
  });

  test('displays error if user not found in database', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Користувача не знайдено в базі даних')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Користувача не знайдено в базі даних')
      );
    });
  });

  test('displays error on Firebase failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDoc.mockRejectedValue(new Error('Firebase error'));
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Не вдалося завантажити дані користувача')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Не вдалося завантажити дані користувача')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Не вдалося завантажити дані користувача'),
        expect.any(Error)
      );
    });
  });

  test('handles logout correctly', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Вийти'));
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(mockNavigate).toHaveBeenCalledWith('/log_in');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Користувач вийшов з системи')
    );
  });

  test('navigates to main page', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('← На головну'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід на головну з профілю')
    );
    expect(screen.getByText('← На головну')).toHaveAttribute('href', '/');
  });

  test('navigates to portfolio', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Перейти до портфоліо'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід до портфоліо з профілю')
    );
    expect(screen.getByText('Перейти до портфоліо')).toHaveAttribute('href', '/portfolio');
  });

  test('exports logs correctly', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['test log 1', 'test log 2']));
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Експортувати логи'));
    
    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://test-log');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('app_logs');
  });

  test('renders footer correctly', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    });
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} КредитнийПортал. Усі права захищені.`)).toBeInTheDocument();
    expect(screen.getByText('Контакти: info@kreditnyportal.ua | +380 (44) 123-45-67')).toBeInTheDocument();
  });

  test('logs successful data fetching', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Дані користувача успішно отримані')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Кредити користувача отримано')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Завершено завантаження профілю')
      );
    });
  });
});