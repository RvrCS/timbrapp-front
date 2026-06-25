import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimbradoService } from '../../services/timbrado.service';
import { TimbradoDto, TimbradoUsoDto } from '../../models/timbrado.models';
import { formatHttpError } from '../../utils/http-error.utils';

@Component({
  selector: 'app-timbrados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timbrados.component.html',
})
export class TimbradosComponent implements OnInit {
  private readonly timbradoService = inject(TimbradoService);

  timbrados   = signal<TimbradoDto[]>([]);
  uso         = signal<TimbradoUsoDto | null>(null);
  loading     = signal(true);
  error       = signal<string | null>(null);

  filterAnio  = signal<string>('');
  filterMes   = signal<string>('');

  // ── Cancelación ────────────────────────────────────────────────────────────
  cancelTarget   = signal<TimbradoDto | null>(null);
  cancelMotivo   = signal<string>('01');
  cancelling     = signal(false);
  cancelError    = signal<string | null>(null);

  // ── Sync estado SAT ────────────────────────────────────────────────────────
  syncingId      = signal<string | null>(null);

  readonly motivosCancelacion = [
    { clave: '01', desc: '01 — Comprobante con errores con relación' },
    { clave: '02', desc: '02 — Comprobante con errores sin relación' },
    { clave: '03', desc: '03 — No se llevó a cabo la operación' },
    { clave: '04', desc: '04 — Operación nominativa (factura global)' },
  ];

  readonly years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  readonly months = [
    { val: 1,  label: 'Enero' },    { val: 2,  label: 'Febrero' },
    { val: 3,  label: 'Marzo' },    { val: 4,  label: 'Abril' },
    { val: 5,  label: 'Mayo' },     { val: 6,  label: 'Junio' },
    { val: 7,  label: 'Julio' },    { val: 8,  label: 'Agosto' },
    { val: 9,  label: 'Septiembre' },{ val: 10, label: 'Octubre' },
    { val: 11, label: 'Noviembre' },{ val: 12, label: 'Diciembre' },
  ];

  ngOnInit(): void {
    this.loadTimbrados();
    this.timbradoService.getUso().subscribe({
      next: (u) => this.uso.set(u),
      error: () => { /* non-critical, ignore */ },
    });
  }

  loadTimbrados(force = false): void {
    this.loading.set(true);
    this.error.set(null);

    const anio = this.filterAnio() ? parseInt(this.filterAnio()) : undefined;
    const mes  = this.filterMes()  ? parseInt(this.filterMes())  : undefined;

    this.timbradoService.list(anio, mes, force).subscribe({
      next: (list) => {
        this.timbrados.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'Error al cargar los timbrados.'));
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.filterAnio.set('');
    this.filterMes.set('');
    this.loadTimbrados();
  }

  downloadXml(t: TimbradoDto): void { this.timbradoService.downloadXml(t); }
  downloadPdf(t: TimbradoDto): void { this.timbradoService.downloadPdf(t); }

  openCancelModal(t: TimbradoDto): void {
    this.cancelTarget.set(t);
    this.cancelMotivo.set('01');
    this.cancelError.set(null);
  }

  closeCancelModal(): void {
    if (this.cancelling()) return;
    this.cancelTarget.set(null);
    this.cancelError.set(null);
  }

  onCancelMotivoChange(e: Event): void {
    this.cancelMotivo.set((e.target as HTMLSelectElement).value);
  }

  confirmarCancelacion(): void {
    const t = this.cancelTarget();
    if (!t || this.cancelling()) return;
    this.cancelling.set(true);
    this.cancelError.set(null);

    this.timbradoService.cancelar(t.id, this.cancelMotivo()).subscribe({
      next: (updated) => {
        this.timbrados.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.cancelling.set(false);
        this.cancelTarget.set(null);
      },
      error: (err) => {
        this.cancelError.set(formatHttpError(err, 'Error al cancelar el timbrado.'));
        this.cancelling.set(false);
      },
    });
  }

  syncEstado(t: TimbradoDto): void {
    if (this.syncingId()) return;
    this.syncingId.set(t.id);

    this.timbradoService.syncEstado(t.id).subscribe({
      next: (updated) => {
        this.timbrados.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.syncingId.set(null);
      },
      error: () => this.syncingId.set(null),
    });
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  formatCurrency(val: number | null): string {
    if (val === null || val === undefined) return '—';
    return val.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch { return iso; }
  }

  tipoLabel(t: string | null): string {
    switch (t) {
      case 'I': return 'Ingreso';
      case 'E': return 'Egreso';
      case 'T': return 'Traslado';
      case 'N': return 'Nómina';
      case 'P': return 'Pago';
      default:  return t ?? '—';
    }
  }

  tipoBadgeCls(t: string | null): string {
    switch (t) {
      case 'I': return 'bg-emerald-100 text-emerald-700';
      case 'E': return 'bg-red-100 text-red-700';
      default:  return 'bg-slate-100 text-slate-600';
    }
  }

  estadoLabel(e: string | null): string {
    switch (e) {
      case 'Vigente':   return 'Vigente';
      case 'Cancelado': return 'Cancelado';
      case 'EnProceso': return 'En proceso';
      case 'Error':     return 'Error';
      default:          return e ?? '—';
    }
  }

  estadoBadgeCls(e: string | null): string {
    switch (e) {
      case 'Vigente':   return 'bg-emerald-100 text-emerald-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      case 'EnProceso': return 'bg-amber-100 text-amber-700';
      case 'Error':     return 'bg-slate-100 text-slate-500';
      default:          return 'bg-slate-100 text-slate-500';
    }
  }

  onAnioInput(e: Event)  { this.filterAnio.set((e.target as HTMLSelectElement).value); }
  onMesInput(e: Event)   { this.filterMes.set((e.target as HTMLSelectElement).value);  }

  usoPorcentaje(): number {
    const u = this.uso();
    if (!u || u.esPlanIlimitado || u.incluidos === 0) return 0;
    return Math.min(100, Math.round((u.realizados / u.incluidos) * 100));
  }
}
