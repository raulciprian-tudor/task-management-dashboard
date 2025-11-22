/**
 * Comment Interface
 * Represents a comment on a task
 *
 * @property {string} id - Unique comment identifier
 * @property {string} task_id - UUID of parent task
 * @property {string} user_id - UUID of comment author
 * @property {string} content - Comment text content
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

/**
 * Create Comment Request Interface
 * Data required to create a new comment
 *
 * @property {string} task_id - UUID of parent task
 * @property {string} content - Comment text content
 */
export interface CreateCommentRequest {
  task_id: string
  content: string
}

/**
 * Update Comment Request Interface
 * Data that can be updated on a comment
 *
 * @property {string} content - Comment text content
 */
export interface UpdateCommentRequest {
  content: string
}
