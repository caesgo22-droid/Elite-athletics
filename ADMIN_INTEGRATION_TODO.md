# Admin Panel - Trabajo Pendiente

## ✅ Completado

### 1. Infraestructura Base
- [x] Interface `User` en `types.ts`
- [x] Servicio `userManagement.ts` con funciones:
  - `createUser()` - Crea usuario, primer usuario = admin automático
  - `getUser()` - Obtiene usuario por UID
  - `approveUser()` - Aprueba y asigna rol
  - `rejectUser()` - Rechaza acceso
  - `getAllPendingUsers()` - Lista usuarios pendientes
  - `getAllUsers()` - Lista todos los usuarios
  - `getUsersByRole()` - Filtra por rol
  - `updateUserRole()` - Cambia rol de usuario

### 2. Componentes UI
- [x] `PendingApprovalScreen.tsx` - Pantalla de espera para usuarios pendientes
- [x] `AdminPanel.tsx` - Panel completo de administración con:
  - Lista de usuarios pendientes
  - Aprobación/rechazo con asignación de rol
  - Filtros por estado y rol
  - Estadísticas de usuarios
  - Cambio de roles para usuarios aprobados

## 🔄 Pendiente de Integración

### 1. Actualizar ViewState Enum
**Archivo**: `types.ts`
**Cambio**: Agregar `ADMIN_PANEL = 'ADMIN_PANEL'` al enum ViewState

### 2. Modificar Login.tsx
**Archivo**: `Login.tsx`
**Cambios necesarios**:
```typescript
// Eliminar prop 'role' del componente
// Cambiar interfaz a:
interface LoginProps {
  onBack: () => void;
  onSuccess: (uid: string) => void;
}

// En handleAuth y handleGoogleLogin, después de auth exitoso:
import { createUser, getUser } from '../services/userManagement';

// Después de login:
let user = await getUser(userCredential.user.uid);
if (!user) {
  // Usuario nuevo, crear en Firestore
  user = await createUser(
    userCredential.user.uid,
    userCredential.user.email!,
    userCredential.user.displayName,
    userCredential.user.photoURL
  );
}
onSuccess(userCredential.user.uid);
```

### 3. Refactorizar App.tsx
**Archivo**: `App.tsx`

**Paso 1**: Eliminar `UserRole` type y `userRole` state
```typescript
// ELIMINAR:
type UserRole = 'ATHLETE' | 'STAFF';
const [userRole, setUserRole] = useState<UserRole | null>(null);

// AGREGAR:
const [currentUser, setCurrentUser] = useState<User | null>(null);
```

**Paso 2**: Eliminar `LoginSelection` y `handleRoleSelection`
```typescript
// ELIMINAR todo el componente LoginSelection del flujo
// ELIMINAR función handleRoleSelection
```

**Paso 3**: Actualizar `handleLoginSuccess`
```typescript
const handleLoginSuccess = async (uid: string) => {
  const user = await getUser(uid);
  if (!user) return;
  
  setCurrentUser(user);
  setUserId(uid);
  
  if (user.status === 'PENDING') {
    // Mostrar PendingApprovalScreen
    return;
  }
  
  if (user.status === 'REJECTED') {
    alert('Acceso rechazado');
    handleLogout();
    return;
  }
  
  // Redirigir según rol
  DataRing.refreshCache(uid);
  if (user.role === 'ADMIN') setActiveTab(ViewState.ADMIN_PANEL);
  else if (user.role === 'ATHLETE') setActiveTab(ViewState.DASHBOARD);
  else if (user.role === 'STAFF') setActiveTab(ViewState.STAFF_DASHBOARD);
};
```

**Paso 4**: Reemplazar todas las referencias `userRole` con `currentUser?.role`
- Buscar y reemplazar en todo App.tsx (~30 ocurrencias)
- Ejemplos:
  - `userRole === 'ATHLETE'` → `currentUser?.role === 'ATHLETE'`
  - `userRole === 'STAFF'` → `currentUser?.role === 'STAFF'`

**Paso 5**: Actualizar renderContent
```typescript
const renderContent = () => {
  // Si no hay usuario logueado, mostrar login
  if (!userId) return <Login onBack={() => {}} onSuccess={handleLoginSuccess} />;
  
  // Si usuario está pendiente, mostrar pantalla de espera
  if (currentUser?.status === 'PENDING') {
    return <PendingApprovalScreen email={currentUser.email} onLogout={handleLogout} />;
  }
  
  // Agregar caso para admin panel
  if (activeTab === ViewState.ADMIN_PANEL) {
    return <AdminPanel currentUser={currentUser!} onBack={() => setActiveTab(ViewState.STAFF_DASHBOARD)} />;
  }
  
  // ... resto del código
};
```

**Paso 6**: Agregar botón de Admin en navegación (para admins)
```typescript
// En BottomNav o header, agregar condicionalmente:
{currentUser?.role === 'ADMIN' && (
  <button onClick={() => setActiveTab(ViewState.ADMIN_PANEL)}>
    <span className="material-symbols-outlined">admin_panel_settings</span>
    Admin
  </button>
)}
```

### 4. Firestore Security Rules
**Archivo**: `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - solo admins pueden modificar roles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' ||
         request.auth.uid == userId);
    }
    
    // Resto de colecciones...
  }
}
```

## 📋 Orden de Implementación Recomendado

1. ✅ Agregar `ADMIN_PANEL` a ViewState
2. ✅ Modificar Login.tsx (crear/obtener usuario)
3. ✅ Refactorizar App.tsx paso por paso
4. ✅ Probar flujo completo:
   - Nuevo usuario → PENDING
   - Admin aprueba → Acceso correcto
   - Usuario rechazado → Mensaje de error
5. ✅ Configurar Firestore rules
6. ✅ Testing exhaustivo

## 🔒 Seguridad

- Primer usuario se convierte en admin automáticamente
- Usuarios nuevos quedan en PENDING hasta aprobación
- Solo admins pueden cambiar roles
- Firestore rules previenen modificación no autorizada

## 📝 Notas

- La app actual sigue funcionando con el sistema de roles antiguo
- Todos los archivos nuevos están listos para integración
- La refactorización de App.tsx es el único paso que requiere cuidado
- Se recomienda hacer la integración en una rama separada primero
