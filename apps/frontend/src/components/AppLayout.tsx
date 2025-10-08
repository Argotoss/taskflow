import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../features/auth';
import { useTheme } from '../features/theme';

type AppLayoutProps = {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const AppLayout = ({ title, actions, children }: AppLayoutProps): JSX.Element => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__left">
          <Link to="/projects" className="brand">
            TaskFlow
          </Link>
          <nav aria-label="Main navigation" className="app-nav">
            <NavLink
              to="/projects"
              end
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              Projects
            </NavLink>
          </nav>
        </div>
        <div className="app-header__right">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span aria-hidden>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          {user ? (
            <div className="user-pill">
              <span
                className="user-pill__avatar"
                style={{ backgroundColor: user.profileColor ?? '#1d4ed8' }}
              >
                {user.displayName.slice(0, 2).toUpperCase()}
              </span>
              <div className="user-pill__meta">
                <span className="user-pill__name">{user.displayName}</span>
                <button type="button" onClick={logout} className="link-button">
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>
      <main className="app-content">
        {title ? (
          <div className="page-heading">
            <h1>{title}</h1>
            {actions}
          </div>
        ) : null}
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
};
