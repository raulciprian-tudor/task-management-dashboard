/**
 * Task Priority Enumeration
 * Matches the database enum task_priority
 */

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Task Interface
 * Represents an individual task card
 *
 * @property {string} id - Unique task identifier
 * @property {string} board_id - UUID of parent board
 * @property {string} column_id - UUID of parent column
 * @property {string} title - Task title
 * @property {string | null} description - Task description
 * @property {string | null} assigned_to - UUID of assigned user
 * @property {number} position - Order position in column (0-indexed)
 * @property {TaskPriority} priority - Task priority level
 * @property {string | null} due_date - ISO timestamp of due date
 * @property {string} created_by - UUID of user who created the task
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Task {
  id: string
  board_id: string
  column_id: string
  title: string
  description: string | null
  assigned_to: string | null
  position: number
  priority: TaskPriority
  due_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Create Task Request Interface
 * Data required to create a new task
 *
 * @property {string} board_id - UUID of parent board
 * @property {string} column_id - UUID of parent column
 * @property {string} title - Task title
 * @property {string} description - Optional task description
 * @property {string} assigned_to - Optional UUID of assigned user
 * @property {number} position - Order position in column
 * @property {TaskPriority} priority - Optional priority (defaults to medium)
 * @property {string} due_date - Optional ISO timestamp of due date
 */
export interface CreateTaskRequest {
  board_id: string
  column_id: string
  title: string
  description?: string
  assigned_to?: string
  position: number
  priority?: TaskPriority
  due_date?: string
}

/**
 * Update Task Request Interface
 * Data that can be updated on a task
 */
export interface UpdateTaskRequest {
  title?: string
  description?: string
  assigned_to?: string
  column_id?: string
  position?: string
  priority?: TaskPriority
  due_date?: string | null
}
