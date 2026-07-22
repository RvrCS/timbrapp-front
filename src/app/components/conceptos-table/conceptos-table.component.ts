import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnDef } from '../../models/table-column.models';

interface IndexedRow {
  row: any;
  originalIndex: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;
/** Rough row-height estimate used only to reserve a stable min-height so the table
 * frame doesn't visually collapse when a page has fewer rows than its page size. */
const ROW_HEIGHT_PX = 44;
const ROW_HEIGHT_WITH_SUBROW_PX = 58;
const HEADER_HEIGHT_PX = 41;

/**
 * Generic data grid driven entirely by ColumnDef[] — used for CFDI conceptos (I/E)
 * and complemento de pago documentos relacionados (P). Adding a new CFDI type's
 * table means defining a new column set, not a new component.
 *
 * Pagination/sort/search run client-side over the in-memory `rows` input — conceptos
 * live in the extraction draft, not a paginated DB query (see plan §10).
 */
@Component({
  selector: 'app-conceptos-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conceptos-table.component.html',
})
export class ConceptosTableComponent {
  columns  = input.required<ColumnDef[]>();
  rows     = input.required<any[]>();
  mode     = input<'view' | 'edit'>('view');
  /** Default page size — the user can override it via the in-table selector (5/10/20/50/100). */
  pageSize = input<number>(PAGE_SIZE_OPTIONS[0]);
  showRemove   = input<boolean>(false);
  showSearch   = input<boolean>(true);
  emptyMessage = input<string>('Sin registros.');

  remove     = output<number>();
  cellChange = output<{ index: number; key: string; value: unknown }>();

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  searchQuery = signal('');
  sortKey     = signal<string | null>(null);
  sortDir     = signal<'asc' | 'desc'>('asc');
  page        = signal(1);
  private pageSizeOverride = signal<number | null>(null);
  effectivePageSize = computed(() => this.pageSizeOverride() ?? this.pageSize());

  /** Reserves room for a full page of rows so the frame stays a consistent size
   * whether it holds 2 rows or a full page — "no se ve vacío ni se colapsa". */
  tableMinHeightPx = computed(() => {
    const rowHeight = this.columns().some(c => !!c.subKey) ? ROW_HEIGHT_WITH_SUBROW_PX : ROW_HEIGHT_PX;
    return HEADER_HEIGHT_PX + this.effectivePageSize() * rowHeight;
  });

  private filteredIndexed = computed<IndexedRow[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const indexed = this.rows().map((row, originalIndex) => ({ row, originalIndex }));
    if (!q) return indexed;

    const searchableKeys = this.columns()
      .filter(c => c.searchable ?? c.type === 'text')
      .flatMap(c => c.subKey ? [c.key, c.subKey] : [c.key]);

    return indexed.filter(({ row }) =>
      searchableKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  });

  private sortedIndexed = computed<IndexedRow[]>(() => {
    const key = this.sortKey();
    const items = [...this.filteredIndexed()];
    if (!key) return items;

    const col = this.columns().find(c => c.key === key);
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const isNumeric = col?.type === 'number' || col?.type === 'currency';

    items.sort((a, b) => {
      const av = a.row[key];
      const bv = b.row[key];
      return isNumeric
        ? ((av ?? 0) - (bv ?? 0)) * dir
        : String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
    return items;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedIndexed().length / this.effectivePageSize())));

  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  pagedIndexed = computed<IndexedRow[]>(() => {
    const size  = this.effectivePageSize();
    const start = (this.currentPage() - 1) * size;
    return this.sortedIndexed().slice(start, start + size);
  });

  totalRows = computed(() => this.rows().length);
  visibleRows = computed(() => this.filteredIndexed().length);

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  toggleSort(col: ColumnDef): void {
    if (col.sortable === false) return;
    if (this.sortKey() === col.key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  onPageSizeChange(value: number): void {
    this.pageSizeOverride.set(Number(value));
    this.page.set(1);
  }

  onFieldInput(item: IndexedRow, key: string, value: unknown): void {
    item.row[key] = value;
    this.cellChange.emit({ index: item.originalIndex, key, value });
  }

  onRemove(originalIndex: number): void {
    this.remove.emit(originalIndex);
  }

  alignClass(align?: 'left' | 'center' | 'right'): string {
    return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  }

  formatValue(row: any, col: ColumnDef): string {
    const val = row[col.key];
    if (val === null || val === undefined || val === '') return '—';
    if (col.type === 'currency') {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? String(val) : num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(val);
  }
}
