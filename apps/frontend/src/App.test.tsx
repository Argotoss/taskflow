import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders landing headline', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /taskflow/i })).toBeVisible();
    expect(screen.getByText(/collaborative task management coming soon\./i)).toBeVisible();
  });
});
