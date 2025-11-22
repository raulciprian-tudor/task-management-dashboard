/**
 * Board Interface
 * Represents a project board
 *
 * @property {string} id - Unique board identifier
 * @property {string} name - Board name/title
 * @property {string | null} description - Board description
 * @property {string} created_by - UUID of user who created the board
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Board {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Create Board Request Interface
 * Data required to create a new board
 *
 * @property {string} name - Board name/title
 * @property {string} description - Optional board description
 */
export interface CreateBoardRequest {
  name: string
  description?: string
}

/**
 * Update Board Request Interface
 * Data that can be updated on a board
 *
 * @property {string} name - Board name/title
 * @property {string} description - Board description
 */
export interface UpdateBoardRequest {
  name?: string
  description?: string
}
