import { Component, signal, ViewChild, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UploadComponent } from '../upload/upload.component';
import { PreviewComponent } from '../preview/preview.component';
import { ExtractResult, buildManualExtractResult } from '../../models/cfdi.models';
import { TimbradoService } from '../../services/timbrado.service';
import { TimbradoDto, TimbradoUsoDto } from '../../models/timbrado.models';
import { ParsedError, parseHttpError } from '../../utils/http-error.utils';

type TimbradoState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-subir',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, UploadComponent, PreviewComponent],
  template: `
    <div class="p-6 max-w-5xl mx-auto">

      <!-- ── Modal: excedente de timbrado ──────────────────────────────────── -->
      @if (mostrarAdvertencia() && usoActual()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 shrink-0">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.928-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div>
                <p class="text-base font-bold text-slate-900">Límite de timbrados alcanzado</p>
                <p class="text-sm text-slate-600 mt-1">
                  Has usado <span class="font-semibold">{{ usoActual()!.realizados }}/{{ usoActual()!.incluidos }}</span> timbrados incluidos en tu plan este mes.
                </p>
                <p class="text-sm text-slate-600 mt-1">
                  Este timbrado generará un cargo adicional de
                  <span class="font-bold text-amber-700">
                    {{ usoActual()!.precioExcedenteMxn | currency:'MXN':'symbol':'1.2-2':'es-MX' }} MXN
                  </span>
                  por excedente.
                </p>
              </div>
            </div>
            <div class="flex gap-3 justify-end pt-1">
              <button type="button" (click)="cancelarTimbrar()"
                      class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100
                             hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="button" (click)="confirmarTimbrar()"
                      class="px-4 py-2 text-sm font-bold text-white bg-indigo-600
                             hover:bg-indigo-700 rounded-xl transition-colors">
                Continuar y timbrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-xl font-bold text-slate-900">Subir factura / solicitud</h1>
        <p class="text-sm text-slate-500 mt-0.5">
          Carga un PDF, Excel, CSV, imagen, Word, TXT o XML CFDI para extraer los campos automáticamente.
        </p>
      </div>

      <!-- Upload card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <app-upload #uploadRef (extracted)="onExtracted($event)" (manualStart)="startManualDraft()" />
      </div>

      <!-- Preview -->
      @if (result()) {
        <app-preview #previewRef [result]="result()!" [cliente]="uploadRef.selectedCliente()" />
      }

      <!-- ── Timbrar section ──────────────────────────────────────────────── -->
      @if (result()?.success && result()?.cfdiFields) {
        <div class="mt-6">

          <!-- Idle / error: show Timbrar button -->
          @if (timbradoState() === 'idle' || timbradoState() === 'error') {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">

              <!-- No client selected warning -->
              @if (!uploadRef.selectedCliente()) {
                <div class="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.928-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  Selecciona un cliente (receptor) en el panel de arriba para poder timbrar.
                </div>
              }

              <!-- Error message from previous attempt -->
              @if (timbradoState() === 'error' && timbradoError()) {
                <div class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <svg class="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="flex flex-col gap-1.5 min-w-0">
                    <p class="text-sm font-semibold text-red-700">{{ timbradoError()!.message }}</p>
                    @if (timbradoError()!.details.length > 0) {
                      <ul class="list-disc list-inside flex flex-col gap-0.5 pl-1">
                        @for (d of timbradoError()!.details; track $index) {
                          <li class="text-xs text-red-600">{{ d }}</li>
                        }
                      </ul>
                    }
                  </div>
                </div>
              }

              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-700">¿Los campos son correctos?</p>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Edita los campos si es necesario y luego confirma para timbrar con el SAT.
                  </p>
                </div>
                <button
                  (click)="onTimbrar()"
                  [disabled]="!uploadRef.selectedCliente()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                         bg-indigo-600 text-white shadow-sm transition-all
                         hover:bg-indigo-700 active:scale-95 w-full sm:w-auto
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Timbrar CFDI
                </button>
              </div>
            </div>
          }

          <!-- Loading -->
          @if (timbradoState() === 'loading') {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-4">
              <svg class="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p class="text-sm font-semibold text-slate-600">Timbrando con el SAT…</p>
              <p class="text-xs text-slate-400">Esto puede tardar unos segundos</p>
            </div>
          }

          <!-- Success -->
          @if (timbradoState() === 'success' && timbradoResult()) {
            <div class="bg-white rounded-2xl border border-emerald-300 shadow-sm p-6 flex flex-col gap-4">

              <!-- Header -->
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                          d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p class="text-base font-bold text-slate-900">¡CFDI Timbrado exitosamente!</p>
                  <p class="text-xs text-slate-500 font-mono mt-0.5">UUID: {{ timbradoResult()!.uuid }}</p>
                </div>
              </div>

              @if (timbradoResult()!.yaExistia) {
                <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Este CFDI ya había sido timbrado. Mostramos el timbrado existente; no se generó otro CFDI ni se consumió un timbrado adicional.
                </div>
              }

              <!-- Details grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div class="bg-slate-50 rounded-xl px-4 py-3">
                  <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Receptor</p>
                  <p class="font-semibold text-slate-800">{{ timbradoResult()!.nombreReceptor ?? '—' }}</p>
                  <p class="font-mono text-xs text-slate-500">{{ timbradoResult()!.rfcReceptor }}</p>
                </div>
                <div class="bg-slate-50 rounded-xl px-4 py-3">
                  <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Total</p>
                  <p class="font-bold text-slate-800 text-lg">
                    {{ formatCurrency(timbradoResult()!.total) }}
                  </p>
                </div>
                <div class="bg-slate-50 rounded-xl px-4 py-3">
                  <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Fecha timbrado</p>
                  <p class="font-semibold text-slate-700">{{ formatDate(timbradoResult()!.fechaTimbrado) }}</p>
                </div>
                <div class="bg-slate-50 rounded-xl px-4 py-3">
                  <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Tipo</p>
                  <p class="font-semibold text-slate-700">{{ tipoLabel(timbradoResult()!.tipoComprobante) }}</p>
                </div>
              </div>

              <!-- Download buttons -->
              <div class="flex flex-wrap gap-3 pt-1">
                <button
                  (click)="downloadXml()"
                  [disabled]="!timbradoResult()!.xmlBase64"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-slate-800 text-white hover:bg-slate-700 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Descargar XML
                </button>
                <button
                  (click)="downloadPdf()"
                  [disabled]="!timbradoResult()!.pdfBase64"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-red-600 text-white hover:bg-red-700 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  Descargar PDF
                </button>
                <a
                  routerLink="/timbrados"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors ml-auto">
                  Ver historial
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>

              <!-- Timbrar otro -->
              <button
                (click)="resetAll()"
                class="text-xs text-slate-400 hover:text-indigo-600 underline underline-offset-2 self-start transition-colors">
                Subir otra factura
              </button>
            </div>
          }

        </div>
      }

    </div>
  `,
})
export class SubirComponent {
  @ViewChild('uploadRef')  uploadRef!:  UploadComponent;
  @ViewChild('previewRef') previewRef?: PreviewComponent;

