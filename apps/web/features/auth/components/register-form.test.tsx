import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { RegisterForm } from './register-form';
import { authApi } from '../api/auth-api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../api/auth-api', () => ({
  authApi: { register: jest.fn() },
}));

/** Fills every field with valid values, then lets the caller override one. */
async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { password?: string; confirmPassword?: string; skipTerms?: boolean } = {},
) {
  await user.type(screen.getByLabelText('Display name'), 'Alex');
  await user.type(screen.getByLabelText('Email'), 'alex@example.com');
  await user.type(screen.getByLabelText('Password', { exact: true }), overrides.password ?? 'Sup3r$ecretPass');
  await user.type(
    screen.getByLabelText('Confirm password'),
    overrides.confirmPassword ?? overrides.password ?? 'Sup3r$ecretPass',
  );
  if (!overrides.skipTerms) {
    await user.click(screen.getByLabelText(/agree to the/));
  }
}

describe('RegisterForm password rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'Ab1!', confirmPassword: 'Ab1!' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Same collision risk as above: match the error's exact wording, since the
    // permanent hint also contains "at least 8 characters".
    expect(await screen.findByText(/passwords need at least 8 characters/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a password with no number or symbol', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'alllowercaseletters', confirmPassword: 'alllowercaseletters' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // The permanent password-rules hint also contains "number or symbol", so
    // match the error's specific wording ("at least one number or symbol") to
    // avoid an ambiguous multi-match.
    expect(await screen.findByText(/at least one number or symbol/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a confirm-password that does not match', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { password: 'Sup3r$ecretPass', confirmPassword: 'Different1!' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(/doesn.t match/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('requires accepting the terms checkbox', async () => {
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user, { skipTerms: true });
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(/accept the terms/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data', async () => {
    (authApi.register as jest.Mock).mockResolvedValue({ onboardingCompletedAt: null });
    const user = userEvent.setup();
    renderWithQuery(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByRole('button', { name: 'Continue' });
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alex@example.com', displayName: 'Alex' }),
    );
  });
});
