import { Component, effect, input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExtractResult, CfdiFields, Concepto } from '../../models/cfdi.models';
import { Cliente, USOS_CFDI } from '../../models/cliente.models';
import { LicenciaDto, LicenciaService } from '../../services/licencia.service';

type IvaRate = '16' | '8' | '0';

const FORMAS_PAGO = [
  { clave: '01', desc: 'Efectivo' },
  { clave: '02', desc: 'Cheque nominativo' },
  { clave: '03', desc: 'Transferencia electrónica' },
  { clave: '04', desc: 'Tarjeta de crédito' },
  { clave: '28', desc: 'Tarjeta de débito' },
  { clave: '99', desc: 'Por definir' },
];

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preview.component.html',
})
export class PreviewComponent implements OnInit {
  private readonly licenciaService = inject(LicenciaService);

  result  = input.required<ExtractResult>();
  cliente = input<Cliente | null>(null);

  licencia          = signal<LicenciaDto | null>(null);
  conceptosEditMode = signal(false);
  ivaRate           = signal<IvaRate>('16');
  isrRatePct        = signal<string>('');
  usoCfdiOverride   = signal<string>('G01');

  draft: CfdiFields | null = null;

  readonly usosCfdi   = USOS_CFDI;
  readonly formasPago = FORMAS_PAGO;

  constructor() {
    effect(() => {
      const fields = this.result().cfdiFields;
      if (fields) {
        this.draft = structuredClone(fields);
        this.draft.fecha = this.normalizeFecha(fields.fecha);
      } else {
        this.draft = null;
      }
      this.conceptosEditMode.set(false);
      if (fields) this.initRatesFromFields(fields);
    });

    effect(() => {
      const c = this.cliente();
      if (c) this.usoCfdiOverride.set(c.usoCfdiDefault);
    });
  }

  ngOnInit(): void {
    this.licenciaService.getLicencia().subscribe(l => this.licencia.set(l));
  }

  private initRatesFromFields(fields: CfdiFields): void {
    const subtotal = parseFloat(fields.subTotal ?? '0');
    if (subtotal <= 0) return;

    const iva = parseFloat(fields.totalImpuestosTrasladados ?? '0');
    const ivaRatio = iva / subtotal;
    if (Math.abs(ivaRatio - 0.08) < 0.01) this.ivaRate.set('8');
    else if (ivaRatio < 0.01)             this.ivaRate.set('0');
    else                                   this.ivaRate.set('16');

    const isr = parseFloat(fields.totalImpuestosRetenidos ?? '0');
    this.isrRatePct.set(
      isr > 0 ? ((isr / subtotal) * 100).toFixed(4).replace(/\.?0+$/, '') : ''
    );
  }

  onFechaChange(date: string): void {
    if (!this.draft) return;
    this.draft.fecha = this.normalizeFecha(date);
  }

  private normalizeFecha(raw: string | null | undefined): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const time = `T${hh}:${mm}:${ss}`;

    if (!raw) return `${this.todayLocal()}${time}`;

    const datePart = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return `${datePart}${time}`;
    return `${this.todayLocal()}${time}`;
  }

  private todayLocal(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Conceptos edit ────────────────────────────────────────────────────────

  enterConceptosEdit(): void { this.conceptosEditMode.set(true); }

  cancelConceptosEdit(): void {
    const fields = this.result().cfdiFields;
    if (fields) this.draft = structuredClone(fields);
    this.conceptosEditMode.set(false);
  }

  confirmConceptosEdit(): void {
    this.recalcTotals();
    this.conceptosEditMode.set(false);
  }

  addConcepto(): void {
    if (!this.draft) return;
    const blank: Concepto = {
      claveProdServ: null, noIdentificacion: null, cantidad: 1,
      claveUnidad: null, unidad: null, descripcion: null,
      valorUnitario: 0, importe: 0, descuento: null,
    };
    this.draft.conceptos = [...(this.draft.conceptos ?? []), blank];
  }

  removeConcepto(index: number): void {
    if (!this.draft) return;
    this.draft.conceptos = this.draft.conceptos.filter((_, i) => i !== index);
    this.recalcTotals();
  }

  recalcImporte(index: number): void {
    if (!this.draft) return;
    const c = this.draft.conceptos[index];
    c.importe = parseFloat(((c.cantidad ?? 0) * (c.valorUnitario ?? 0)).toFixed(2));
    this.recalcTotals();
  }

  setIvaRate(rate: IvaRate): void {
    this.ivaRate.set(rate);
    if (this.draft) this.recalcTotals();
  }

  onIsrInput(event: Event): void {
    this.isrRatePct.set((event.target as HTMLInputElement).value);
    if (this.draft) this.recalcTotals();
  }

  private recalcTotals(): void {
    if (!this.draft) return;
    const subtotal = this.draft.conceptos.reduce((s, c) => s + (c.importe ?? 0), 0);
    this.draft.subTotal = subtotal.toFixed(2);

    const ivaMul = ({ '16': 0.16, '8': 0.08, '0': 0 } as Record<IvaRate, number>)[this.ivaRate()];
    const iva    = parseFloat((subtotal * ivaMul).toFixed(2));
    this.draft.totalImpuestosTrasladados = ivaMul > 0 ? iva.toFixed(2) : null;

    const isrPct = parseFloat(this.isrRatePct());
    const isr    = !isNaN(isrPct) && isrPct > 0
      ? parseFloat((subtotal * isrPct / 100).toFixed(2))
      : 0;
    this.draft.totalImpuestosRetenidos = isr > 0 ? isr.toFixed(2) : null;

    // Populate the structured ISR entry that the backend reads at timbrado time.
    // CfdiBuilderService reads isrRate from impuestosRetenidos[impuesto=="001"].tasaOCuota;
    // without this, ISR is silently dropped from the stamped CFDI total.
    this.draft.impuestosRetenidos = isr > 0
      ? [{
          base:       subtotal.toFixed(2),
          impuesto:   '001',
          tipoFactor: 'Tasa',
          tasaOCuota: (isrPct / 100).toFixed(6),
          importe:    isr.toFixed(2),
        }]
      : (this.draft.impuestosRetenidos ?? []).filter(r => r.impuesto !== '001');

    this.draft.total = (subtotal + iva - isr).toFixed(2);
  }

  /** Called by SubirComponent at timbrar time to get latest edited state. */
  getCurrentFields(): CfdiFields | null {
    if (!this.draft) return null;
    return { ...this.draft, usoCfdi: this.usoCfdiOverride() };
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  formatCurrency(val: string | number | null): string {
    if (val === null || val === undefined || val === '') return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);
    return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  ivaLabel(): string {
    const map: Record<IvaRate, string> = {
      '16': 'IVA (16%)',
      '8':  'IVA Fronterizo (8%)',
      '0':  'Sin IVA (0%)',
    };
    return map[this.ivaRate()];
  }
}