  private readonly timbradoService = inject(TimbradoService);

  result         = signal<ExtractResult | null>(null);
  timbradoState  = signal<TimbradoState>('idle');
  timbradoResult = signal<TimbradoDto | null>(null);
  timbradoError  = signal<ParsedError | null>(null);

  // ── Excess warning modal ───────────────────────────────────────────────────
  mostrarAdvertencia = signal(false);
  usoActual          = signal<TimbradoUsoDto | null>(null);

  onExtracted(r: ExtractResult): void {
    this.result.set(r);
    this.timbradoState.set('idle');
    this.timbradoResult.set(null);
    this.timbradoError.set(null);

    if (r.cfdiFields?.receptorMatchId) {
      this.uploadRef?.setUnmatchedReceptor(null, null, null, null, null);
      this.uploadRef?.autoSelectById(r.cfdiFields.receptorMatchId);
    } else {
      this.uploadRef?.setUnmatchedReceptor(
        r.cfdiFields?.rfcReceptor ?? null,
        r.cfdiFields?.nombreReceptor ?? null,
        r.cfdiFields?.domicilioFiscalReceptor ?? null,
        r.cfdiFields?.regimenFiscalReceptor ?? null,
        r.cfdiFields?.usoCfdi ?? null,
      );
    }
  }

  /** Entry point for "Crear factura en blanco" — bypasses extraction entirely. */
  startManualDraft(): void {
    this.result.set(buildManualExtractResult());
    this.timbradoState.set('idle');
    this.timbradoResult.set(null);
    this.timbradoError.set(null);
  }

  onTimbrar(): void {
    const cliente = this.uploadRef?.selectedCliente();
    const fields  = this.previewRef?.getCurrentFields() ?? this.result()?.cfdiFields;
    if (!cliente || !fields) return;

    // Check uso before stamping — warn if over limit
    this.timbradoService.getUso().subscribe({
      next: (uso) => {
        if (!uso.esPlanIlimitado && uso.realizados >= uso.incluidos) {
          this.usoActual.set(uso);
          this.mostrarAdvertencia.set(true);
        } else {
          this.executeTimbrar(cliente.id, fields);
        }
      },
      error: () => this.executeTimbrar(cliente.id, fields), // if uso fails, proceed anyway
    });
  }

  confirmarTimbrar(): void {
    this.mostrarAdvertencia.set(false);
    const cliente = this.uploadRef?.selectedCliente();
    const fields  = this.previewRef?.getCurrentFields() ?? this.result()?.cfdiFields;
    if (cliente && fields) this.executeTimbrar(cliente.id, fields);
  }

  cancelarTimbrar(): void { this.mostrarAdvertencia.set(false); }

  private executeTimbrar(receptorId: string, fields: any): void {
    this.timbradoState.set('loading');
    this.timbradoError.set(null);

    this.timbradoService
      .timbrar({ receptorId, camposExtraidos: fields })
      .subscribe({
        next: (dto) => {
          this.timbradoResult.set(dto);
          this.timbradoState.set('success');
        },
        error: (err) => {
          this.timbradoError.set(
            parseHttpError(err, 'Error al timbrar. Verifica tu configuración CSD y vuelve a intentarlo.')
          );
          this.timbradoState.set('error');
        },
      });
  }

  downloadXml(): void {
    const t = this.timbradoResult();
    if (t) this.timbradoService.downloadXml(t);
  }

  downloadPdf(): void {
    const t = this.timbradoResult();
    if (t) this.timbradoService.downloadPdf(t);
  }

  resetAll(): void {
    this.result.set(null);
    this.timbradoState.set('idle');
    this.timbradoResult.set(null);
    this.timbradoError.set(null);
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
        dateStyle: 'medium',
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
}
