# Elite Athletics - README

## 📱 Sobre la App

Elite Athletics es una plataforma de entrenamiento inteligente para velocistas que combina análisis biomecánico con IA para optimizar el rendimiento atlético.

---

## 🏗️ Arquitectura

### Componentes Core
- **DataRing**: Sistema de gestión de datos
- **Brain**: Orquestación de agentes IA
- **MediaPipe**: Análisis biomecánico

### Componentes Principales
- **AthleteDashboard**: Panel principal del atleta
- **CoachDashboard**: Command Center para entrenadores
- **TechnicalHub**: Transparencia y validación científica ⭐
- **VideoAnalysis**: Análisis de técnica con IA
- **TrainingPlan**: Planificación periodizada

---

## 📚 Documentación

### Documentos Importantes

- **[CRITICAL_COMPONENTS.md](docs/CRITICAL_COMPONENTS.md)**: Lista de componentes que NO deben eliminarse
- **[TECHNICAL_HUB.md](docs/TECHNICAL_HUB.md)**: Documentación del Hub Técnico
- **[README.md](README.md)**: Este archivo

### Antes de Modificar

1. Revisar `docs/CRITICAL_COMPONENTS.md`
2. Verificar dependencias
3. Documentar cambios
4. Probar exhaustivamente

---

## 🚀 Desarrollo

### Estructura de Carpetas

```
Elite-athletics/
├── components/          # Componentes React
│   ├── common/         # Componentes reutilizables
│   ├── chat/           # Sistema de chat
│   ├── video/          # Análisis de video
│   └── viz/            # Visualizaciones
├── services/           # Lógica de negocio
│   ├── CoreArchitecture.ts
│   ├── geminiService.ts
│   └── processors/
├── ai/                 # Agentes y prompts
├── docs/              # Documentación ⭐
└── types.ts           # Definiciones TypeScript
```

---

## 🔑 Features Principales

1. **Análisis de Video con IA**
   - MediaPipe Pose (33 landmarks)
   - Cálculos biomecánicos
   - Feedback en tiempo real

2. **Planificación Inteligente**
   - Periodización automática
   - ACWR monitoring
   - Prevención de lesiones

3. **Hub Técnico** ⭐
   - Transparencia científica
   - Fuentes verificadas
   - Demo anti-alucinación

4. **Multi-Agent System**
   - Physiologist
   - Strategist
   - Auditor
   - Head Coach

---

## ⚠️ Componentes Críticos

**NO ELIMINAR** sin reemplazo:
- TechnicalHub.tsx
- LegalFooter.tsx
- CoreArchitecture.ts
- VideoAnalyzer.tsx

Ver `docs/CRITICAL_COMPONENTS.md` para lista completa.

---

## 🔄 Mantenimiento

### Actualizar Hub Técnico

Cuando la app mejore, actualizar:
- Fuentes científicas
- Modelos de IA
- Métricas de precisión
- Casos de verificación

Ver `docs/TECHNICAL_HUB.md` para instrucciones.

---

## 📝 Convenciones

### Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `refactor:` Refactorización

### Componentes
- PascalCase para nombres
- Props interface definida
- TypeScript estricto

---

## 🤝 Contribución

1. Revisar documentación en `docs/`
2. Verificar componentes críticos
3. Documentar cambios
4. Probar exhaustivamente

---

**Última actualización**: 2026-01-05
**Versión**: 2.5.0-BETA
