export const projectStatusValues = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const membershipRoleValues = ['OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER'] as const;
export type MembershipRole = (typeof membershipRoleValues)[number];

export const taskStatusValues = ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'] as const;
export type TaskStatus = (typeof taskStatusValues)[number];

export const taskPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof taskPriorityValues)[number];

export const activityTypeValues = [
  'TASK_CREATED',
  'TASK_UPDATED',
  'STATUS_CHANGED',
  'ASSIGNEE_CHANGED',
  'COMMENT_ADDED',
  'COMMENT_UPDATED',
  'ATTACHMENT_ADDED',
] as const;
export type ActivityType = (typeof activityTypeValues)[number];

export const notificationTypeValues = [
  'TASK_ASSIGNED',
  'TASK_UPDATED',
  'COMMENT_MENTION',
  'PROJECT_INVITE',
] as const;
export type NotificationType = (typeof notificationTypeValues)[number];
