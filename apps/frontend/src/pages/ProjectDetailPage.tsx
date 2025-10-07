import { TaskStatus, taskStatusValues } from '@taskflow/shared';
import { DragEvent, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useProjectQuery } from '../features/projects';
import { EditProjectModal } from '../features/projects/components/EditProjectModal';
import { useProjectTasksQuery, useUpdateTaskMutation } from '../features/tasks';
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
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const updateTaskMutation = useUpdateTaskMutation(projectId ?? '');

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
          <div className="project-badge">
            <div className="project-badge__header">
              <span className="project-badge__role">{project.role.toLowerCase()}</span>
              <span
                className={`project-badge__status project-badge__status--${project.status.toLowerCase()}`}
              >
                {project.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
            <div className="project-badge__body">
              {project.description ? (
                <p>{project.description}</p>
              ) : (
                <p className="muted">No description added yet.</p>
              )}
            </div>
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
                <article
                  key={status}
                  className={`task-column ${dragOverStatus === status ? 'task-column--active' : ''}`}
                  onDragOver={(event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    setDragOverStatus(status);
                  }}
                  onDragLeave={() =>
                    setDragOverStatus((current) => (current === status ? null : current))
                  }
                  onDrop={async () => {
                    if (!projectId || !draggedTaskId) {
                      return;
                    }

                    const filtered = tasks.filter((item) => item.id !== draggedTaskId);
                    const newPosition = filtered.length;

                    setDragOverStatus(null);
                    await updateTaskMutation.mutateAsync({
                      taskId: draggedTaskId,
                      input: {
                        status,
                        position: newPosition,
                      },
                    });
                    setDraggedTaskId(null);
                  }}
                >
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
                              className={`task-card task-card--${task.status.toLowerCase()} ${
                                draggedTaskId === task.id ? 'task-card--dragging' : ''
                              }`}
                              draggable
                              onDragStart={() => setDraggedTaskId(task.id)}
                              onDragEnd={() => {
                                setDraggedTaskId(null);
                                setDragOverStatus(null);
                              }}
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
