import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, ClienteForm, REGIMENES_FISCALES, USOS_CFDI } from '../../models/cliente.models';

type ModalMode = 'crear' | 'editar';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  private readonly svc = inject(ClienteService);

  readonly regimenes   = REGIMENES_FISCALES;
  readonly usosCfdi    = USOS_CFDI;

  loading  = signal(false);
  saving   = signal(false);
  deleting = signal<string | null>(null);
  error    = signal<string | null>(null);
  toast    = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  search   = signal('');
  showModal   = signal(false);
  modalMode   = signal<ModalMode>('crear');
  editingId   = signal<string | null>(null);
  showConfirm = signal<string | null>(null);  // id a borrar

  form = signal<ClienteForm>({
    rfc: '', nombre: '', domicilioFiscal: '', regimenFiscal: '601',
    usoCfdiDefault: 'G01', email: '', telefono: '',
  });

  clientes = computed(() =>
    this.svc.clientes().filter(c => {
      const q = this.search().toLowerCase();
      return !q ||
        c.rfc.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q);
    })
  );

  ngOnInit(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next:  ()  => this.loading.set(false),
      error: ()  => { this.loading.set(false); this.error.set('Error al cargar clientes.'); },
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  openCrear(): void {
    this.form.set({ rfc: '', nombre: '', domicilioFiscal: '', regimenFiscal: '601',
                    usoCfdiDefault: 'G01', email: '', telefono: '' });
    this.modalMode.set('crear');
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openEditar(c: Cliente): void {
    this.form.set({
      rfc: c.rfc, nombre: c.nombre, domicilioFiscal: c.domicilioFiscal,
      regimenFiscal: c.regimenFiscal, usoCfdiDefault: c.usoCfdiDefault,
      email: c.email ?? '', telefono: c.telefono ?? '',
    });
    this.modalMode.set('editar');
    this.editingId.set(c.id);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  // ── Save ───────────────────────────────────────────────────────────────────

  save(): void {
    const f = this.form();
    if (!f.rfc || !f.nombre || !f.domicilioFiscal || !f.regimenFiscal) {
      this.showToast('Completa RFC, nombre, CP y régimen fiscal.', 'error');
      return;
    }
    if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/.test(f.rfc.toUpperCase())) {
      this.showToast('RFC inválido. Verifica el formato.', 'error');
      return;
    }
    if (!/^\d{5}$/.test(f.domicilioFiscal)) {
      this.showToast('El código postal debe tener 5 dígitos.', 'error');
      return;
    }

    const payload = { ...f, rfc: f.rfc.toUpperCase() };
    this.saving.set(true);
    const op = this.modalMode() === 'crear'
      ? this.svc.create(payload)
      : this.svc.update(this.editingId()!, payload);

    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.showToast(
          this.modalMode() === 'crear' ? 'Cliente creado.' : 'Cliente actualizado.',
          'success'
        );
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Error al guardar. Intenta de nuevo.', 'error');
      },
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  confirmDelete(id: string): void { this.showConfirm.set(id); }
  cancelDelete():           void  { this.showConfirm.set(null); }

  doDelete(): void {
    const id = this.showConfirm();
    if (!id) return;
    this.deleting.set(id);
    this.svc.delete(id).subscribe({
      next: () => { this.deleting.set(null); this.showConfirm.set(null); this.showToast('Cliente eliminado.', 'success'); },
      error: () => { this.deleting.set(null); this.showToast('Error al eliminar.', 'error'); },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  updateField(field: keyof ClienteForm, event: Event): void {
    this.form.update(f => ({ ...f, [field]: (event.target as HTMLInputElement).value }));
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }

  regimenLabel(clave: string): string {
    return this.regimenes.find(r => r.clave === clave)?.descripcion ?? clave;
  }
}
