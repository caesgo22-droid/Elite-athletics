/**
 * INTERFAZ ESTÁNDAR PARA SATÉLITES
 * 
 * Cada "Satélite" en la arquitectura Brain/Ring/Satellite debe implementar esta interfaz.
 * Esto asegura que todos los módulos periféricos tengan un comportamiento predecible,
 * reporten su estado de salud, y se inicialicen de manera uniforme.
 */
export interface ISatellite {
    /** Nombre legible del satélite para logs y debug */
    readonly name: string;

    /** Verifica si el satélite está operativo y sus dependencias están listas */
    healthCheck(): Promise<boolean>;

    /** Inicialización asíncrona opcional (ej. cargar modelos, conectar DB) */
    initialize?(): Promise<void>;
}
