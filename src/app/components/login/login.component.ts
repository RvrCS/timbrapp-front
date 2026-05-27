import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  email       = signal('');
  password    = signal('');
  loading     = signal(false);
  error       = signal<string | null>(null);
  showPw      = signal(false);
  currentYear = new Date().getFullYear();

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService
      .login({ email: this.email(), password: this.password() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/subir']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err?.error?.error ?? 'Correo o contraseña incorrectos.';
          this.error.set(msg);
        },
      });
  }

  onEmailInput(e: Event)    { this.email.set((e.target as HTMLInputElement).value); }
  onPasswordInput(e: Event) { this.password.set((e.target as HTMLInputElement).value); }
  togglePw()                { this.showPw.update((v) => !v); }
}
