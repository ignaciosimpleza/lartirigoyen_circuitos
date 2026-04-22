// ============================================================
// DIAGRAM DATA — Lartirigoyen trámites
// ============================================================
// Áreas (lanes) — colores provienen de CSS variables (--sector-*)
const AREAS = {
  vendedor:   { label: 'Vendedor',       color: 'var(--sector-vendedor)' },
  comercial:  { label: 'Comercial',      color: 'var(--sector-comercial)' },
  deposito:   { label: 'Depósito',       color: 'var(--sector-deposito)' },
  admin:      { label: 'Administración', color: 'var(--sector-admin)' },
  finanzas:   { label: 'Finanzas',       color: 'var(--sector-finanzas)' },
  logistica:  { label: 'Logística',      color: 'var(--sector-logistica)' },
  gerencia:   { label: 'Gerencia',       color: 'var(--sector-gerencia)' },
};

// Posiciones
const POS = {
  comercial: { label: 'Comercial',    color: 'var(--pos-comercial)' },
  contable:  { label: 'Contable',     color: 'var(--pos-contable)' },
  fisica:    { label: 'Física',       color: 'var(--pos-fisica)' },
  sin:       { label: 'Sin posición', color: 'var(--pos-sin)' },
};

// Helper: node types
// doc   = rectángulo (documento)
// dec   = rombo (decisión)
// end   = cápsula (cierre)

