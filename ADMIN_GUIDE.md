# Guía de Administración - Elite Athletics

## 🔐 Cuenta de Administrador

### Credenciales del Admin Principal
```
Email: final_admin@elite.com
Contraseña: admin123456
```

> **⚠️ IMPORTANTE**: Cambia esta contraseña después del primer login en producción.

### Cómo Iniciar Sesión como Admin
1. Ve a: http://localhost:5173 (o tu URL de producción)
2. Haz clic en **"Entrar"** (no en "Registrarse")
3. Ingresa el email y contraseña del admin
4. Serás redirigido automáticamente al **Panel de Administración**

---

## 👥 Flujo de Registro de Nuevos Usuarios

### Para Atletas y Staff

#### 1. **Registro Inicial**
Los nuevos usuarios (atletas o staff) deben:
1. Ir a la aplicación
2. Hacer clic en **"Registrarse"**
3. Ingresar su email y contraseña
4. Hacer clic en **"Crear Cuenta"**

#### 2. **Estado Pendiente**
Después del registro:
- El usuario será creado con estado **"PENDING"** (Pendiente)
- Verá una pantalla que dice: *"Tu cuenta está pendiente de aprobación"*
- **NO podrá acceder** a ninguna funcionalidad hasta que un admin lo apruebe

#### 3. **Aprobación por Admin**
Como administrador, debes:
1. Iniciar sesión con tu cuenta admin
2. En el Panel de Administración verás:
   - **Total Usuarios**: Número total de usuarios
   - **Pendientes**: Usuarios esperando aprobación (badge rojo)
3. Haz clic en el filtro **"PENDING"** para ver solo usuarios pendientes
4. Para cada usuario pendiente verás:
   - Email del usuario
   - Fecha de registro
   - Botones de acción

#### 4. **Aprobar Usuario**
Para aprobar un usuario:
1. Haz clic en el botón **"Aprobar"** (verde)
2. Selecciona el rol apropiado:
   - **ATHLETE** (Atleta) - Acceso al dashboard de atleta
   - **STAFF** (Entrenador) - Acceso al dashboard de staff
   - **ADMIN** (Administrador) - Acceso total al panel de administración
3. Confirma la aprobación
4. El usuario recibirá acceso inmediatamente

#### 5. **Rechazar Usuario**
Si necesitas rechazar un usuario:
1. Haz clic en el botón **"Rechazar"** (rojo)
2. El usuario será marcado como rechazado
3. No podrá acceder a la aplicación

---

## 🎯 Roles y Permisos

### ATHLETE (Atleta)
- ✅ Ver su propio perfil
- ✅ Ver su plan de entrenamiento
- ✅ Analizar videos
- ✅ Usar el chat de IA
- ✅ Ver métricas de salud
- ❌ No puede ver otros atletas
- ❌ No puede aprobar usuarios

### STAFF (Entrenador)
- ✅ Todo lo de ATHLETE
- ✅ Ver lista de atletas vinculados
- ✅ Revisar videos de atletas
- ✅ Gestionar planes de entrenamiento
- ✅ Ver métricas de todos sus atletas
- ❌ No puede aprobar usuarios
- ❌ No puede cambiar roles

### ADMIN (Administrador)
- ✅ Todo lo de STAFF
- ✅ Aprobar/rechazar usuarios
- ✅ Cambiar roles de usuarios
- ✅ Ver todos los usuarios del sistema
- ✅ Gestión completa del sistema

---

## 📋 Tareas Comunes del Admin

### Ver Usuarios Pendientes
```
1. Login como admin
2. Panel de Administración → Badge "Pendientes" muestra el número
3. Click en filtro "PENDING"
4. Verás lista de usuarios esperando aprobación
```

### Cambiar Rol de un Usuario
```
1. Panel de Administración
2. Busca el usuario (usa filtros si es necesario)
3. Click en "Cambiar Rol"
4. Selecciona el nuevo rol
5. Confirma el cambio
```

### Ver Todos los Atletas
```
1. Panel de Administración
2. Click en filtro "ATHLETE"
3. Verás todos los atletas aprobados
```

### Ver Todos los Entrenadores
```
1. Panel de Administración
2. Click en filtro "STAFF"
3. Verás todos los entrenadores aprobados
```

---

## 🔄 Flujo Completo de Ejemplo

### Escenario: Nuevo Atleta se Registra

1. **Juan** va a la app y se registra:
   - Email: `juan@email.com`
   - Contraseña: `juan123`
   - Click en "Crear Cuenta"

2. **Juan** ve la pantalla:
   > "Tu cuenta está pendiente de aprobación por un administrador"

3. **Tú (Admin)** recibes la notificación:
   - Badge "Pendientes" cambia de 0 → 1
   - Ves a Juan en la lista de pendientes

