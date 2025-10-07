import { taskStatusValues } from '@taskflow/shared';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useProjectQuery } from '../features/projects';
import { EditProjectModal } from '../features/projects/components/EditProjectModal';
import { useProjectTasksQuery } from '../features/tasks';
import { CreateTaskModal } from '../features/tasks/components/CreateTaskModal';
import { EditTaskModal } from '../features/tasks/components/EditTaskModal';

export const ProjectDetailPage = (): JSX.Element => {
  const { projectId } = useParams();
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
  } = useProjectQuery(projectId);
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useProjectTasksQuery(projectId);

  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setEditProjectOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const groupedTasks = useMemo(() => {
    const items = tasks ?? [];
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
  }, [tasks]);

  if (!projectId) {
    return (
      <AppLayout>
        <div className="panel error">Missing project identifier.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={project ? project.name : 'Project'}
      actions={
        <div className="actions-inline">
          <Link to="/projects" className="link-button">
            Back to projects
          </Link>
          {project ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditProjectOpen(true)}
            >
              Edit project
            </button>
          ) : null}
          <button
            type="button"
            className="primary-button"
            onClick={() => setCreateTaskOpen(true)}
            disabled={!projectId}
          >
            + New task
          </button>
        </div>
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
      ) : projectLoading ? (
        <div className="panel muted">Loading project…</div>
      ) : projectError ? (
        <div className="panel error">Unable to load project details.</div>
      ) : null}

      <section className="task-board">
        {tasksLoading ? (
          <div className="panel muted">Loading tasks…</div>
        ) : tasksError ? (
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
                          <li key={task.id}>
                            <button
                              type="button"
                              className="task-card"
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <h3>{task.title}</h3>
                              {task.description ? <p>{task.description}</p> : null}
                              <footer>
                                <span
                                  className={`priority priority-${task.priority.toLowerCase()}`}
                                >
                                  {task.priority.toLowerCase()}
                                </span>
                                <span className="muted">
                                  Created by {task.createdBy.displayName}
                                </span>
                              </footer>
                            </button>
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

      {isEditProjectOpen && project ? (
        <EditProjectModal project={project} onClose={() => setEditProjectOpen(false)} />
      ) : null}
      {isCreateTaskOpen && projectId ? (
        <CreateTaskModal projectId={projectId} onClose={() => setCreateTaskOpen(false)} />
      ) : null}
      {selectedTaskId && projectId && tasks ? (
        <EditTaskModal
          projectId={projectId}
          task={tasks.find((item) => item.id === selectedTaskId)!}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </AppLayout>
  );
};
