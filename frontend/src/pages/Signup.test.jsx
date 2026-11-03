import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Signup from './Signup';

const authMocks = vi.hoisted(() => ({
  signup: vi.fn(),
}));

vi.mock('../context api/AuthContext', () => ({
  useAuth: () => ({
    signup: authMocks.signup,
    socialLogin: vi.fn(),
    resendVerificationEmail: vi.fn(),
    refreshProfile: vi.fn(),
    isEmailVerified: false,
  }),
}));

vi.mock('../components/common/Header', () => ({ default: () => null }));
vi.mock('../components/common/Footer', () => ({ default: () => null }));

describe('Signup', () => {
  beforeEach(() => {
    authMocks.signup.mockReset();
    authMocks.signup.mockResolvedValue({ emailVerificationSent: true });
  });

  it('navigates to the profile after account creation', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<h1>Profile page</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('User Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('example@gmail.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('+91 234567890'), {
      target: { value: '+91 9876543210' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the Terms & Conditions/));
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }));

    await waitFor(() => {
      expect(authMocks.signup).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        '+91 9876543210',
        'StrongPass1',
      );
      expect(screen.getByRole('heading', { name: 'Profile page' })).toBeInTheDocument();
    });
  });
});