4. **Tú (Admin)** apruebas a Juan:
   - Click en "Aprobar"
   - Seleccionas rol "ATHLETE"
   - Click en "Confirmar"

5. **Juan** puede ahora:
   - Cerrar sesión y volver a entrar
   - Acceder al dashboard de atleta
   - Usar todas las funcionalidades

---

## 🚨 Importante

### Seguridad
- ✅ Solo el primer usuario registrado es admin automáticamente
- ✅ Todos los demás usuarios requieren aprobación
- ✅ Los usuarios pendientes NO pueden acceder a ninguna funcionalidad
- ✅ Solo los admins pueden aprobar usuarios

### Múltiples Admins
Si necesitas más administradores:
1. El usuario debe registrarse normalmente
2. Tú lo apruebas con rol **"ADMIN"**
3. Ese usuario tendrá acceso completo al panel de administración

### Cambiar Contraseña del Admin
Para cambiar tu contraseña de admin:
1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto "elite-athletics"
3. Authentication → Users
4. Busca tu email
5. Click en los 3 puntos → "Reset password"
6. Envía el email de reset o copia el link

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que estés usando el email correcto: `final_admin@elite.com`
2. Verifica que la contraseña sea correcta: `admin123456`
3. Revisa la consola del navegador (F12) para errores
4. Verifica que Firebase esté configurado correctamente en `.env`

---

## 🔒 Mejores Prácticas de Seguridad

### Protección de Datos

#### Permisos de Chat
- ✅ Solo los participantes pueden acceder a sus conversaciones
- ✅ Los mensajes y archivos adjuntos están protegidos
- ✅ Ningún usuario puede leer chats de otros

#### Almacenamiento de Archivos
- ✅ Videos: Solo el atleta propietario o staff asignado
- ✅ Telestrations: Solo el atleta propietario o staff
- ✅ Notas de voz: Solo el atleta propietario o staff
- ✅ Perfiles: Solo el usuario propietario o staff

#### Vinculación Staff-Atleta
- ✅ Solicitudes validadas por servidor (Cloud Functions)
- ✅ Solo el atleta puede aceptar/rechazar solicitudes
- ✅ Solo el atleta o staff pueden desvincularse
- ✅ Notificaciones automáticas de nuevas solicitudes

### Monitoreo y Auditoría

#### Actividades a Revisar
1. **Usuarios Pendientes**: Revisa regularmente para aprobar/rechazar
2. **Cambios de Rol**: Verifica que sean apropiados
3. **Vinculaciones**: Asegúrate que staff-atleta sean correctas

#### Señales de Alerta
- 🚨 Múltiples intentos de login fallidos
- 🚨 Usuarios con roles incorrectos
- 🚨 Solicitudes de vinculación sospechosas

### Gestión de Accesos

#### Principio de Mínimo Privilegio
- Solo otorga rol ADMIN a usuarios de confianza
- Usa rol STAFF para entrenadores
- Usa rol ATHLETE para atletas
- Revisa roles periódicamente

#### Revocación de Acceso
Para revocar acceso a un usuario:
1. Panel de Administración → Buscar usuario
2. Click en "Rechazar" o cambiar a rol PENDING
3. El usuario perderá acceso inmediatamente

### Respaldo y Recuperación

#### Datos Protegidos
- Firestore: Respaldo automático por Firebase
- Storage: Archivos persistentes
- Authentication: Gestionado por Firebase

#### En Caso de Emergencia
1. Accede a Firebase Console
2. Authentication → Users
3. Puedes deshabilitar usuarios manualmente
4. Firestore → Datos pueden restaurarse

### Cumplimiento

#### GDPR / Privacidad
- Los usuarios solo ven sus propios datos
- Staff solo ve datos de atletas vinculados
- Admin tiene acceso completo (necesario para gestión)

#### Eliminación de Datos
Para eliminar un usuario completamente:
1. Firebase Console → Authentication → Eliminar usuario
2. Firestore → Eliminar documentos del usuario
3. Storage → Eliminar archivos del usuario

---

## 🎓 Resumen Rápido

| Acción | Quién | Cómo |
|--------|-------|------|
| Registrarse | Cualquiera | Click "Registrarse" → Ingresar datos → Estado PENDING |
| Aprobar usuarios | Solo ADMIN | Panel Admin → PENDING → Aprobar → Seleccionar rol |
| Iniciar sesión | Usuarios aprobados | Click "Entrar" → Email y contraseña |
| Cambiar roles | Solo ADMIN | Panel Admin → Buscar usuario → Cambiar Rol |
| Ver pendientes | Solo ADMIN | Panel Admin → Badge "Pendientes" |

**¡El sistema está listo para usar!** 🚀
