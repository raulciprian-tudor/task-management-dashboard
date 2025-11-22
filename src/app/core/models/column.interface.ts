/**
 * Column Interface
 * Represents a column within a board (e.g., "To Do", "In Progress", "Done")
 *
 * @property {string} id - Unique column identifier
 * @property {string} board_id - UUID of parent board
 * @property {string} name - Column name/title
 * @property {number} position - Order position in board (0-indexed)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Column {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

/**
 * Create Column Request Interface
 * Data required to create a new column
 *
 * @property {string} board_id - UUID of parent board
 * @property {string} name - Column name/title
 * @property {number} position - Order position in board
 */
export interface CreateColumnRequest {
  board_id: string
  name: string
  position: number
}

/**
 * Update Column Request Interface
 * Data that can be updated on a column
 *
 * @property {string} name - Column name/title
 * @property {number} position - Order position in board
 */
export interface UpdateColumnRequest {
    name?: string;
    position?: string;
}
