export interface Cliente {
  id: string;
  rfc: string;
  nombre: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdiDefault: string;
  email?: string | null;
  telefono?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface ClienteForm {
  rfc: string;
  nombre: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdiDefault: string;
  email: string;
  telefono: string;
}

export const REGIMENES_FISCALES: { clave: string; descripcion: string }[] = [
  { clave: '601', descripcion: '601 - General de Ley Personas Morales' },
  { clave: '603', descripcion: '603 - Personas Morales con Fines no Lucrativos' },
  { clave: '605', descripcion: '605 - Sueldos y Salarios' },
  { clave: '606', descripcion: '606 - Arrendamiento' },
  { clave: '607', descripcion: '607 - Enajenación o Adquisición de Bienes' },
  { clave: '608', descripcion: '608 - Demás ingresos' },
  { clave: '611', descripcion: '611 - Ingresos por Dividendos' },
  { clave: '612', descripcion: '612 - Personas Físicas con Actividades Empresariales' },
  { clave: '614', descripcion: '614 - Ingresos por intereses' },
  { clave: '616', descripcion: '616 - Sin obligaciones fiscales' },
  { clave: '621', descripcion: '621 - Incorporación Fiscal' },
  { clave: '622', descripcion: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', descripcion: '623 - Opcional para Grupos de Sociedades' },
  { clave: '624', descripcion: '624 - Coordinados' },
  { clave: '625', descripcion: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', descripcion: '626 - Régimen Simplificado de Confianza' },
];

export const USOS_CFDI: { clave: string; descripcion: string }[] = [
  { clave: 'G01', descripcion: 'G01 - Adquisición de mercancias' },
  { clave: 'G02', descripcion: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', descripcion: 'G03 - Gastos en general' },
  { clave: 'I01', descripcion: 'I01 - Construcciones' },
  { clave: 'I02', descripcion: 'I02 - Mobiliario y equipo de oficina' },
  { clave: 'I03', descripcion: 'I03 - Equipo de transporte' },
  { clave: 'I04', descripcion: 'I04 - Equipo de cómputo y accesorios' },
  { clave: 'I05', descripcion: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { clave: 'I06', descripcion: 'I06 - Comunicaciones telefónicas' },
  { clave: 'I07', descripcion: 'I07 - Comunicaciones satelitales' },
  { clave: 'I08', descripcion: 'I08 - Otra maquinaria y equipo' },
  { clave: 'D01', descripcion: 'D01 - Honorarios médicos, dentales y hospitalarios' },
  { clave: 'D02', descripcion: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { clave: 'D03', descripcion: 'D03 - Gastos funerales' },
  { clave: 'D04', descripcion: 'D04 - Donativos' },
  { clave: 'D05', descripcion: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { clave: 'D06', descripcion: 'D06 - Aportaciones voluntarias al SAR' },
  { clave: 'D07', descripcion: 'D07 - Primas por seguros de gastos médicos' },
  { clave: 'D08', descripcion: 'D08 - Gastos de transportación escolar obligatoria' },
  { clave: 'D09', descripcion: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { clave: 'D10', descripcion: 'D10 - Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', descripcion: 'S01 - Sin efectos fiscales' },
  { clave: 'CP01', descripcion: 'CP01 - Pagos' },
  { clave: 'CN01', descripcion: 'CN01 - Nómina' },
];
