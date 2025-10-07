import { useQuery } from '@tanstack/react-query';
import { projectSchema, taskSchema, taskStatusValues } from '@taskflow/shared';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../features/auth';

const tasksSchema = z.array(taskSchema);

export const ProjectDetailPage = (): JSX.Element => {
  const { projectId } = useParams();
  const { request } = useAuth();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    enabled: Boolean(projectId),
    queryFn: () => request({ method: 'GET', url: `/projects/${projectId}` }, projectSchema),
  });

  const tasksQuery = useQuery({
    queryKey: ['project', projectId, 'tasks'],
    enabled: Boolean(projectId),
    queryFn: () => request({ method: 'GET', url: `/projects/${projectId}/tasks` }, tasksSchema),
  });

  const groupedTasks = useMemo(() => {
    const items = tasksQuery.data ?? [];
    const result = new Map<string, typeof items>();

    for (const status of taskStatusValues) {
      result.set(status, []);
    }

    for (const task of items) {
      const current = result.get(task.status) ?? [];
      current.push(task);
      result.set(task.status, current);
    }

    return result;
  }, [tasksQuery.data]);

  if (!projectId) {
    return (
      <AppLayout>
        <div className="panel error">Missing project identifier.</div>
      </AppLayout>
    );
  }

  const project = projectQuery.data;

  return (
    <AppLayout
      title={project ? project.name : 'Project'}
      actions={
        <Link to="/projects" className="link-button">
          Back to projects
        </Link>
      }
    >
      {project ? (
        <section className="project-hero">
          {project.description ? (
            <p>{project.description}</p>
          ) : (
            <p className="muted">No description added yet.</p>
          )}
          <div className="project-meta">
            <span>Role: {project.role}</span>
            <span>Status: {project.status.replace('_', ' ').toLowerCase()}</span>
          </div>
        </section>
      ) : projectQuery.isLoading ? (
        <div className="panel muted">Loading project…</div>
      ) : projectQuery.isError ? (
        <div className="panel error">Unable to load project details.</div>
      ) : null}

      <section className="task-board">
        {tasksQuery.isLoading ? (
          <div className="panel muted">Loading tasks…</div>
        ) : tasksQuery.isError ? (
          <div className="panel error">Unable to load tasks right now.</div>
        ) : (
          <div className="task-columns">
            {taskStatusValues.map((status) => {
              const tasks = groupedTasks.get(status) ?? [];
              return (
                <article key={status} className="task-column">
                  <header>
                    <h2>{status.replace('_', ' ').toLowerCase()}</h2>
                    <span className="chip">{tasks.length}</span>
                  </header>
                  <ul>
                    {tasks.length === 0 ? (
                      <li className="muted">No tasks yet.</li>
                    ) : (
                      tasks
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((task) => (
                          <li key={task.id} className="task-card">
                            <h3>{task.title}</h3>
                            {task.description ? <p>{task.description}</p> : null}
                            <footer>
                              <span className={`priority priority-${task.priority.toLowerCase()}`}>
                                {task.priority.toLowerCase()}
                              </span>
                              <span className="muted">Created by {task.createdBy.displayName}</span>
                            </footer>
                          </li>
                        ))
                    )}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
};
