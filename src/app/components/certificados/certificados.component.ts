import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicenciaService, FacturamaCsdStatus } from '../../services/licencia.service';

interface CsdInfo {
  numeroCertificado: string;
  rfc: string;
  nombre: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  status: 'vigente' | 'por_vencer' | 'vencido';
}

@Component({
  selector: 'app-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificados.component.html',
})
export class CertificadosComponent implements OnInit {
  private readonly licenciaService = inject(LicenciaService);

  csdActual     = signal<CsdInfo | null>(null);
  cerFile       = signal<File | null>(null);
  keyFile       = signal<File | null>(null);
  password      = signal('');
  showPw        = signal(false);
  uploading     = signal(false);
  uploadError   = signal<string | null>(null);
  facturamaSync = signal<FacturamaCsdStatus | 'loading' | null>(null);

  ngOnInit(): void {
    this.licenciaService.getLicencia().subscribe({
      next: (l) => {
        if (!l.tieneCsd || !l.numeroCertificado) return;
        const vigencia = l.certificadoVigencia ? new Date(l.certificadoVigencia) : null;
        const now      = new Date();
        const daysLeft = vigencia ? (vigencia.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : -1;
        const status: CsdInfo['status'] =
          daysLeft < 0   ? 'vencido'    :
          daysLeft <= 30 ? 'por_vencer' : 'vigente';

        this.csdActual.set({
          numeroCertificado: l.numeroCertificado,
          rfc:               l.rfcEmisor,
          nombre:            l.nombreEmisor,
          vigenciaDesde:     '',
          vigenciaHasta:     vigencia ? vigencia.toISOString().split('T')[0] : '',
          status,
        });

        this.cargarSincronizacion();
      },
      error: () => { /* no licencia configured yet — stay null */ },
    });
  }

  private cargarSincronizacion(): void {
    this.facturamaSync.set('loading');
    this.licenciaService.verificarCsdFacturama().subscribe({
      next:  (s) => this.facturamaSync.set(s),
      error: ()  => this.facturamaSync.set(null),
    });
  }

  onCerSelected(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    if (f && !f.name.endsWith('.cer')) {
      this.uploadError.set('El certificado debe ser un archivo .cer');
      return;
    }
    this.cerFile.set(f);
    this.uploadError.set(null);
  }

  onKeySelected(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    if (f && !f.name.endsWith('.key')) {
      this.uploadError.set('La llave privada debe ser un archivo .key');
      return;
    }
    this.keyFile.set(f);
    this.uploadError.set(null);
  }

  onPasswordInput(e: Event): void {
    this.password.set((e.target as HTMLInputElement).value);
  }

  togglePw(): void { this.showPw.update(v => !v); }

  canUpload(): boolean {
    return !!this.cerFile() && !!this.keyFile() && this.password().length > 0;
  }

  upload(): void {
    if (!this.canUpload()) return;
    this.uploading.set(true);
    this.uploadError.set(null);

    this.licenciaService.subirCsd(this.cerFile()!, this.keyFile()!, this.password())
      .subscribe({
        next: (res) => {
          const vigencia = new Date(res.vigencia);
          const now      = new Date();
          const daysLeft = (vigencia.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          const status: CsdInfo['status'] =
            daysLeft < 0   ? 'vencido'    :
            daysLeft <= 30 ? 'por_vencer' : 'vigente';

          this.csdActual.set({
            numeroCertificado: res.numeroCertificado,
            rfc:               res.rfcDelCertificado,
            nombre:            '',
            vigenciaDesde:     '',
            vigenciaHasta:     vigencia.toISOString().split('T')[0],
            status,
          });
          this.cerFile.set(null);
          this.keyFile.set(null);
          this.password.set('');
          this.uploading.set(false);
          this.cargarSincronizacion();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Error al subir el CSD. Intente de nuevo.';
          this.uploadError.set(msg);
          this.uploading.set(false);
        },
      });
  }

  syncLabel(): string {
    const s = this.facturamaSync();
    if (s === 'loading') return 'Verificando...';
    if (s === null)      return 'Sin verificar';
    return s.sincronizado ? 'Sincronizado con Facturama' : 'No sincronizado';
  }

  syncClass(): string {
    const s = this.facturamaSync();
    if (s === 'loading') return 'bg-slate-100 text-slate-500';
    if (s === null)      return 'bg-slate-100 text-slate-500';
    return s.sincronizado
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700';
  }

  statusLabel(s: CsdInfo['status']): string {
    return { vigente: 'Vigente', por_vencer: 'Por vencer', vencido: 'Vencido' }[s];
  }
  statusClass(s: CsdInfo['status']): string {
    return {
      vigente:    'bg-emerald-100 text-emerald-700',
      por_vencer: 'bg-yellow-100 text-yellow-700',
      vencido:    'bg-red-100 text-red-700',
    }[s];
  }
}
