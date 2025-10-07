import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useProjectsQuery } from '../features/projects';
import { CreateProjectModal } from '../features/projects/components/CreateProjectModal';

export const ProjectsPage = (): JSX.Element => {
  const { data: projects, isLoading, isError } = useProjectsQuery();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <AppLayout
      title="Projects"
      actions={
        <button type="button" className="primary-button" onClick={() => setCreateModalOpen(true)}>
          + New project
        </button>
      }
    >
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
              <div className="project-card__chip">{project.role.toLowerCase()}</div>
              <div className="project-card__body">
                <h2>{project.name}</h2>
                {project.description ? (
                  <p>{project.description}</p>
                ) : (
                  <p className="muted">No description yet.</p>
                )}
                <div className="project-card__meta">
                  <span className="project-card__meta-label">
                    Status
                    <strong>{project.status.replace('_', ' ').toLowerCase()}</strong>
                  </span>
                  <span className="project-card__meta-label">
                    Updated
                    <strong>
                      {project.updatedAt.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="project-card__footer">
                <Link to={`/projects/${project.id}`} className="project-card__link">
                  Open project
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isCreateModalOpen ? <CreateProjectModal onClose={() => setCreateModalOpen(false)} /> : null}
    </AppLayout>
  );
};
