import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../context api/AuthContext';

vi.mock('../../context api/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

type AuthValue = {
  user: { role?: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string;
  retryProfileLoad: () => void;
};

const mockedUseAuth = vi.mocked(useAuth as () => AuthValue);

function renderProtectedRoute(authValue: AuthValue, roles?: string[]) {
  mockedUseAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>login screen</p>} />
        <Route path="/" element={<p>home screen</p>} />
        <Route
          path="/private"
          element={(
            <ProtectedRoute roles={roles}>
              <p>private screen</p>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('waits for auth resolution before redirecting', () => {
    renderProtectedRoute({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      authError: '',
      retryProfileLoad: vi.fn(),
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('login screen')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitors to login', () => {
    renderProtectedRoute({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authError: '',
      retryProfileLoad: vi.fn(),
    });

    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('rejects users without the required role', () => {
    renderProtectedRoute({
      user: { role: 'customer' },
      isLoading: false,
      isAuthenticated: true,
      authError: '',
      retryProfileLoad: vi.fn(),
    }, ['admin']);

    expect(screen.getByText('home screen')).toBeInTheDocument();
  });

  it('allows superadmins through administrator-protected routes', () => {
    renderProtectedRoute({
      user: { role: 'superadmin' },
      isLoading: false,
      isAuthenticated: true,
      authError: '',
      retryProfileLoad: vi.fn(),
    }, ['admin', 'superadmin']);

    expect(screen.getByText('private screen')).toBeInTheDocument();
  });
});
