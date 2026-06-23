import {
  Component,
  signal,
  computed,
  output,
  inject,
  effect,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { ClienteService } from '../../services/cliente.service';
import { ExtractResult } from '../../models/cfdi.models';
import { Cliente, ClienteForm, REGIMENES_FISCALES, USOS_CFDI } from '../../models/cliente.models';
import { formatHttpError } from '../../utils/http-error.utils';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'done' | 'error';

type PendingForm = {
  rfc: string;
  nombre: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
};

type UnmatchedReceptor = {
  rfc: string;
  nombre: string | null;
  domicilioFiscal: string | null;
  regimenFiscal: string | null;
  usoCfdi: string | null;
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload.component.html',
})
export class UploadComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly invoiceService = inject(InvoiceService);
  readonly clienteService         = inject(ClienteService);

  readonly regimenes = REGIMENES_FISCALES;
  readonly usosCfdi  = USOS_CFDI;

  state    = signal<UploadState>('idle');
  errorMsg = signal<string | null>(null);
  fileName = signal<string | null>(null);

  selectedCliente   = signal<Cliente | null>(null);
  dropdownOpen      = signal(false);
  clienteSearch     = signal('');
  unmatchedReceptor = signal<UnmatchedReceptor | null>(null);
  pendingForm       = signal<PendingForm | null>(null);
  addingCliente     = signal(false);
  addClienteError   = signal<string | null>(null);
  private pendingId = signal<string | null>(null);

  isIdle      = computed(() => this.state() === 'idle');
  isDragging  = computed(() => this.state() === 'dragging');
  isUploading = computed(() => this.state() === 'uploading');
  isDone      = computed(() => this.state() === 'done');
  isError     = computed(() => this.state() === 'error');

  canAddCliente = computed(() => {
    const f = this.pendingForm();
    if (!f) return false;
    return !!(f.rfc.trim() && f.nombre.trim() && f.domicilioFiscal.trim() && f.regimenFiscal.trim() && f.usoCfdi.trim());
  });

  clientes         = computed(() => this.clienteService.clientes());
  filteredClientes = computed(() => {
    const tokens = this.clienteSearch().toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return this.clientes();
    return this.clientes().filter(c => {
      const haystack = `${c.rfc} ${c.nombre}`.toLowerCase();
      return tokens.every(t => haystack.includes(t));
    });
  });

  extracted = output<ExtractResult>();

  constructor() {
    // When clientes load after extraction, apply any pending auto-selection
    effect(() => {
      const id = this.pendingId();
      if (!id) return;
      const found = this.clientes().find(c => c.id === id);
      if (found) {
        this.selectedCliente.set(found);
        this.unmatchedReceptor.set(null);
        this.pendingForm.set(null);
        this.pendingId.set(null);
      }
    });
  }

  /** Called by SubirComponent when extraction returns a known receptorMatchId. */
  autoSelectById(receptorMatchId: string): void {
    const found = this.clientes().find(c => c.id === receptorMatchId);
    if (found) {
      this.selectedCliente.set(found);
      this.unmatchedReceptor.set(null);
      this.pendingForm.set(null);
    } else {
      this.pendingId.set(receptorMatchId);
    }
  }

  /**
   * Called by SubirComponent after extraction.
   * Pass all 5 receptor fields (null or empty string = not detected).
   * Treats empty string same as null.
   */
  setUnmatchedReceptor(
    rfc: string | null,
    nombre: string | null,
    domicilioFiscal: string | null,
    regimenFiscal: string | null,
    usoCfdi: string | null,
  ): void {
    const n = (v: string | null | undefined): string | null => (v?.trim() || null);
    const normRfc = n(rfc);
    if (!normRfc) {
      this.unmatchedReceptor.set(null);
      this.pendingForm.set(null);
      return;
    }
    this.unmatchedReceptor.set({
      rfc: normRfc,
      nombre: n(nombre),
      domicilioFiscal: n(domicilioFiscal),
      regimenFiscal: n(regimenFiscal),
      usoCfdi: n(usoCfdi),
    });
    this.pendingForm.set({
      rfc: normRfc,
      nombre: n(nombre) ?? '',
      domicilioFiscal: n(domicilioFiscal) ?? '',
      regimenFiscal: n(regimenFiscal) ?? '',
      usoCfdi: n(usoCfdi) ?? '',
    });
    this.addClienteError.set(null);
  }

  updatePendingField(field: keyof PendingForm, value: string): void {
    this.pendingForm.update(f => f ? { ...f, [field]: value } : null);
  }

  confirmAddCliente(): void {
    const f = this.pendingForm();
    if (!f || this.addingCliente()) return;
    this.addingCliente.set(true);
    this.addClienteError.set(null);
    const form: ClienteForm = {
      rfc: f.rfc.trim(),
      nombre: f.nombre.trim(),
      domicilioFiscal: f.domicilioFiscal.trim(),
      regimenFiscal: f.regimenFiscal.trim(),
      usoCfdiDefault: f.usoCfdi.trim(),
      email: '',
      telefono: '',
    };
    this.clienteService.create(form).subscribe({
      next: (c) => {
        this.addingCliente.set(false);
        this.selectedCliente.set(c);
        this.unmatchedReceptor.set(null);
        this.pendingForm.set(null);
        this.addClienteError.set(null);
      },
      error: (err) => {
        this.addingCliente.set(false);
        this.addClienteError.set(formatHttpError(err, 'Error al crear el cliente.'));
      },
    });
  }

  dismissAddCliente(): void {
    this.unmatchedReceptor.set(null);
    this.pendingForm.set(null);
    this.addClienteError.set(null);
  }

  ngOnInit(): void {
    this.clienteService.list().subscribe();
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.dropdownOpen.set(false); }

  toggleDropdown(e: MouseEvent): void {
    e.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  onSearchInput(e: Event): void {
    this.clienteSearch.set((e.target as HTMLInputElement).value);
  }

  selectCliente(c: Cliente, e: MouseEvent): void {
    e.stopPropagation();
    this.selectedCliente.set(this.selectedCliente()?.id === c.id ? null : c);
    this.dropdownOpen.set(false);
    this.clienteSearch.set('');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.state() !== 'uploading' && this.state() !== 'done') {
      this.state.set('dragging');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.state() === 'dragging') this.state.set('idle');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.state() === 'uploading') return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.processFile(files[0]);
    else this.state.set('idle');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.processFile(input.files[0]);
  }

  openFilePicker(): void {
    if (this.state() === 'uploading') return;
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  retry(): void {
    this.state.set('idle');
    this.errorMsg.set(null);
    this.fileName.set(null);
    this.unmatchedReceptor.set(null);
    this.pendingForm.set(null);
    this.addClienteError.set(null);
    this.selectedCliente.set(null);
  }

  private readonly ACCEPTED_EXTENSIONS = [
    '.pdf', '.xlsx', '.xls', '.xlsm', '.csv',
    '.jpg', '.jpeg', '.png', '.tif', '.tiff',
    '.docx', '.docm', '.txt', '.xml',
  ];

  private processFile(file: File): void {
    const nameLower = file.name.toLowerCase();
    const hasValidExt = this.ACCEPTED_EXTENSIONS.some(ext => nameLower.endsWith(ext));
    if (!hasValidExt) {
      this.state.set('error');
      this.errorMsg.set('Solo se permiten archivos PDF, Excel, CSV, imagen (JPG/PNG/TIFF), Word (DOCX), texto (.txt) o XML CFDI.');
      this.fileName.set(file.name);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.state.set('error');
      this.errorMsg.set(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB} MB.`);
      this.fileName.set(file.name);
      return;
    }

    this.fileName.set(file.name);
    this.state.set('uploading');
    this.errorMsg.set(null);

    this.invoiceService.extractInvoice(file).subscribe({
      next: (result) => { this.state.set('done'); this.extracted.emit(result); },
      error: (err) => {
        this.state.set('error');
        this.errorMsg.set(formatHttpError(err, 'Ocurrió un error al procesar el archivo.'));
      },
    });
  }
}
