import { Component } from '@angular/core';

interface GlossaryTerm {
  term: string;
  def: string;
}

const TERMS: GlossaryTerm[] = [
  { term: 'CFDI', def: 'Comprobante Fiscal Digital por Internet — el nombre oficial de una factura electrónica en México.' },
  { term: 'Timbrar', def: 'Validar oficialmente un comprobante ante el SAT para que tenga validez fiscal.' },
  { term: 'SAT', def: 'La autoridad fiscal de México, encargada de recaudar impuestos y validar facturas.' },
  { term: 'RFC', def: 'El identificador fiscal de una persona o empresa en México.' },
  { term: 'UUID / folio único', def: 'El código que identifica a un CFDI de manera única en todo el país.' },
  { term: 'CSD', def: 'Certificado de Sello Digital — los archivos que el SAT te da para firmar tus comprobantes electrónicamente.' },
  { term: 'Uso de CFDI', def: 'El motivo fiscal por el que tu cliente va a usar la factura (por ejemplo, gastos generales o adquisición de mercancías).' },
  { term: 'Nota de crédito', def: 'Nombre común del comprobante tipo Egreso: descuenta o corrige una factura anterior.' },
  { term: 'Complemento', def: 'Información adicional que el SAT exige para ciertos tipos de comprobante — por ejemplo, el complemento de Pago (REP) detalla qué facturas se están pagando.' },
  { term: 'PPD', def: 'Pago en parcialidades o diferido — el método de pago de una factura "a crédito", que después necesita comprobantes de tipo Pago cuando se cobra.' },
  { term: 'PUE', def: 'Pago en una sola exhibición — el método de pago cuando te pagan de contado o en el momento de facturar.' },
  { term: 'Emisor / Receptor', def: 'El emisor es quien factura (tu negocio); el receptor es a quien se le factura (tu cliente).' },
  { term: 'Parcialidad', def: 'Cada pago individual que recibes de una factura a crédito — la primera parcialidad, la segunda, etc.' },
  { term: 'Clave de producto/servicio', def: 'Código del catálogo del SAT que identifica qué tipo de producto o servicio es cada concepto de tu factura.' },
];

@Component({
  selector: 'app-doc-glosario',
  standalone: true,
  templateUrl: './doc-glosario.component.html',
})
export class DocGlosarioComponent {
  readonly terms = TERMS;
}
