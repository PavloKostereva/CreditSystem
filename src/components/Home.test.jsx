import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

// Мокуємо react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Мокуємо localStorage для Logger
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Home Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReset();

    // Мок для Firebase getDocs
    getDocs.mockImplementation(async (query) => {
      if (query.path === 'bankCredits') {
        return {
          docs: [
            {
              id: 'bank1',
              data: () => ({
                bankName: 'Test Bank',
                creditName: 'Test Credit',
                amount: 100000,
                interestRate: 10,
                term: 12,
                description: 'Bank credit description',
                requirements: 'Bank credit requirements',
              }),
            },
          ],
        };
      }
      if (query.path === 'privateCredits') {
        return {
          docs: [
            {
              id: 'private1',
              data: () => ({
                lenderName: 'Test Lender',
                amount: 50000,
                interestRate: 15,
                term: 6,
                description: 'Private credit description',
                requirements: 'Private credit requirements',
              }),
            },
          ],
        };
      }
      return { docs: [] };
    });

    collection.mockImplementation((db, path) => ({ path }));
  });

  test('renders Home component correctly', () => {
    render(<Home />);
    expect(screen.getByText('Знайдіть ідеальний кредит')).toBeInTheDocument();
    expect(screen.getByText('Актуальні пропозиції від банків та приватних кредиторів')).toBeInTheDocument();
    expect(screen.getByText('Фільтри та сортування')).toBeInTheDocument();
    expect(screen.getByText('Вихід')).toBeInTheDocument();
  });

  test('renders navigation links correctly', () => {
    render(<Home />);
    expect(screen.getByText('Головна')).toBeInTheDocument();
    expect(screen.getByText('Про нас')).toBeInTheDocument();
    expect(screen.getByText('Інструкція')).toBeInTheDocument();
    expect(screen.getByText('Всі кредити')).toBeInTheDocument();
    expect(screen.getByText('Калькулятор')).toBeInTheDocument();
    expect(screen.getByText('Реєстрація')).toBeInTheDocument();
    expect(screen.getByText('Профіль')).toBeInTheDocument();
    expect(screen.getByText('Портфоліо')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<Home />);
    expect(screen.getByText('Завантаження даних...')).toBeInTheDocument();
  });

  test('fetches and displays bank and private credits', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
      expect(screen.getByText('1 пропозицій')).toBeInTheDocument();
      expect(screen.getByText('Test Credit')).toBeInTheDocument();
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
      expect(screen.getByText('Ставка: 10%')).toBeInTheDocument();
      expect(screen.getByText('Сума: 100,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Термін: 12 міс.')).toBeInTheDocument();

      expect(screen.getByText('Кредити від приватних осіб')).toBeInTheDocument();
      expect(screen.getByText('1 пропозицій')).toBeInTheDocument();
      expect(screen.getByText('Пропозиція від Test Lender')).toBeInTheDocument();
      expect(screen.getByText('Ставка: 15%')).toBeInTheDocument();
      expect(screen.getByText('Сума: 50,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Термін: 6 міс.')).toBeInTheDocument();
    });
  });

  test('filters credits by search term', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Пошук:'), { target: { value: 'Test Bank' } });
    
    await waitFor(() => {
      expect(screen.getByText('1 пропозицій')).toBeInTheDocument();
      expect(screen.getByText('Test Credit')).toBeInTheDocument();
      expect(screen.queryByText('Пропозиція від Test Lender')).not.toBeInTheDocument();
    });
  });

  test('filters credits by amount range', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Від'), { target: { value: '75000' } });
    fireEvent.change(screen.getByPlaceholderText('До'), { target: { value: '150000' } });
    
    await waitFor(() => {
      expect(screen.getByText('1 пропозицій')).toBeInTheDocument();
      expect(screen.getByText('Test Credit')).toBeInTheDocument();
      expect(screen.queryByText('Пропозиція від Test Lender')).not.toBeInTheDocument();
    });
  });

  test('sorts credits by interest rate', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Сортувати за:'), { target: { value: 'rate' } });
    fireEvent.change(screen.getByLabelText('Сортувати за:').nextSibling, { target: { value: 'asc' } });
    
    await waitFor(() => {
      const bankCredits = screen.getByText('Кредити від банків').closest('section');
      const privateCredits = screen.getByText('Кредити від приватних осіб').closest('section');
      expect(bankCredits).toBeInTheDocument();
      expect(privateCredits).toBeInTheDocument();
    });
  });

  test('resets filters', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Пошук:'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Скинути фільтри'));

    expect(screen.getByLabelText('Пошук:')).toHaveValue('');
    expect(screen.getByPlaceholderText('Від')).toHaveValue('');
    expect(screen.getByPlaceholderText('До')).toHaveValue('');
  });

  test('opens and closes modal for credit details', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Детальніше'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Credit')).toBeInTheDocument();
      expect(screen.getByText('Банк/Кредитор: Test Bank')).toBeInTheDocument();
      expect(screen.getByText('Ставка: 10%')).toBeInTheDocument();
      expect(screen.getByText('Сума: 100,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Термін: 12 місяців')).toBeInTheDocument();
      expect(screen.getByText('Опис: Bank credit description')).toBeInTheDocument();
      expect(screen.getByText('Вимоги: Bank credit requirements')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));
    
    await waitFor(() => {
      expect(screen.queryByText('Test Credit')).not.toBeInTheDocument();
    });
  });

  test('navigates to calculator with prefilled data', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Кредити від банків')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Детальніше'));
    fireEvent.click(screen.getByText('Подати заявку'));

    expect(screen.getByText('Подати заявку')).toHaveAttribute('href', '/calculator');
  });

  test('handles logout confirmation', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Home />);
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).toHaveBeenCalledWith('/mainpage');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Спроба виходу з системи')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Підтвердження виходу, перенаправлення на головну сторінку')
    );
  });

  test('logs cancellation of logout', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Home />);
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Вихід скасовано користувачем')
    );
  });

  test('logs navigation link clicks', () => {
    render(<Home />);
    
    fireEvent.click(screen.getByText('Калькулятор'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Перехід до калькулятора')
    );
  });

  test('handles error during data fetching', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Fetch error'));
    
    render(<Home />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Помилка завантаження даних:'),
        expect.any(Error)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Помилка завантаження кредитних пропозицій')
      );
    });
  });
});