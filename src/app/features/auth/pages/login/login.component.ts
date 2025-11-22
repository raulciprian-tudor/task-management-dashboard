import { CommonModule } from '@angular/common'
import { Component, OnInit, effect } from '@angular/core'
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
 * Updated to use Angular Signals for reactive state management
 */
@Component({
  selector: 'app-login',
  standalone: true,
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
  loginForm!: FormGroup
  hidePassword = true

  // Access auth service signals directly in template
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
   * Initialize the login form with validation rules
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
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched()
      return
    }

    // Clear any previous errors
    this.authService.clearError()

    const credentials: SignInRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    }

    this.authService.signIn(credentials).subscribe({
      next: (response) => {
        // Success is handled by the effect above
        // Errors are handled by the auth service and displayed via signals
      },
      error: (error) => {
        console.error('Login error:', error)
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
