# Solución de Problemas de Notificaciones

## Problema Identificado

Las notificaciones no aparecen porque Firestore requiere **índices compuestos** para consultas que combinan `where` y `orderBy` en campos diferentes.

## Solución

### Opción 1: Desplegar Índices Automáticamente (Recomendado)

1. Asegúrate de tener Firebase CLI instalado:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```

3. Despliega los índices:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. Espera 2-5 minutos para que los índices se construyan.

### Opción 2: Crear Índices Manualmente en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Indexes** (pestaña)
4. Haz clic en **Create Index**
5. Crea el siguiente índice:
   - **Collection ID**: `notifications`
   - **Fields to index**:
     - `userId` (Ascending)
     - `timestamp` (Descending)
   - **Query scope**: Collection
6. Haz clic en **Create**
7. Repite para el índice de `activities`:
   - **Collection ID**: `activities`
   - **Fields to index**:
     - `athleteId` (Ascending)
     - `timestamp` (Descending)

### Opción 3: Usar el Link Automático (Más Rápido)

Cuando abras la aplicación en el navegador:

1. Abre la **Consola del Navegador** (F12 o Cmd+Option+I)
2. Busca un error que diga algo como:
   ```
   The query requires an index. You can create it here: https://console.firebase.google.com/...
   ```
3. Haz clic en ese link
4. Confirma la creación del índice
5. Espera 2-5 minutos

## Verificación

Una vez creados los índices:

1. Recarga la aplicación
2. Abre la consola del navegador
3. Deberías ver logs como:
   ```
   [NotificationBell] Subscribing to notifications for user: [tu-user-id]
   [NotificationService] Snapshot received, docs: X
   [NotificationBell] Received notifications: X
   ```

4. Prueba enviando un mensaje en el chat
5. La campana de notificaciones debería mostrar un badge rojo con el número de mensajes no leídos

## Prueba Manual

Para probar las notificaciones manualmente:

1. Abre la consola del navegador
2. Ejecuta:
   ```javascript
   testNotification()
   ```
3. Deberías ver una notificación de prueba aparecer en la campana

## Archivos Modificados

- `firestore.indexes.json` - Configuración de índices
- `components/notifications/NotificationBell.tsx` - Logs de depuración
- `services/NotificationService.ts` - Manejo de errores mejorado
- `test-notification.ts` - Script de prueba

## Notas Importantes

- Los índices pueden tardar hasta 5 minutos en construirse
- Una vez creados, las notificaciones funcionarán en tiempo real
- Los logs en la consola te ayudarán a diagnosticar cualquier problema
