import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Calculator from './Calculator';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
}));

// Мокуємо react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children }) => <a>{children}</a>,
}));

describe('Calculator Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);

    // Мок для localStorage
    const mockUser = { id: 'user123', name: 'Test User' };
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(JSON.stringify(mockUser));
    jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});

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
              }),
            },
          ],
        };
      }
      if (query.path === 'privateCredits') {
        return { docs: [] };
      }
      if (query.path === 'userLoans') {
        return { docs: [], size: 0 };
      }
      return { docs: [] };
    });

    collection.mockImplementation((db, path) => ({ path }));
    query.mockReturnValue({ path: 'userLoans' });
    where.mockReturnValue({ path: 'userLoans' });
  });

  test('renders Calculator component correctly', () => {
    render(<Calculator />);
    expect(screen.getByText('Кредитний калькулятор')).toBeInTheDocument();
    expect(screen.getByText('Розрахуйте ваші майбутні виплати за кредитом')).toBeInTheDocument();
    expect(screen.getByText('Оберіть тип кредиту:')).toBeInTheDocument();
    expect(screen.getByText('Вихід')).toBeInTheDocument();
  });

  test('handles logout confirmation', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Calculator />);
    
    const logoutButton = screen.getByText('Вихід');
    fireEvent.click(logoutButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Ви точно хочете вийти?');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(mockNavigate).toHaveBeenCalledWith('/mainpage');
  });

  test('submits search form and displays results', async () => {
    render(<Calculator />);
    
    // Заповнюємо форму
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Максимальна ставка (%):'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Мінімальний термін (міс.):'), { target: { value: '6' } });
    
    // Натискаємо кнопку пошуку
    const searchButton = screen.getByText('Знайти кредити');
    fireEvent.click(searchButton);
    
    // Чекаємо завершення асинхронного запиту
    await waitFor(() => {
      expect(screen.getByText('Знайдено 1 кредитів:')).toBeInTheDocument();
      expect(screen.getByText(/Test Bank - Test Credit/)).toBeInTheDocument();
      expect(screen.getByText('ID: bank1')).toBeInTheDocument();
      expect(screen.getByText('Сума: 100,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Ставка: 10%')).toBeInTheDocument();
      expect(screen.getByText('Термін: 12 міс.')).toBeInTheDocument();
    });
  });

  test('displays error when no loans match criteria', async () => {
    // Мокуємо порожній результат
    getDocs.mockImplementation(async () => ({ docs: [] }));
    
    render(<Calculator />);
    
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '99999999' } });
    fireEvent.click(screen.getByText('Знайти кредити'));
    
    await waitFor(() => {
      expect(screen.getByText('Кредитів за вказаними параметрами не знайдено')).toBeInTheDocument();
    });
  });

  test('selects a loan and shows confirmation modal', async () => {
    render(<Calculator />);
    
    // Виконуємо пошук
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '50000' } });
    fireEvent.click(screen.getByText('Знайти кредити'));
    
    await waitFor(() => {
      expect(screen.getByText('Знайдено 1 кредитів:')).toBeInTheDocument();
    });
    
    // Вибираємо кредит
    fireEvent.change(screen.getByLabelText('Введіть ID кредиту:'), { target: { value: 'bank1' } });
    fireEvent.click(screen.getByText('Підтвердити вибір'));
    
    // Перевіряємо модальне вікно
    await waitFor(() => {
      expect(screen.getByText('Підтвердження кредиту')).toBeInTheDocument();
      expect(screen.getByText('Банківський кредит')).toBeInTheDocument();
      expect(screen.getByText('Банк: Test Bank')).toBeInTheDocument();
      expect(screen.getByText('Сума кредиту: 100,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Відсоткова ставка: 10%')).toBeInTheDocument();
      expect(screen.getByText('Термін: 12 місяців')).toBeInTheDocument();
    });
  });

  test('shows alert when invalid loan ID is entered', async () => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<Calculator />);
    
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '50000' } });
    fireEvent.click(screen.getByText('Знайти кредити'));
    
    await waitFor(() => {
      expect(screen.getByText('Знайдено 1 кредитів:')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Введіть ID кредиту:'), { target: { value: 'invalid-id' } });
    fireEvent.click(screen.getByText('Підтвердити вибір'));
    
    expect(window.alert).toHaveBeenCalledWith('Кредит з вказаним ID не знайдено');
  });

  test('confirms loan and updates Firebase', async () => {
    addDoc.mockResolvedValue({ id: 'new-loan-id' });
    doc.mockReturnValue({ id: 'user123' });
    
    render(<Calculator />);
    
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '50000' } });
    fireEvent.click(screen.getByText('Знайти кредити'));
    
    await waitFor(() => {
      expect(screen.getByText('Знайдено 1 кредитів:')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Введіть ID кредиту:'), { target: { value: 'bank1' } });
    fireEvent.click(screen.getByText('Підтвердити вибір'));
    
    await waitFor(() => {
      expect(screen.getByText('Підтвердження кредиту')).toBeInTheDocument();
    });
    
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    fireEvent.click(screen.getByText('Підтвердити'));
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 100000,
          bankName: 'Test Bank',
          interestRate: 10,
          loanId: 'bank1',
          loanType: 'bank',
          userId: 'user123',
        })
      );
      expect(updateDoc).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Кредит успішно додано!');
    });
  });

  test('cancels loan selection', async () => {
    render(<Calculator />);
    
    fireEvent.change(screen.getByLabelText('Мінімальна сума (грн):'), { target: { value: '50000' } });
    fireEvent.click(screen.getByText('Знайти кредити'));
    
    await waitFor(() => {
      expect(screen.getByText('Знайдено 1 кредитів:')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Введіть ID кредиту:'), { target: { value: 'bank1' } });
    fireEvent.click(screen.getByText('Підтвердити вибір'));
    
    await waitFor(() => {
      expect(screen.getByText('Підтвердження кредиту')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Скасувати'));
    
    await waitFor(() => {
      expect(screen.queryByText('Підтвердження кредиту')).not.toBeInTheDocument();
    });
  });
});