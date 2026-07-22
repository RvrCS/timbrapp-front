import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

interface TipoRelacion {
  clave: string;
  desc: string;
}

const TIPOS_RELACION: TipoRelacion[] = [
  { clave: '01', desc: 'Nota de crédito de los documentos relacionados — el más usado' },
  { clave: '02', desc: 'Nota de débito de los documentos relacionados' },
  { clave: '03', desc: 'Devolución de mercancía sobre facturas o traslados previos' },
  { clave: '04', desc: 'Sustitución de los CFDI previos' },
  { clave: '05', desc: 'Traslados de mercancías facturados previamente' },
  { clave: '06', desc: 'Factura generada por los traslados previos' },
  { clave: '07', desc: 'CFDI por aplicación de anticipo' },
];

@Component({
  selector: 'app-doc-egreso',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './doc-egreso.component.html',
})
export class DocEgresoComponent {
  readonly tiposRelacion = TIPOS_RELACION;
}
