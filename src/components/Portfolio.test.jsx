import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Portfolio from './Portfolio';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Мокуємо Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
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

// Мокуємо зображення банків
jest.mock('../img/privat.png', () => 'privat.png');
jest.mock('../img/mono.png', () => 'mono.png');
jest.mock('../img/oshhadbank.png', () => 'oshhadbank.png');

// Мокуємо window.confirm
const confirmMock = jest.spyOn(window, 'confirm').mockImplementation();

describe('Portfolio Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReset();
    createElementMock.mockReturnValue({ href: '', click: jest.fn() });
    createObjectURLMock.mockReturnValue('blob://test-log');
    revokeObjectURLMock.mockReset();
    confirmMock.mockReset();

    // Мок для Firebase getDocs
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'loan1',
          data: () => ({
            bankName: 'Test Bank',
            amount: 100000,
            interestRate: 10,
            term: 12,
            takenDate: new Date('2025-01-01').toISOString(),
            paidMonths: 0,
          }),
        },
      ],
    });
    updateDoc.mockResolvedValue();
    deleteDoc.mockResolvedValue();
    collection.mockImplementation((db, path) => ({ path }));
    doc.mockReturnValue({ id: 'loan1' });
  });

  test('renders loading state initially', () => {
    render(<Portfolio />);
    expect(screen.getByText('Завантаження даних...')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Відображення стану завантаження портфоліо')
    );
  });

  test('renders error state on fetch failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Firebase error'));
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Не вдалося завантажити кредити')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Помилка завантаження кредитів')
      );
    });
  });

  test('renders Portfolio component correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('КредитнийПортал')).toBeInTheDocument();
      expect(screen.getByText('Моє кредитне портфоліо')).toBeInTheDocument();
      expect(screen.getByText('Поточні кредити')).toBeInTheDocument();
      expect(screen.getByText('Аналіз вашого портфоліо')).toBeInTheDocument();
      expect(screen.getByText('Фінансові поради')).toBeInTheDocument();
      expect(screen.getByText('Наші банки-партнери')).toBeInTheDocument();
      expect(screen.getByText('Часті запитання')).toBeInTheDocument();
      expect(screen.getByText('Відгуки наших клієнтів')).toBeInTheDocument();
      expect(screen.getByText('Експортувати логи')).toBeInTheDocument();
    });
  });

  test('renders navigation links correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Головна')).toHaveAttribute('href', '/mainpage');
      expect(screen.getByText('Про нас')).toHaveAttribute('href', '/aboutpage');
      expect(screen.getByText('Інструкція')).toHaveAttribute('href', '/instructionspage');
      expect(screen.getByText('Всі кредити')).toHaveAttribute('href', '/home');
      expect(screen.getByText('Калькулятор')).toHaveAttribute('href', '/calculator');
      expect(screen.getByText('Реєстрація')).toHaveAttribute('href', '/sign_up');
      expect(screen.getByText('Профіль')).toHaveAttribute('href', '/profile');
      expect(screen.getByText('Портфоліо')).toHaveAttribute('href', '/portfolio');
    });
  });

  test('renders portfolio stats correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Загальна заборгованість')).toBeInTheDocument();
      expect(screen.getByText('100,000 грн')).toBeInTheDocument();
      expect(screen.getByText('Середня ставка')).toBeInTheDocument();
      expect(screen.getByText('10.00%')).toBeInTheDocument();
      expect(screen.getByText('Кількість кредитів')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('Наступний платіж')).toBeInTheDocument();
    });
  });

  test('renders empty loans message when no loans', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('У вас немає активних кредитів')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Відображення портфоліо')
      );
    });
  });

  test('handles loan selection and edit mode', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Змінити умови'));
    
    expect(screen.getByText('Управління кредитом')).toBeInTheDocument();
    expect(screen.getByLabelText('Нова сума (грн)')).toHaveValue(100000);
    expect(screen.getByLabelText('Новий термін (міс.)')).toHaveValue(12);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Початок редагування умов кредиту')
    );
  });

  test('updates loan conditions', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Змінити умови'));
    fireEvent.change(screen.getByLabelText('Нова сума (грн)'), { target: { value: '150000' } });
    fireEvent.change(screen.getByLabelText('Новий термін (міс.)'), { target: { value: '24' } });
    fireEvent.click(screen.getByText('Зберегти зміни'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 150000,
          term: 24,
          interestRate: expect.any(Number),
        })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Умови кредиту успішно оновлено')
      );
    });
  });

  test('handles loan repayment', async () => {
    confirmMock.mockReturnValue(true);
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Погасити кредит'));
    
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app_logs',
        expect.stringContaining('Кредит успішно погашено')
      );
    });
  });

  test('cancels loan repayment', async () => {
    confirmMock.mockReturnValue(false);
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Погасити кредит'));
    
    expect(deleteDoc).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Погашення кредиту скасовано')
    );
  });

  test('handles limit change', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Змінити ліміт')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Змінити ліміт'));
    fireEvent.change(screen.getByLabelText('Новий ліміт (1-5):'), { target: { value: '3' } });
    fireEvent.click(screen.getByText('Підтвердити'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Кредитний ліміт успішно змінено')
    );
    expect(screen.getByText('Кількість кредитів')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  test('prevents invalid limit change', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Змінити ліміт')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Змінити ліміт'));
    fireEvent.change(screen.getByLabelText('Новий ліміт (1-5):'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Підтвердити'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Невалідний кредитний ліміт')
    );
  });

  test('handles logout confirmation', async () => {
    confirmMock.mockReturnValue(true);
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Вихід')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/mainpage');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Користувач підтвердив вихід')
    );
  });

  test('cancels logout', async () => {
    confirmMock.mockReturnValue(false);
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Вихід')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Вихід'));
    
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_logs',
      expect.stringContaining('Користувач скасував вихід')
    );
  });

  test('exports logs correctly', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['test log 1', 'test log 2']));
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Експортувати логи')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Експортувати логи'));
    
    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://test-log');
  });

  test('renders bank partners correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('ПриватБанк')).toBeInTheDocument();
      expect(screen.getByText('Ощадбанк')).toBeInTheDocument();
      expect(screen.getByText('Укрексімбанк')).toBeInTheDocument();
    });
  });

  test('renders testimonials correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText(/Завдяки КредитномуПорталу знайшла кредит/)).toBeInTheDocument();
      expect(screen.getByText('- Анна, Київ')).toBeInTheDocument();
      expect(screen.getByText(/Зручний кабінет, все наочно/)).toBeInTheDocument();
      expect(screen.getByText('- Олексій, Львів')).toBeInTheDocument();
    });
  });

  test('renders footer correctly', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} КредитнийПортал`)).toBeInTheDocument();
      expect(screen.getByText('Контакти: info@kreditnyportal.ua')).toBeInTheDocument();
    });
  });
});