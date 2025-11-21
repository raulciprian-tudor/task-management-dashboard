import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * SupabaseService
 * 
 * Centralized service for all Supabase interactions.
 * Implements singleton pattern to ensure single client instance.
 * 
 * Responsibilities:
 * - Initialize and manage Supabase client
 * - Track authentication state
 * - Provide access to Supabase client for other services
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  /**
   * BehaviorSubject to track current authenticated user
   * Emits null when no user is logged in
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /** 
   * Observable stream of current user state
   * Components can subscribe to react to auth changes
   */
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize Supabase client with credentials from env
    this.supabaseClient = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
    )

    // Initialize auth state listener
    this.initAuthListener();
  }

  /**
  * Returns the Supabase client instance
  * Use this to access Supabase features in other services
  * 
  * @returns {SupabaseClient} Supabase client instance
  */
  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  /**
   * Returns the current authenticated user (synchronous)
   * 
   * @returns {User | null} Current user or null if not authenticated
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Initializes authentication state listener
   * Automatically updates currentUser when auth state changes
   * 
   * This runs on service initialization and listens for:
   * - User login
   * - User logout
   * - Token refresh
   * - Session expiration
   */
  private async initAuthListener(): Promise<void> {
    // Get initial session 
    const { data: { session } } = await this.supabaseClient.auth.getSession();
    this.currentUserSubject.next(session?.user ?? null);

    // Listen for auth changes
    this.supabaseClient.auth.onAuthStateChange((_event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    })
  }

  /**
   * Checks if user is currently authenticated
   * 
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}


