import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-password.component.html',
})
export class CambiarPasswordComponent {
  private readonly authService = inject(AuthService);

  currentPassword = signal('');
  newPassword     = signal('');
  confirmPassword = signal('');
  showCurrent     = signal(false);
  showNew         = signal(false);
  showConfirm     = signal(false);
  loading         = signal(false);
  error           = signal<string | null>(null);
  success         = signal(false);

  get newPasswordError(): string | null {
    const v = this.newPassword();
    if (v.length > 0 && v.length < 8) return 'Mínimo 8 caracteres.';
    return null;
  }

  get confirmPasswordError(): string | null {
    const c = this.confirmPassword();
    if (c.length > 0 && c !== this.newPassword()) return 'Las contraseñas no coinciden.';
    return null;
  }

  get canSubmit(): boolean {
    return (
      this.currentPassword().length > 0 &&
      this.newPassword().length >= 8 &&
      this.confirmPassword() === this.newPassword() &&
      !this.loading()
    );
  }

  onCurrentInput(e: Event)  { this.currentPassword.set((e.target as HTMLInputElement).value); }
  onNewInput(e: Event)      { this.newPassword.set((e.target as HTMLInputElement).value); }
  onConfirmInput(e: Event)  { this.confirmPassword.set((e.target as HTMLInputElement).value); }

  onSubmit(): void {
    if (!this.canSubmit) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    this.authService.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Error al cambiar la contraseña. Intente de nuevo.');
      },
    });
  }
}