// ============================================================
// COMPRA DE INSUMOS
// ============================================================
const COMPRA = {
  lanes: ['comercial','deposito','admin','finanzas'],
  scenarios: [
    {
      id: 'c1',
      title: 'Camino feliz con factura',
      subtitle: 'Se recibe la mercadería y se factura (OC → REM → FAC)',
      badges: [{t:'Principal', cls:'proc'}],
      meta: [
        {l:'Disparador', v:'Registrar Compra (OC)'},
        {l:'Cierre',     v:'Compra finalizada con facturación'},
        {l:'Documentos', v:'3 (OC · Remito · Factura)'},
        {l:'Autorización', v:'General de compra'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'comercial', row:0, label:'Orden de compra', idx:'1', pos:'comercial', est:'Pend. autorización', action:'Registrar Compra (OC)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. general compra', idx:'2', pos:'sin', est:'Pend. autorización', action:'Autorización General Compra' },
        { id:'n3', type:'doc', lane:'comercial', row:2, label:'Compra autorizada', idx:'3', pos:'comercial', est:'Autorizada pend. rec.', action:'(estado)' },
        { id:'n4', type:'doc', lane:'deposito',  row:3, label:'Remito de compra', idx:'4', pos:'fisica', est:'Recibida pend. fact.', action:'Recibir Compra (REM)' },
        { id:'n5', type:'doc', lane:'admin',     row:4, label:'Factura de compra', idx:'5', pos:'contable', est:'Finalizada c/ facturación', action:'Facturar Compra (FAC)' },
        { id:'n6', type:'end', lane:'admin',     row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
    {
      id: 'c2',
      title: 'Factura previa a la recepción',
      subtitle: 'Se factura antes de recibir la mercadería (OC → FAC → REM)',
      badges: [{t:'Variante', cls:''}],
      meta: [
        {l:'Disparador', v:'Registrar Compra (OC)'},
        {l:'Cierre',     v:'Compra finalizada con facturación'},
        {l:'Documentos', v:'3 (OC · Factura · Remito)'},
        {l:'Diferencia', v:'Invertido FAC ↔ REM'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'comercial', row:0, label:'Orden de compra', idx:'1', pos:'comercial', est:'Pend. autorización', action:'Registrar Compra (OC)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. general compra', idx:'2', pos:'sin', est:'Pend. autorización', action:'Autorización General Compra' },
        { id:'n3', type:'doc', lane:'comercial', row:2, label:'Compra autorizada', idx:'3', pos:'comercial', est:'Autorizada pend. fact.', action:'(estado)' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Factura de compra', idx:'4', pos:'contable', est:'Facturada pend. recibir', action:'Facturar Compra (FAC)' },
        { id:'n5', type:'doc', lane:'deposito',  row:4, label:'Remito de compra', idx:'5', pos:'fisica', est:'Finalizada c/ facturación', action:'Recibir Compra (REM)' },
        { id:'n6', type:'end', lane:'deposito',  row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
    {
      id: 'c3',
      title: 'Compra rechazada',
      subtitle: 'La compra no obtiene autorización (OC → Rechazo)',
      badges: [{t:'Excepción', cls:'dev'}],
      meta: [
        {l:'Disparador', v:'Registrar Compra (OC)'},
        {l:'Cierre',     v:'Compra rechazada / anulada'},
        {l:'Reversión',  v:'Modificar o revertir autorización'},
        {l:'Acción',     v:'Rechazar Compra'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'comercial', row:0, label:'Orden de compra', idx:'1', pos:'comercial', est:'Pend. autorización', action:'Registrar Compra (OC)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. general compra', idx:'2', pos:'sin', est:'Pend. autorización', action:'Autorización General Compra' },
        { id:'n3', type:'doc', lane:'comercial', row:2, label:'Compra rechazada', idx:'3', pos:'sin', est:'No autorizada', action:'Rechazar Compra' },
        { id:'n4', type:'end', lane:'comercial', row:3, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'No', kind:'no'},
        {from:'n3', to:'n4'},
      ],
    },
    {
      id: 'c4',
      title: 'Devolución de compra con NC',
      subtitle: 'Sobre una compra finalizada se devuelve y se emite NC',
      badges: [{t:'Devolución', cls:'dev'}],
      meta: [
        {l:'Disparador', v:'Compra finalizada con facturación'},
        {l:'Acciones',   v:'Devolver (RDE) + Nota de Crédito (NCR)'},
        {l:'Cierre',     v:'Proceso cerrado'},
        {l:'Posiciones', v:'Contable + Física'},
      ],
      nodes: [
        { id:'n0', type:'doc', lane:'comercial', row:0, label:'Compra finalizada', idx:'5', pos:'contable', est:'Finalizada c/ facturación', action:'(estado origen)' },
        { id:'n1', type:'doc', lane:'deposito',  row:1, label:'Remito de devolución', idx:'9', pos:'fisica', est:'Devuelta pend. NC', action:'Devolver Compra (RDE)' },
        { id:'n2', type:'doc', lane:'admin',     row:2, label:'Nota de crédito', idx:'10', pos:'contable', est:'Proceso cerrado', action:'Nota de Crédito Compra (NCR)' },
        { id:'n3', type:'end', lane:'admin',     row:3, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n0', to:'n1'},
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3'},
      ],
    },
    {
      id: 'c5',
      title: 'Compra por cuenta y orden',
      subtitle: 'Compra de terceros con liquidación posterior (OC → REM → FAC → LIQTER)',
      badges: [{t:'Cta. y Orden', cls:''}],
      meta: [
        {l:'Disparador', v:'Registrar Compra (OC)'},
        {l:'Cierre',     v:'Liquidación Cta. y Orden'},
        {l:'Acciones',   v:'LIQTER · REVLQTER'},
        {l:'Particular', v:'Participa de circuito de ventas Cta./Orden'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'comercial', row:0, label:'OC cta. y orden', idx:'1', pos:'comercial', est:'Pend. autorización', action:'Registrar Compra (OC)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. general compra', idx:'2', pos:'sin', est:'Pend. autorización', action:'Autorización General Compra' },
        { id:'n3', type:'doc', lane:'deposito',  row:2, label:'Remito de compra', idx:'3', pos:'fisica', est:'Recibida pend. fact.', action:'Recibir Compra (REM)' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Factura de compra', idx:'4', pos:'contable', est:'Finalizada c/ facturación', action:'Facturar Compra (FAC)' },
        { id:'n5', type:'doc', lane:'admin',     row:4, label:'Liquidación cta. y orden', idx:'5', pos:'contable', est:'Liquidada', action:'Liquida Cta. y orden (LIQTER)' },
        { id:'n6', type:'end', lane:'admin',     row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
  ],
};

// ============================================================
// VENTA DE INSUMOS
// ============================================================
const VENTA = {
  lanes: ['vendedor','comercial','finanzas','admin','deposito','logistica'],
  scenarios: [
    {
      id: 'v1',
      title: 'Camino feliz: pedido → factura → remito',
      subtitle: 'Doble autorización (comercial + crediticia), factura y entrega',
      badges: [{t:'Principal', cls:'proc'}],
      meta: [
        {l:'Disparador', v:'Registrar Venta (PED)'},
        {l:'Autorizaciones', v:'Comercial + Crediticia'},
        {l:'Cierre',     v:'Venta finalizada'},
        {l:'Documentos', v:'3 (Pedido · Factura · Remito)'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'vendedor',  row:0, label:'Pedido de venta', idx:'1', pos:'comercial', est:'Pend. autorizar', action:'Registrar Venta (PED)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. comercial', idx:'2', pos:'sin', est:'Pend. autor. crediticia', action:'Autorizar Comercial' },
        { id:'n3', type:'dec', lane:'finanzas',  row:2, label:'Autor. crediticia', idx:'3', pos:'sin', est:'Autor. pend. facturar', action:'Autorización Crediticia' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Factura de venta', idx:'4', pos:'contable', est:'Facturada pend. entrega', action:'Facturar Venta (FAC / FACTER)' },
        { id:'n5', type:'doc', lane:'deposito',  row:4, label:'Remito de venta', idx:'5', pos:'fisica', est:'Venta finalizada', action:'Entregar Venta (REM)' },
        { id:'n6', type:'end', lane:'deposito',  row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4', label:'Sí'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
    {
      id: 'v2',
      title: 'Entrega anticipada sin autorizar',
      subtitle: 'El cliente retira antes de facturar (REMSF → autorizaciones → factura)',
      badges: [{t:'Variante', cls:''}],
      meta: [
        {l:'Disparador', v:'Registrar Venta (PED)'},
        {l:'Acción clave', v:'Entregar Venta No autorizada (REMSF)'},
        {l:'Posición', v:'Física antes que Contable'},
        {l:'Cierre', v:'Venta finalizada'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'vendedor',  row:0, label:'Pedido de venta', idx:'1', pos:'comercial', est:'Pend. autorizar', action:'Registrar Venta (PED)' },
        { id:'n2', type:'doc', lane:'deposito',  row:1, label:'Remito sin autorizar', idx:'7', pos:'fisica', est:'Entregada pend. autorizar', action:'Entregar Venta No autor. (REMSF)' },
        { id:'n3', type:'dec', lane:'comercial', row:2, label:'Autor. comercial', idx:'8', pos:'sin', est:'Entregada autor. comercial', action:'Autorizar Comercial' },
        { id:'n4', type:'dec', lane:'finanzas',  row:3, label:'Autor. crediticia', idx:'9', pos:'sin', est:'Entregada pend. facturar', action:'Autorización Crediticia' },
        { id:'n5', type:'doc', lane:'admin',     row:4, label:'Factura de venta', idx:'5', pos:'contable', est:'Venta finalizada', action:'Facturar Venta (FACTER)' },
        { id:'n6', type:'end', lane:'admin',     row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3'},
        {from:'n3', to:'n4', label:'Sí'},
        {from:'n4', to:'n5', label:'Sí'},
        {from:'n5', to:'n6'},
      ],
    },
    {
      id: 'v3',
      title: 'Venta rechazada o anulada',
      subtitle: 'No pasa la autorización comercial o crediticia',
      badges: [{t:'Excepción', cls:'dev'}],
      meta: [
        {l:'Disparador', v:'Registrar Venta (PED)'},
        {l:'Acciones', v:'Rechazar Venta · Anular (ANUPED)'},
        {l:'Cierre', v:'Venta no autorizada / anulada'},
        {l:'Reversión', v:'Modificar Venta'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'vendedor',  row:0, label:'Pedido de venta', idx:'1', pos:'comercial', est:'Pend. autorizar', action:'Registrar Venta (PED)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. comercial', idx:'2', pos:'sin', est:'Pend. autorizar', action:'Autorizar / Rechazar Comercial' },
        { id:'n3', type:'doc', lane:'comercial', row:2, label:'Venta no autorizada', idx:'6', pos:'sin', est:'No autorizada', action:'Rechazar Venta' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Venta anulada', idx:'15', pos:'sin', est:'Anulada', action:'Anular Venta (ANUPED)' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'No', kind:'no'},
        {from:'n3', to:'n4'},
      ],
    },
    {
      id: 'v4',
      title: 'Venta Cuenta y Orden + Líquido Producto',
      subtitle: 'Factura cta/orden dispara un trámite de liquidación',
      badges: [{t:'Cta. y Orden', cls:''}],
      meta: [
        {l:'Acción', v:'Facturar (FACTER) inicia Líquido Producto'},
        {l:'Cierre', v:'Venta finalizada + Liq. producto'},
        {l:'Particular', v:'Se vincula con OC cta. y orden'},
        {l:'Autorizaciones', v:'Comercial + Crediticia'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'vendedor',  row:0, label:'Pedido cta. y orden', idx:'1', pos:'comercial', est:'Pend. autorizar', action:'Registrar Venta (PED)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. comercial', idx:'2', pos:'sin', est:'Autor. pend. crediticia', action:'Autorizar Comercial' },
        { id:'n3', type:'dec', lane:'finanzas',  row:2, label:'Autor. crediticia', idx:'3', pos:'sin', est:'Autor. pend. facturar', action:'Autorización Crediticia' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Factura cta/orden', idx:'4', pos:'contable', est:'Facturada pend. entrega', action:'Facturar Venta (FACTER) — inicia Líquido Producto' },
        { id:'n5', type:'doc', lane:'deposito',  row:4, label:'Remito de venta', idx:'5', pos:'fisica', est:'Venta finalizada', action:'Entregar Venta (REM)' },
        { id:'n6', type:'end', lane:'deposito',  row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4', label:'Sí'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
    {
      id: 'v5',
      title: 'Devolución de mercadería + NC',
      subtitle: 'Solicitud → autorización → devolución → NC',
      badges: [{t:'Devolución', cls:'dev'}],
      meta: [
        {l:'Disparador', v:'Venta finalizada'},
        {l:'Acciones', v:'SNCR · Autorización NC · RDE · NCR'},
        {l:'Cierre', v:'Proceso cerrado'},
        {l:'Posiciones', v:'−10 Física + Contable'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'vendedor',  row:0, label:'Solicitud de NC', idx:'10', pos:'comercial', est:'Sol. NC pend. autorizar', action:'Solicitud Nota de Crédito (SNCR)' },
        { id:'n2', type:'dec', lane:'comercial', row:1, label:'Autor. NC', idx:'11', pos:'sin', est:'Sol. NC autor. pend. emitir', action:'Autorización Nota de Crédito' },
        { id:'n3', type:'doc', lane:'deposito',  row:2, label:'Remito de devolución', idx:'14', pos:'fisica', est:'Mercad. dev. pend. NC', action:'Devolver Venta (RDE)' },
        { id:'n4', type:'doc', lane:'admin',     row:3, label:'Nota de crédito', idx:'5', pos:'contable', est:'Proceso cerrado', action:'Nota de Crédito (NCR)' },
        { id:'n5', type:'end', lane:'admin',     row:4, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3', label:'Sí'},
        {from:'n3', to:'n4'},
        {from:'n4', to:'n5'},
      ],
    },
    {
      id: 'v6',
      title: 'Solicitud de despacho y logística',
      subtitle: 'Inserta 3 pasos de logística entre factura y remito',
      badges: [{t:'Logística', cls:''}],
      meta: [
        {l:'Pasos nuevos', v:'Solicitud · Autorización · Orden de Despacho'},
        {l:'Cierre', v:'Venta finalizada'},
        {l:'Particular', v:'Lane Logística activa'},
        {l:'Posición física', v:'Al momento del remito'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'admin',     row:0, label:'Factura de venta', idx:'4', pos:'contable', est:'Facturada pend. entrega', action:'Facturar Venta (FAC)' },
        { id:'n2', type:'doc', lane:'logistica', row:1, label:'Solic. de despacho', idx:'L1', pos:'sin', est:'Despacho solicitado', action:'Solicitud de Despacho' },
        { id:'n3', type:'dec', lane:'logistica', row:2, label:'Autor. despacho', idx:'L2', pos:'sin', est:'Despacho autorizado', action:'Autorización de Despacho' },
        { id:'n4', type:'doc', lane:'logistica', row:3, label:'Orden de despacho', idx:'L3', pos:'sin', est:'Pend. entregar', action:'Orden de Despacho' },
        { id:'n5', type:'doc', lane:'deposito',  row:4, label:'Remito de venta', idx:'5', pos:'fisica', est:'Venta finalizada', action:'Entregar Venta (REM)' },
        { id:'n6', type:'end', lane:'deposito',  row:5, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3'},
        {from:'n3', to:'n4', label:'Sí'},
        {from:'n4', to:'n5'},
        {from:'n5', to:'n6'},
      ],
    },
  ],
};

// ============================================================
// VENTA DIRECTA (Bayer)
// ============================================================
const DIRECTA = {
  lanes: ['comercial','deposito','admin','logistica'],
  scenarios: [
    {
      id: 'd1',
      title: 'Venta Directa Bayer — camino feliz',
      subtitle: 'Recepción del remito del proveedor y entrega al cliente',
      badges: [{t:'Principal', cls:'proc'}],
      meta: [
        {l:'Disparador', v:'Factura Vta Directa Bayer (FACVDB)'},
        {l:'Cierre', v:'Venta Directa Finalizada'},
        {l:'Posiciones', v:'Contable + Física (transitoria)'},
        {l:'Particular', v:'Agrobayer → Lartirigoyen → Cliente'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'admin',     row:0, label:'Factura Vta Directa Bayer', idx:'1', pos:'contable', est:'Pend. recibir remito prov.', action:'Registrar Factura Vta Directa (FACVDB)' },
        { id:'n2', type:'doc', lane:'deposito',  row:1, label:'Recepción remito proveedor', idx:'3', pos:'fisica', est:'Recepción finalizada', action:'Recibir Remito (REM)' },
        { id:'n3', type:'doc', lane:'logistica', row:2, label:'Entrega al cliente', idx:'4', pos:'fisica', est:'Entrega finalizada', action:'Entregar Venta (REM)' },
        { id:'n4', type:'end', lane:'logistica', row:3, label:'Venta Directa Finalizada' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3'},
        {from:'n3', to:'n4'},
      ],
    },
    {
      id: 'd2',
      title: 'Devolución con NC (Vta Directa)',
      subtitle: 'Devolución al proveedor + NC al cliente',
      badges: [{t:'Devolución', cls:'dev'}],
      meta: [
        {l:'Disparador', v:'Venta Directa finalizada'},
        {l:'Acciones', v:'Devolver (RDE) · NCVDB'},
        {l:'Cierre', v:'Proceso cerrado'},
        {l:'Posiciones', v:'−100 Contable · 100 Física'},
      ],
      nodes: [
        { id:'n1', type:'doc', lane:'logistica', row:0, label:'Devolver venta directa', idx:'1', pos:'fisica', est:'Devolución iniciada', action:'Devolver Venta (RDE)' },
        { id:'n2', type:'doc', lane:'deposito',  row:1, label:'Devolver al proveedor', idx:'2', pos:'fisica', est:'Devuelta al proveedor', action:'Devolver Compra (RDE)' },
        { id:'n3', type:'doc', lane:'admin',     row:2, label:'Nota de crédito (NCVDB)', idx:'3', pos:'contable', est:'Proceso cerrado', action:'Nota de Crédito Venta Directa (NCVDB)' },
        { id:'n4', type:'end', lane:'admin',     row:3, label:'Proceso cerrado' },
      ],
      edges: [
        {from:'n1', to:'n2'},
        {from:'n2', to:'n3'},
        {from:'n3', to:'n4'},
      ],
    },
  ],
};

const PROCESSES = {
  compra:  { title: 'Compra de Insumos', subtitle: 'Trámite de abastecimiento · OC → Recepción → Factura',
             def: COMPRA, count: { esc: 5, est: 8 } },
  venta:   { title: 'Venta de Insumos', subtitle: 'Pedido → doble autorización → factura → remito',
             def: VENTA, count: { esc: 6, est: 16 } },
  directa: { title: 'Venta Directa', subtitle: 'Venta Directa Bayer: recepción del remito, entrega y cierre',
             def: DIRECTA, count: { esc: 2, est: 4 } },
};
