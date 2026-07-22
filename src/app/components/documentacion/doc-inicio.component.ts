import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface QuickLink {
  label: string;
  desc: string;
  route: string;
  icon: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Primeros pasos', desc: 'De subir tu documento a timbrar, paso a paso.', route: '/documentacion/primeros-pasos', icon: 'list-checks' },
  { label: 'Ingreso',        desc: 'La factura normal — la que usarás casi siempre.', route: '/documentacion/ingreso', icon: 'arrow-up-circle' },
  { label: 'Egreso',         desc: 'Nota de crédito: corrige o devuelve una factura.', route: '/documentacion/egreso', icon: 'arrow-down-circle' },
  { label: 'Pago',           desc: 'Confirma que ya te pagaron una factura a crédito.', route: '/documentacion/pago', icon: 'check-circle-2' },
];

@Component({
  selector: 'app-doc-inicio',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './doc-inicio.component.html',
})
export class DocInicioComponent {
  readonly quickLinks = QUICK_LINKS;
}
