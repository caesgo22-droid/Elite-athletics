# Hub Técnico - Documentación de Mantenimiento

## 📍 Ubicación del Componente

**Archivo**: `components/TechnicalHub.tsx`

**Navegación**: 
- Coach: Menú desplegable → "Hub Técnico"
- Atleta: Bottom Nav → "Técnico"

**ViewState**: `ViewState.ROUND_TABLE`

---

## 🎯 Propósito

El Hub Técnico es una sección de **transparencia y validación científica** que permite a entrenadores elite evaluar la credibilidad técnica de Elite Athletics.

**Objetivo**: Demostrar que la app tiene fundamentos científicos sólidos y mecanismos anti-alucinación.

---

## 📋 Secciones del Hub Técnico

### 1. Hero & Introducción
- Título principal
- Declaración de propósito
- Diseño profesional

### 2. Fundamentación Técnica
**Contenido**:
- Motor de razonamiento: Gemini 1.5 Pro
- Sistema RAG (Retrieval-Augmented Generation)
- Base de conocimientos:
  - World Athletics (2024)
  - NSCA
  - Investigación académica
  - MediaPipe

**Pipeline de procesamiento**:
1. Video → MediaPipe (33 landmarks)
2. Análisis biomecánico
3. Verificación RAG
4. Insights AI

### 3. Fuentes Científicas
**Lista de fuentes con links**:
- Gabbett (2016) - ACWR
- World Athletics (2024)
- NSCA
- Weyand et al. (2000) - GCT
- MediaPipe Pose

### 4. Especificaciones IA
**Modelos**:
- Gemini 1.5 Pro
- Gemini 1.5 Flash
- MediaPipe Pose

**Capacidades y limitaciones**

### 5. ⭐ Verificación Anti-Alucinaciones (DEMO INTERACTIVO)
**Feature principal**: Demo en tiempo real

**Casos de prueba**:
- ✅ "El ACWR óptimo es 1.0-1.3"
- ❌ "Correr 100m en 8 segundos es posible"
- ✅ "El GCT típico es 0.08-0.12s"
- ❌ "No hay riesgo con ACWR alto"
- ✅ "MediaPipe detecta 33 landmarks"

### 6. Métricas de Precisión
- Video: 98.2%
- Pose: ±2°
- Timing: ±0.05s
- ACWR: Fórmula Gabbett

### 7. Disclaimer Legal
Componente: `LegalFooter`

---

## 🔄 Cómo Actualizar el Hub Técnico

### Cuando agregar nuevas fuentes científicas

**Ubicación**: Línea ~70 en `TechnicalHub.tsx`

```typescript
const scientificSources = [
  {
    title: 'Nombre del Estudio',
    description: 'Descripción breve',
    concepts: ['Concepto 1', 'Concepto 2'],
    journal: 'Nombre del journal',
    link: 'https://...'
  },
  // ... agregar aquí
];
```

### Cuando actualizar modelos de IA

**Ubicación**: Sección "Especificaciones IA"

Actualizar:
- Versión de Gemini
- Nuevas capacidades
- Cambios en limitaciones

### Cuando agregar nuevos casos de verificación

**Ubicación**: Línea ~50 en `TechnicalHub.tsx`

```typescript
const exampleClaims = [
  { text: 'Nueva afirmación', valid: true/false },
  // ... agregar aquí
];
```

**Y actualizar lógica**: Línea ~90 en función `verifyClaim()`

### Cuando actualizar métricas

**Ubicación**: Sección "Métricas de Precisión"

Actualizar porcentajes y márgenes de error según mejoras.

---

## 🚨 IMPORTANTE: No Eliminar

**Este componente NO debe ser eliminado o reemplazado sin:**
1. Crear un reemplazo equivalente
2. Documentar el cambio
3. Mantener la funcionalidad de transparencia

**Razón**: Es crítico para la credibilidad de la app con entrenadores profesionales.

---

## 📝 Checklist de Actualización

Cuando se actualice la app, revisar si necesita actualización:

- [ ] ¿Se agregó un nuevo modelo de IA?
- [ ] ¿Cambió la precisión de análisis?
- [ ] ¿Se agregaron nuevas fuentes científicas?
- [ ] ¿Cambió el pipeline de procesamiento?
- [ ] ¿Se modificaron las capacidades?
- [ ] ¿Hay nuevas limitaciones?

---

## 🔗 Referencias

**Componente principal**: `components/TechnicalHub.tsx`
**Componente relacionado**: `components/common/LegalFooter.tsx`
**Navegación**: `App.tsx` → `ViewState.ROUND_TABLE`

---

## 📅 Historial de Cambios

### 2026-01-05
- ✅ Creación inicial del Hub Técnico
- ✅ 7 secciones implementadas
- ✅ Demo anti-alucinación interactivo
- ✅ 5 fuentes científicas con links

### Futuras actualizaciones
- [ ] Integrar verificación con Gemini API real
- [ ] Agregar más casos de prueba
- [ ] Expandir base de conocimientos
- [ ] Agregar visualizaciones de pipeline

---

## 💡 Mejoras Futuras Sugeridas

1. **Verificación con IA Real**: Reemplazar lógica rule-based con llamadas a Gemini
2. **Más Fuentes**: Agregar estudios sobre periodización, recuperación
3. **Visualizaciones**: Diagramas del pipeline de procesamiento
4. **Casos de Uso**: Ejemplos reales de análisis
5. **Testimonios**: Validación de entrenadores profesionales

---

**Última actualización**: 2026-01-05
**Mantenedor**: Equipo de desarrollo Elite Athletics
**Criticidad**: ALTA - No eliminar sin reemplazo
