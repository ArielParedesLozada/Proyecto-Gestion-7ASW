export interface RamoListRow {
  id: string;
  nombre: string;
  descripcion: string;
  /** Si el ramo contempla cambio de valor (UI: badge Sí / No). */
  cambioValor: boolean;
  periodicity: string;
}
