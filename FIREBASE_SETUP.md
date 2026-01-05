# Elite Athletics - Configuración de Firebase

## ⚠️ IMPORTANTE: Configurar Variables de Entorno

El error `auth/api-key-not-valid` indica que las credenciales de Firebase no están configuradas.

## Solución Rápida

### Paso 1: Crear archivo `.env`

Crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Paso 2: Obtener Credenciales de Firebase

1. **Ir a Firebase Console**: https://console.firebase.google.com
2. **Seleccionar tu proyecto** (o crear uno nuevo)
3. **Ir a Project Settings** (⚙️ icono en la parte superior izquierda)
4. **Scroll down** hasta "Your apps"
5. **Si no tienes una Web App**:
   - Click en el icono `</>` (Web)
   - Registrar app con nombre "Elite Athletics"
   - Copiar el objeto `firebaseConfig`
6. **Si ya tienes una Web App**:
   - Click en el icono de configuración
   - Copiar los valores del `firebaseConfig`

### Paso 3: Copiar Valores al .env

Ejemplo de cómo se ve en Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrst",
  authDomain: "elite-athletics-12345.firebaseapp.com",
  projectId: "elite-athletics-12345",
  storageBucket: "elite-athletics-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

Copia estos valores a tu `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrst
VITE_FIREBASE_AUTH_DOMAIN=elite-athletics-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=elite-athletics-12345
VITE_FIREBASE_STORAGE_BUCKET=elite-athletics-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### Paso 4: Habilitar Servicios en Firebase

#### Authentication
1. En Firebase Console, ir a **Authentication**
2. Click **Get started**
3. Habilitar **Email/Password**
4. En **Settings** > **Authorized domains**, agregar:
   - `localhost`
   - Tu dominio de Vercel (si lo tienes)

#### Firestore Database
1. En Firebase Console, ir a **Firestore Database**
2. Click **Create database**
3. Seleccionar **Start in test mode** (por ahora)
4. Elegir región (us-central1 recomendado)

#### Storage
1. En Firebase Console, ir a **Storage**
2. Click **Get started**
3. Usar reglas de test por ahora

### Paso 5: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### Paso 6: Probar Registro

1. Ir a http://localhost:5173
2. Click "Registrarse"
3. Email: `admin@elite.com`
4. Password: `admin123`
5. Click "Crear Cuenta"

**Resultado esperado**: 
- ✅ Usuario creado exitosamente
- ✅ Redirige a AdminPanel (primer usuario es admin automático)

---

## 🔍 Verificación

Si todo está bien configurado:
- ✅ No hay error en la consola
- ✅ Usuario aparece en Firebase Console > Authentication
- ✅ Usuario aparece en Firestore > users collection
- ✅ El usuario tiene `role: "ADMIN"` y `status: "APPROVED"`

---

## ❌ Troubleshooting

### Error: "auth/api-key-not-valid"
- Verifica que copiaste correctamente el `apiKey`
- Verifica que no hay espacios extras
- Verifica que el proyecto existe en Firebase Console

### Error: "auth/unauthorized-domain"
- Agrega `localhost` a dominios autorizados
- Firebase Console > Authentication > Settings > Authorized domains

### El .env no se carga
- Verifica que el archivo se llama exactamente `.env` (no `.env.txt`)
- Verifica que está en la raíz del proyecto
- Reinicia el servidor después de crear el archivo

---

## 📝 Nota de Seguridad

> **IMPORTANTE**: El archivo `.env` ya está en `.gitignore`, por lo que tus credenciales NO se subirán a GitHub. Esto es correcto y seguro.

Para producción (Vercel), configura las variables de entorno en:
Vercel Dashboard > Tu Proyecto > Settings > Environment Variables
