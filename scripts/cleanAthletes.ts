/**
 * Script para limpiar atletas mock de Firestore
 * 
 * Uso:
 * 1. Importa este script en la consola del navegador
 * 2. Ejecuta listAthletes() para ver todos los atletas
 * 3. Ejecuta deleteAthlete('id') para eliminar atletas específicos
 */

import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function listAthletes() {
    try {
        const querySnapshot = await getDocs(collection(db, 'athletes'));
        const athletes: any[] = [];

        querySnapshot.forEach((doc) => {
            athletes.push({
                id: doc.id,
                name: doc.data().name,
                email: doc.data().email || 'N/A'
            });
        });

        console.log('=== ATLETAS EN FIRESTORE ===');
        console.table(athletes);
        console.log(`Total: ${athletes.length} atletas`);

        return athletes;
    } catch (error) {
        console.error('Error listing athletes:', error);
    }
}

export async function deleteAthlete(athleteId: string) {
    try {
        await deleteDoc(doc(db, 'athletes', athleteId));
        console.log(`✅ Atleta ${athleteId} eliminado`);
    } catch (error) {
        console.error('Error deleting athlete:', error);
    }
}

export async function cleanMockAthletes() {
    try {
        const athletes = await listAthletes();
        if (!athletes) return;

        // IDs de atletas mock conocidos (de constants.ts)
        const mockIds = ['1', '2', '3', '4', '5'];

        for (const athlete of athletes) {
            if (mockIds.includes(athlete.id)) {
                console.log(`🗑️ Eliminando atleta mock: ${athlete.name} (${athlete.id})`);
                await deleteAthlete(athlete.id);
            }
        }

        console.log('✅ Limpieza completada');
        await listAthletes();
    } catch (error) {
        console.error('Error cleaning mock athletes:', error);
    }
}

// Exportar para uso en consola
(window as any).listAthletes = listAthletes;
(window as any).deleteAthlete = deleteAthlete;
(window as any).cleanMockAthletes = cleanMockAthletes;
