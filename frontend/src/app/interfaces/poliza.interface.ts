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
    observaciones?: string | null;
    /** 0=Vigente, 1=Por vencer, 2=Expirado (derivado en API). */
    estado: number;
}

export interface PolizaItemSet {
    items: Poliza[]
    totalCount: number
}