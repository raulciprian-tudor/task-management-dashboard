import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Router, RouterModule } from '@angular/router'
import { SignUpRequest } from '../../../../core/models'
import { AuthService } from '../../../../core/services/auth.service'
/**
 * RegisterComponent
 *
 * Handles new user registration
 *
 * Features:
 * - Reactive form with validation
 * - Password confirmation matching
 * - Password visibility toggle
 * - Loading state during registration
 * - Error message display
 * - Responsive split-view layout
 *
 * Flow:
 * 1. User enters full name, email, password, and confirmation
 * 2. Form validates input (including password match)
 * 3. On submit, AuthService.signUp() is called
 * 4. If successful, user is redirected to dashboard
 * 5. If failed, error message is displayed
 */
@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private router = inject(Router)

  registerForm!: FormGroup
  isLoading = false
  errorMessage: string | null = null
  hidePassword = true
  hideConfirmPassword = true

  ngOnInit(): void {
    this.initializeForm()
  }

  /**
   * Initialize the registration form with validation rules
   *
   * Validation:
   * - Full name: required, minimum 2 characters
   * - Email: required, valid email format
   * - Password: required, minimum 6 characters
   * - Confirm password: required, must match password
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    )
  }

  /**
   * Custom validator to check if password and confirmPassword match
   *
   * @param control - The form group
   * @returns ValidationErrors or null
   */
  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password')
    const confirmPassword = control.get('confirmPassword')

    if (!password || !confirmPassword) {
      return null
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true }
  }

  /**
   * Handle form submission
   *
   * Flow:
   * 1. Validate form
   * 2. Show loading state
   * 3. Call AuthService.signUp()
   * 4. Handle response (success or error)
   * 5. Redirect to dashboard on success
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched()
      return
    }

    this.isLoading = true
    this.errorMessage = null

    const signUpData: SignUpRequest = {
      full_name: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    }

    this.authService.signUp(signUpData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard'])
        } else {
          this.errorMessage =
            response.error || 'Registration failed. Please try again.'
          this.isLoading = false
        }
      },
      error: (error) => {
        this.errorMessage = 'An unexpected error occured. Please try again.'
        this.isLoading = false
        console.error('Registration error: ', error)
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
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword
  }

  /**
   * Get form control for template access
   */
  get fullName() {
    return this.registerForm.get('fullName')
  }

  get email() {
    return this.registerForm.get('email')
  }

  get password() {
    return this.registerForm.get('password')
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword')
  }

  /**
   * Check if passwords match
   */
  get passwordsMatch(): boolean {
    return !this.registerForm.hasError('passwordMismatch')
  }
}
