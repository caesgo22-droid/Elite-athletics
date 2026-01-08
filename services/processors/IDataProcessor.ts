import { Athlete } from '../../types';

/**
 * INTERFAZ BASE PARA PROCESADORES DE DATOS
 * 
 * Los procesadores son FUNCIONES PRIVADAS del Data Ring.
 * Su propósito es encapsular la lógica de transformación de cada tipo de dato
 * sin romper el principio de "un solo lugar para toda la información".
 */
export interface IDataProcessor {
    /**
     * Tipo de dato que este procesador maneja.
     * Debe coincidir con los valores de dataType en ingestData.
     */
    readonly type: string;

    /**
     * Procesa los datos y retorna el atleta actualizado.
     * 
     * @param payload - Datos crudos enviados por el módulo fuente
     * @param athlete - Instancia actual del atleta a modificar
     * @returns Objeto con el atleta actualizado y metadata del evento
     */
    process(payload: any, athlete: Athlete): Promise<ProcessorResult>;
}

export interface ProcessorResult {
    /** Atleta con modificaciones aplicadas */
    updated: Athlete;

    /** Tipo de evento a publicar en EventBus */
    eventType: string;

    /** Datos adicionales para el evento (opcional) */
    eventData?: any;

    /** 
     * Si es true, el DataRing NO guardará 'updated' en la BD.
     * Útil cuando el procesador delega la escritura a una Cloud Function.
     */
    skipPersistence?: boolean;
}
