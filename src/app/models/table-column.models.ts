export type ColumnType = 'text' | 'number' | 'currency' | 'select';

export interface ColumnOption {
  value: string;
  label: string;
}

/** Declarative column definition consumed by ConceptosTableComponent. Add a CFDI
 * type's table by defining a new ColumnDef[] — no new table component needed. */
export interface ColumnDef {
  key: string;
  header: string;
  type: ColumnType;
  editable?: boolean;
  sortable?: boolean;
  /** Included in the free-text search. Defaults to true for 'text' columns. */
  searchable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  placeholder?: string;
  options?: ColumnOption[];
  step?: number;
  /** Secondary field rendered as a muted line under the primary value (e.g. a SAT clave under a description). */
  subKey?: string;
  subPlaceholder?: string;
}
