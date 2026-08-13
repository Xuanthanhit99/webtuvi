import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { NotificationPreferencesSection } from './notification-preferences-section';
import { notificationsApi } from '../api/notifications-api';
import { Toaster } from '@/components/ui/toast';

jest.mock('../api/notifications-api', () => ({
  notificationsApi: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
}));

function renderSection() {
  return renderWithQuery(
    <>
      <NotificationPreferencesSection />
      <Toaster />
    </>,
  );
}

describe('NotificationPreferencesSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the saved preference state', async () => {
    (notificationsApi.getPreferences as jest.Mock).mockResolvedValue({ reminderInApp: true, reminderEmail: false });
    renderSection();

    expect(await screen.findByLabelText(/show reminders in notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/also email me reminders/i)).not.toBeChecked();
  });

  it('disables the email checkbox when the in-app master switch is off', async () => {
    (notificationsApi.getPreferences as jest.Mock).mockResolvedValue({ reminderInApp: false, reminderEmail: false });
    renderSection();

    expect(await screen.findByLabelText(/also email me reminders/i)).toBeDisabled();
  });

  it('toggling the in-app switch saves the change and shows a success toast', async () => {
    (notificationsApi.getPreferences as jest.Mock).mockResolvedValue({ reminderInApp: true, reminderEmail: false });
    (notificationsApi.updatePreferences as jest.Mock).mockResolvedValue({ reminderInApp: false, reminderEmail: false });
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByLabelText(/show reminders in notifications/i));

    await waitFor(() => expect(notificationsApi.updatePreferences).toHaveBeenCalledWith({ reminderInApp: false }));
    expect(await screen.findByText(/preference updated/i)).toBeInTheDocument();
  });

  it('shows an error toast when saving fails', async () => {
    (notificationsApi.getPreferences as jest.Mock).mockResolvedValue({ reminderInApp: true, reminderEmail: false });
    (notificationsApi.updatePreferences as jest.Mock).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByLabelText(/also email me reminders/i));

    expect(await screen.findByText(/couldn.t save that/i)).toBeInTheDocument();
  });

  it('always describes account/payment notices as non-optional, with no toggle for them', async () => {
    (notificationsApi.getPreferences as jest.Mock).mockResolvedValue({ reminderInApp: true, reminderEmail: false });
    renderSection();

    expect(await screen.findByText(/account and premium payment notices/i)).toBeInTheDocument();
  });
});
