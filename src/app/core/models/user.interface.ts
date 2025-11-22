/**
 * User role enumeration
 * Matches the database enum user_role
 */
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

/**
 * Profile Interface
 * Represents a user profile in the database
 * Extends Supabase auth.users with custom fields
 *
 * @property {string} id - UUID from auth.users
 * @property {string} email - User's email address
 * @property {string | null} full_name - User's display name
 * @property {string | null} avatar_url - URL to user's avatar image
 * @property {UserRole} role - User's role (admin or member)
 * @property {string} created_at - ISO timestamp of profile creation
 * @property {string} updated_at - ISO timestamp of last profile update
 */
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

/**
 * Sign Up Request Interface
 * Data required for user registration
 *
 * @property {string} email - User's email address
 * @property {string} password - User's password (min 6 characters)
 * @property {string} full_name - User's display name
 * @property {UserRole} role - Optional role (defaults to 'member')
 */
export interface SignUpRequest {
  email: string
  password: string
  full_name: string
  role?: UserRole
}

/**
 * Sign In Request Interface
 * Data required for user login
 *
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */
export interface SignInRequest {
  email: string
  password: string
}

/**
 * Auth Response Interface
 * Standardized response for authentication operations
 *
 * @property {boolean} success - Whether the operation succeeded
 * @property {string | null} error - Error message if operation failed
 * @property {Profile | null} profile - User profile if operation succeeded
 */
export interface AuthResponse {
  success: boolean
  error: string | null
  profile: Profile | null
}
