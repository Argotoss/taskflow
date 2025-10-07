import { useQuery } from '@tanstack/react-query';
import { projectSchema } from '@taskflow/shared';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../features/auth';

const projectsSchema = z.array(projectSchema);

export const ProjectsPage = (): JSX.Element => {
  const { request } = useAuth();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => request({ method: 'GET', url: '/projects' }, projectsSchema),
  });

  return (
    <AppLayout title="Projects">
      {isLoading ? (
        <div className="panel muted">Loading projects…</div>
      ) : isError ? (
        <div className="panel error">Unable to load projects right now.</div>
      ) : !projects || projects.length === 0 ? (
        <div className="panel muted">
          <h2>No projects yet</h2>
          <p>Create your first project to start organizing tasks with your team.</p>
        </div>
      ) : (
        <ul className="project-grid">
          {projects.map((project) => (
            <li key={project.id} className="project-card">
              <div className="project-card__badge">{project.role.toLowerCase()}</div>
              <h2>{project.name}</h2>
              {project.description ? <p>{project.description}</p> : null}
              <div className="project-card__meta">
                <span>Status: {project.status.replace('_', ' ').toLowerCase()}</span>
                <span>
                  Updated{' '}
                  {project.updatedAt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <Link to={`/projects/${project.id}`} className="link-button">
                Open project
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  );
};
