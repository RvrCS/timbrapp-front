import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DocPrimerosPasosComponent } from './doc-primeros-pasos.component';
import { DocIngresoComponent } from './doc-ingreso.component';
import { DocEgresoComponent } from './doc-egreso.component';
import { DocPagoComponent } from './doc-pago.component';
import { DocTrasladoComponent } from './doc-traslado.component';
import { DocNominaComponent } from './doc-nomina.component';
import { DocFaqComponent } from './doc-faq.component';
import { DocGlosarioComponent } from './doc-glosario.component';

/**
 * Print-only view — reuses the same content components shown in the routed
 * documentation pages, stacked in reading order, with a print stylesheet
 * (forces <details> open, preserves colors). No sidebar/header — this route
 * lives outside the shell so `window.print()` only captures the manual itself.
 */
@Component({
  selector: 'app-doc-imprimir',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    DocPrimerosPasosComponent,
    DocIngresoComponent,
    DocEgresoComponent,
    DocPagoComponent,
    DocTrasladoComponent,
    DocNominaComponent,
    DocFaqComponent,
    DocGlosarioComponent,
  ],
  templateUrl: './doc-imprimir.component.html',
})
export class DocImprimirComponent {
  print(): void {
    window.print();
  }
}
