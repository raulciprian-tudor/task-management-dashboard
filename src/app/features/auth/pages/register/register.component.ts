import { CommonModule } from '@angular/common'
import { Component, OnInit, effect } from '@angular/core'
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
 * Updated to use Angular Signals for reactive state management
 */
@Component({
  selector: 'app-register',
  standalone: true,
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
  registerForm!: FormGroup
  hidePassword = true
  hideConfirmPassword = true

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {
    // Effect to handle successful authentication
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard'])
      }
    })
  }

  ngOnInit(): void {
    this.initializeForm()
  }

  /**
   * Initialize the registration form with validation rules
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
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched()
      return
    }

    // Clear any previous errors
    this.authService.clearError()

    const signUpData: SignUpRequest = {
      full_name: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    }

    this.authService.signUp(signUpData).subscribe({
      next: (response) => {
        // Success is handled by the effect above
      },
      error: (error) => {
        console.error('Registration error:', error)
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
