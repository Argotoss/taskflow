import { z } from 'zod';

import {
  membershipRoleValues,
  projectStatusValues,
  taskPriorityValues,
  taskStatusValues,
} from './enums';

const isoDate = () => z.coerce.date();
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordRegex, {
    message: 'Password must be at least 8 characters long and contain letters and numbers',
  }),
  displayName: z.string().min(2),
  profileColor: z.string().min(1).optional(),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(10),
});

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  profileColor: z.string().min(1).nullable().optional(),
  createdAt: isoDate(),
  updatedAt: isoDate(),
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10),
  accessTokenExpiresIn: z.number().int().positive(),
  user: userSummarySchema,
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(projectStatusValues),
  role: z.enum(membershipRoleValues),
  ownerId: z.string().uuid(),
  createdAt: isoDate(),
  updatedAt: isoDate(),
  archivedAt: isoDate().nullable().optional(),
});

export const membershipSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(membershipRoleValues),
  joinedAt: isoDate(),
  invitedById: z.string().uuid().nullable().optional(),
  user: userSummarySchema,
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(1000).optional(),
});

export const addMemberRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(membershipRoleValues).optional(),
});

export const updateMemberRoleRequestSchema = z.object({
  role: z.enum(membershipRoleValues),
});

export const taskAssigneeSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(membershipRoleValues),
  user: userSummarySchema,
});

export const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(taskStatusValues),
  priority: z.enum(taskPriorityValues),
  dueAt: isoDate().nullable().optional(),
  position: z.number().int().nonnegative(),
  createdAt: isoDate(),
  updatedAt: isoDate(),
  completedAt: isoDate().nullable().optional(),
  createdById: z.string().uuid(),
  assigneeId: z.string().uuid().nullable().optional(),
  createdBy: userSummarySchema,
  assignee: taskAssigneeSchema.nullable().optional(),
});

export const createTaskRequestSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(5000).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  status: z.enum(taskStatusValues).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  position: z.number().int().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type Task = z.infer<typeof taskSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type AddMemberRequest = z.infer<typeof addMemberRequestSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof updateMemberRoleRequestSchema>;
export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

export const PASSWORD_REGEX = passwordRegex;
