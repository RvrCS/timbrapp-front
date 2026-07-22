import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDef } from '../../models/table-column.models';
import { ConceptosTableComponent } from '../conceptos-table/conceptos-table.component';

/**
 * Reusable "edit a list of rows" modal — used for Conceptos (I/E) and for
 * Documentos relacionados de pago (P). Edits happen on a working copy cloned
 * from `rows` at open time; Cancelar discards it, Confirmar emits it back to
 * the caller. The caller owns applying it to the real draft (and any
 * recalculation that implies) — this component only manages the copy.
 */
@Component({
  selector: 'app-conceptos-edit-modal',
  standalone: true,
  imports: [CommonModule, ConceptosTableComponent],
  templateUrl: './conceptos-edit-modal.component.html',
})
export class ConceptosEditModalComponent {
  open    = input.required<boolean>();
  title   = input<string>('Editar');
  columns = input.required<ColumnDef[]>();
  rows    = input.required<any[]>();
  addLabel     = input<string>('Agregar');
  emptyMessage = input<string>('Sin registros.');
  /** Builds a blank row when the user clicks "Agregar" — shape depends on the caller (concepto vs docto de pago). */
  blankRowFactory = input.required<() => any>();

  confirm = output<any[]>();
  cancel  = output<void>();
  /** Forwards ConceptosTableComponent's cellChange with the live row object attached,
   * so the caller can derive fields (e.g. importe = cantidad × valorUnitario) by
   * mutating that same object — no separate sync needed since it's a shared reference. */
  cellChange = output<{ row: any; index: number; key: string; value: unknown }>();

  workingRows = signal<any[]>([]);

  constructor() {
    // Re-seed the working copy every time the modal opens, from whatever `rows` is at that moment.
    effect(() => {
      if (this.open()) {
        this.workingRows.set(structuredClone(this.rows()));
      }
    });
  }

  addRow(): void {
    this.workingRows.update(rows => [...rows, this.blankRowFactory()()]);
  }

  removeRow(index: number): void {
    this.workingRows.update(rows => rows.filter((_, i) => i !== index));
  }

  onInnerCellChange(event: { index: number; key: string; value: unknown }): void {
    const row = this.workingRows()[event.index];
    if (row) this.cellChange.emit({ row, index: event.index, key: event.key, value: event.value });
  }

  onConfirm(): void {
    this.confirm.emit(this.workingRows());
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
