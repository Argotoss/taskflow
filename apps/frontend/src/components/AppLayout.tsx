import { Link, NavLink, useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const isProjectsRoot = location.pathname === '/projects';
  const isProjectsContext = location.pathname.startsWith('/projects');

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
              className={
                isProjectsRoot
                  ? 'nav-link nav-link--muted'
                  : isProjectsContext
                    ? 'nav-link nav-link--highlight'
                    : 'nav-link'
              }
              aria-current={isProjectsRoot ? 'page' : undefined}
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
