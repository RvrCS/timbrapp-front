import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface DocNavItem {
  label: string;
  route: string;
  icon: string;
}

const DOC_NAV_ITEMS: DocNavItem[] = [
  { label: 'Inicio',                 route: '/documentacion',                     icon: 'book-open' },
  { label: 'Primeros pasos',         route: '/documentacion/primeros-pasos',      icon: 'list-checks' },
  { label: 'Ingreso',                route: '/documentacion/ingreso',             icon: 'arrow-up-circle' },
  { label: 'Egreso',                 route: '/documentacion/egreso',              icon: 'arrow-down-circle' },
  { label: 'Pago',                   route: '/documentacion/pago',                icon: 'check-circle-2' },
  { label: 'Traslado',               route: '/documentacion/traslado',            icon: 'truck' },
  { label: 'Nómina',                 route: '/documentacion/nomina',              icon: 'user-cog' },
  { label: 'Preguntas frecuentes',   route: '/documentacion/preguntas-frecuentes', icon: 'help-circle' },
  { label: 'Glosario',               route: '/documentacion/glosario',            icon: 'book-open' },
];

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './documentacion.component.html',
})
export class DocumentacionComponent {
  readonly navItems = DOC_NAV_ITEMS;
}
