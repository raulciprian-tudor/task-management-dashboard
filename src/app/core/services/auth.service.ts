import { computed, Injectable, signal } from '@angular/core'
import { Router } from '@angular/router'
import { from, Observable, of } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import {
  AuthResponse,
  Profile,
  SignInRequest,
  SignUpRequest,
  UserRole,
} from '../models/user.interface'
import { SupabaseService } from './supabase.service'

/**
 * AuthService
 *
 * Handles all authentication operations and user profile management using Angular Signals.
 *
 * Responsibilities:
 * - User registration (sign-up)
 * - User login (sign-in)
 * - User logout (sign-out)
 * - Profile fetching and caching
 * - Auth state management with Signals
 * - Session persistence
 *
 * Flow:
 * 1. User signs up → Supabase creates auth.users entry
 * 2. Database trigger creates profile automatically
 * 3. Service fetches profile and stores in Signal
 * 4. Components read from computed signals for reactive UI
 *
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Signal holding current user's profile
   * Null when user is not authenticated
   */
  private profileSignal = signal<Profile | null>(null)

  /**
   * Signal for loading state during auth operations
   */
  private loadingSignal = signal<boolean>(false)

  /**
   * Signal for auth error messages
   */
  private errorSignal = signal<string | null>(null)

  /**
   * Public readonly signals (computed for better encapsulation)
   */
  public readonly currentProfile = this.profileSignal.asReadonly()
  public readonly isLoading = this.loadingSignal.asReadonly()
  public readonly error = this.errorSignal.asReadonly()

  /**
   * Computed signal for authentication status
   */
  public readonly isAuthenticated = computed(
    () => this.profileSignal() !== null
  )

  /**
   * Computed signal for admin status
   */
  public readonly isAdmin = computed(
    () => this.profileSignal()?.role === UserRole.ADMIN
  )

  constructor(private supabase: SupabaseService, private router: Router) {
    // Initialize profile on service creation and setup session persistence
    this.initializeAuth()
  }

  /**
   * Initialize authentication state and setup session persistence
   *
   * Flow:
   * 1. Listen to Supabase auth state changes
   * 2. Restore session on app load (if exists)
   * 3. Fetch profile when user is authenticated
   * 4. Keep auth state in sync
   */
  private initializeAuth(): void {
    this.supabase.currentUser$.subscribe(async (user) => {
      if (user) {
        await this.fetchProfile(user.id)
      } else {
        this.profileSignal.set(null)
      }
    })
  }

  /**
   * Fetch user profile from database
   *
   * @param {string} userId - User's UUID
   * @returns {Promise<void>}
   */
  private async fetchProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      this.profileSignal.set(data as Profile)
      this.errorSignal.set(null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      this.profileSignal.set(null)
      this.errorSignal.set('Failed to load user profile')
    }
  }

  /**
   * Clear any existing error message
   */
  clearError(): void {
    this.errorSignal.set(null)
  }

  /**
   * Sign up a new user
   *
   * Flow:
   * 1. Create user in auth.users (Supabase Auth)
   * 2. Database trigger automatically creates profile
   * 3. Fetch and cache the new profile
   * 4. Return success response
   *
   * @param {SignUpRequest} request - Sign up data
   * @returns {Observable<AuthResponse>} Result of sign up operation
   */
  signUp(request: SignUpRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)

    return from(
      this.supabase.client.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            full_name: request.full_name,
            role: request.role || UserRole.MEMBER,
          },
        },
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.errorSignal.set(this.formatAuthError(error.message))
          return of({
            success: false,
            error: this.formatAuthError(error.message),
            profile: null,
          })
        }

        if (!data.user) {
          this.errorSignal.set('User creation failed. Please try again.')
          return of({
            success: false,
            error: 'User creation failed',
            profile: null,
          })
        }

        // Profile is created automatically by database trigger
        // Fetch it to update our state
        return from(this.fetchProfile(data.user.id)).pipe(
          map(() => ({
            success: true,
            error: null,
            profile: this.profileSignal(),
          }))
        )
      }),
      catchError((error) => {
        const errorMessage = this.formatAuthError(
          error.message || 'An unexpected error occurred'
        )
        this.errorSignal.set(errorMessage)
        return of({
          success: false,
          error: errorMessage,
          profile: null,
        })
      }),
      map((response) => {
        this.loadingSignal.set(false)
        return response
      })
    )
  }

  /**
   * Sign in an existing user
   *
   * Flow:
   * 1. Authenticate with Supabase Auth
   * 2. Fetch user's profile from database
   * 3. Update profileSignal
   * 4. Return success response
   *
   * @param {SignInRequest} request - Sign in credentials
   * @returns {Observable<AuthResponse>} Result of sign in operation
   */
  signIn(request: SignInRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)

    return from(
      this.supabase.client.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.errorSignal.set(this.formatAuthError(error.message))
          return of({
            success: false,
            error: this.formatAuthError(error.message),
            profile: null,
          })
        }

        if (!data.user) {
          this.errorSignal.set('Sign in failed. Please check your credentials.')
          return of({
            success: false,
            error: 'Sign in failed',
            profile: null,
          })
        }

        // Fetch profile after successful sign in
        return from(this.fetchProfile(data.user.id)).pipe(
          map(() => ({
            success: true,
            error: null,
            profile: this.profileSignal(),
          }))
        )
      }),
      catchError((error) => {
        const errorMessage = this.formatAuthError(
          error.message || 'An unexpected error occurred'
        )
        this.errorSignal.set(errorMessage)
        return of({
          success: false,
          error: errorMessage,
          profile: null,
        })
      }),
      map((response) => {
        this.loadingSignal.set(false)
        return response
      })
    )
  }

  /**
   * Sign out current user
   *
   * Flow:
   * 1. Sign out from Supabase Auth (clears session)
   * 2. Clear profile state
   * 3. Clear any errors
   * 4. Redirect to login page
   *
   * @returns {Promise<void>}
   */
  async signOut(): Promise<void> {
    try {
      this.loadingSignal.set(true)
      this.errorSignal.set(null)

      const { error } = await this.supabase.client.auth.signOut()

      if (error) throw error

      // Clear profile state
      this.profileSignal.set(null)

      // Redirect to login
      this.router.navigate(['/auth/login'])
    } catch (error: any) {
      console.error('Error signing out:', error)
      this.errorSignal.set('Failed to sign out. Please try again.')

      // Even if there's an error, try to clear local state and redirect
      this.profileSignal.set(null)
      this.router.navigate(['/auth/login'])
    } finally {
      this.loadingSignal.set(false)
    }
  }

  /**
   * Update current user's profile
   *
   * @param {Partial<Profile>} updates - Fields to update
   * @returns {Observable<boolean>} True if update succeeded
   */
  updateProfile(updates: Partial<Profile>): Observable<boolean> {
    const userId = this.profileSignal()?.id

    if (!userId) {
      this.errorSignal.set('No user logged in')
      return of(false)
    }

    this.loadingSignal.set(true)

    return from(
      this.supabase.client.from('profiles').update(updates).eq('id', userId)
    ).pipe(
      switchMap(({ error }) => {
        if (error) {
          console.error('Error updating profile:', error)
          this.errorSignal.set('Failed to update profile')
          return of(false)
        }

        // Refresh profile after update
        return from(this.fetchProfile(userId)).pipe(map(() => true))
      }),
      catchError(() => {
        this.errorSignal.set('Failed to update profile')
        return of(false)
      }),
      map((result) => {
        this.loadingSignal.set(false)
        return result
      })
    )
  }

  /**
   * Format auth error messages to be more user-friendly
   *
   * @param {string} error - Raw error message from Supabase
   * @returns {string} User-friendly error message
   */
  private formatAuthError(error: string): string {
    // Common Supabase auth errors mapped to user-friendly messages
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials':
        'Invalid email or password. Please try again.',
      'Email not confirmed':
        'Please verify your email address before signing in.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters':
        'Password must be at least 6 characters long.',
      'Unable to validate email address: invalid format':
        'Please enter a valid email address.',
      'Database error saving new user':
        'Registration failed. Please try again.',
      'signup is disabled':
        'Registration is currently disabled. Please contact support.',
    }

    // Check if error message matches any known patterns
    for (const [key, value] of Object.entries(errorMap)) {
      if (error.includes(key)) {
        return value
      }
    }

    // Return original error if no match found
    return error
  }
}
