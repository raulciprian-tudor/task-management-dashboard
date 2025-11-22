import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Router, RouterModule } from '@angular/router'
import { SignInRequest } from '../../../../core/models'
import { AuthService } from '../../../../core/services/auth.service'

/**
 * LoginComponent
 *
 * Handles user authentication via email/password
 *
 * Features:
 * - Reactive form with validation
 * - Remember me functionality
 * - Password visibility toggle
 * - Loading state during authentication
 * - Error message display
 * - Responsive split-view layout
 *
 * Flow:
 * 1. User enters email and password
 * 2. Form validates input
 * 3. On submit, AuthService.signIn() is called
 * 4. If successful, user is redirected to dashboard
 * 5. If failed, error message is displayed
 */

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private router = inject(Router)

  loginForm!: FormGroup
  isLoading = false
  errorMessage: string | null = null
  hidePassword = true

  ngOnInit(): void {
    this.initializeForm()
  }

  /**
   * Initialize the login form with validation rules
   *
   * Validation:
   * - Email: required, valid email format
   * - Password: required, minimum 6 characters
   * - Remember me: optional boolean
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    })
  }

  /**
   * Handle form submission
   *
   * Flow:
   * 1. Validate form
   * 2. Show loading state
   * 3. Call AuthService.signIn()
   * 4. Handle response (success or error)
   * 5. Redirect to dashboard on success
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched()
      return
    }

    this.isLoading = true
    this.errorMessage = null

    const credentials: SignInRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    }

    this.authService.signIn(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          // TODO: Implement "Remember me" functionality with local storage
          this.router.navigate(['/dashboard'])
        } else {
          this.errorMessage =
            response.error || 'Sign in failed. Please try again.'
          this.isLoading = false
        }
      },
      error: (error) => {
        this.errorMessage = 'An unexpected error occured. Please try again.'
        this.isLoading = false
        console.error('Login error: ', error)
      },
    })
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword
  }

  /**
   * Get form control for template access
   */
  get email() {
    return this.loginForm.get('email')
  }

  get password() {
    return this.loginForm.get('password')
  }
}
