import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject, from, Observable, of } from 'rxjs'
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
 * Handles all authentication operations and user profile management.
 *
 * Responsibilities:
 * - User registration (sign-up)
 * - User login (sign-in)
 * - User logout (sign-out)
 * - Profile fetching and caching
 * - Auth state management
 *
 * Flow:
 * 1. User signs up → Supabase creates auth.users entry
 * 2. Database trigger creates profile automatically
 * 3. Service fetches profile and stores in BehaviorSubject
 * 4. Components subscribe to profile$ to react to auth changes
 *
 */

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService)
  private router = inject(Router)

  /**
   * BehaviorSubject holding current user's profile
   * Emits null when user is not authenticated
   */
  private profileSubject = new BehaviorSubject<Profile | null>(null)

  /**
   * Observable stream of current user profile
   * Components subscribe to this for reactive auth state
   */
  public readonly profile$: Observable<Profile | null> =
    this.profileSubject.asObservable()

  /**
   * Loading state for auth operations
   */
  private loadingSubject = new BehaviorSubject<boolean>(false)
  public readonly loading$: Observable<boolean> =
    this.loadingSubject.asObservable()

  constructor() {
    // Initialize profile on service creation
    this.initializeProfile()
  }

  /**
   * Synchronous getter for current profile
   *
   * @returns {Profile | null} Current user profile or null
   */
  get currentProfile(): Profile | null {
    return this.profileSubject.value
  }

  /**
   * Check if user is authenticated
   *
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated(): boolean {
    return this.currentProfile !== null
  }

  /**
   * Check if current user is admin
   *
   * @returns {boolean} True if user has admin role
   */
  isAdmin(): boolean {
    return this.currentProfile?.role === UserRole.ADMIN
  }

  /**
   * Initialize profile from current auth session
   * Called on service creation and after auth state changes
   *
   * Flow:
   * 1. Check if user is authenticated in Supabase
   * 2. If yes, fetch their profile from database
   * 3. Update profileSubject with fetched data
   */
  private initializeProfile(): void {
    this.supabase.currentUser$.subscribe(async (user) => {
      if (user) {
        await this.fetchProfile(user.id)
      } else {
        this.profileSubject.next(null)
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

      this.profileSubject.next(data as Profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      this.profileSubject.next(null)
    }
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
    this.loadingSubject.next(true)

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
          return of({
            success: false,
            error: error.message,
            profile: null,
          })
        }

        if (!data.user) {
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
            profile: this.currentProfile,
          }))
        )
      }),
      catchError((error) => {
        return of({
          success: false,
          error: error.message || 'An unexpected error occurred',
          profile: null,
        })
      }),
      map((response) => {
        this.loadingSubject.next(false)
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
   * 3. Update profileSubject
   * 4. Return success response
   *
   * @param {SignInRequest} request - Sign in credentials
   * @returns {Observable<AuthResponse>} Result of sign in operation
   */
  signIn(request: SignInRequest): Observable<AuthResponse> {
    this.loadingSubject.next(true)

    return from(
      this.supabase.client.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          return of({
            success: false,
            error: error.message,
            profile: null,
          })
        }

        if (!data.user) {
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
            profile: this.currentProfile,
          }))
        )
      }),
      catchError((error) => {
        return of({
          success: false,
          error: error.message || 'An unexpected error occurred',
          profile: null,
        })
      }),
      map((response) => {
        this.loadingSubject.next(false)
        return response
      })
    )
  }

  /**
   * Sign out current user
   *
   * Flow:
   * 1. Sign out from Supabase Auth
   * 2. Clear profile state
   * 3. Redirect to login page
   *
   * @returns {Promise<void>}
   */
  async signOut(): Promise<void> {
    try {
      this.loadingSubject.next(true)

      const { error } = await this.supabase.client.auth.signOut()

      if (error) throw error

      // Clear profile state
      this.profileSubject.next(null)

      // Redirect to login
      this.router.navigate(['/auth/login'])
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      this.loadingSubject.next(false)
    }
  }

  /**
   * Update current user's profile
   *
   * @param {Partial<Profile>} updates - Fields to update
   * @returns {Observable<boolean>} True if update succeeded
   */
  updateProfile(updates: Partial<Profile>): Observable<boolean> {
    const userId = this.currentProfile?.id

    if (!userId) {
      return of(false)
    }

    return from(
      this.supabase.client.from('profiles').update(updates).eq('id', userId)
    ).pipe(
      switchMap(({ error }) => {
        if (error) {
          console.error('Error updating profile:', error)
          return of(false)
        }

        // Refresh profile after update
        return from(this.fetchProfile(userId)).pipe(map(() => true))
      }),
      catchError(() => of(false))
    )
  }
}
