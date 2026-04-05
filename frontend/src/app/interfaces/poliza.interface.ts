export interface Poliza {
    id: string;
    numero: string;
    obra: string;
    aseguradora: string;
    contratista: string;
    ramo: string;
    valorOriginal: number;
    valorActual: number;
    fechaEmision: string; // o Date si prefieres
    fechaExpiracion: string; // o Date si prefieres
    estado: number; // posiblemente un enum si tiene valores fijos
}

export interface PolizaItemSet {
    items: Poliza[]
    totalCount: number
}