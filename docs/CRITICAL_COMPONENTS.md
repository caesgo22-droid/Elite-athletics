# Elite Athletics - Documentación de Componentes Críticos

## 🎯 Componentes que NO deben eliminarse

Esta lista documenta componentes críticos para la funcionalidad y credibilidad de la app.

---

## 1. Hub Técnico (TechnicalHub.tsx)

**Ubicación**: `components/TechnicalHub.tsx`

**Propósito**: Transparencia y validación científica para entrenadores elite

**Criticidad**: ⚠️ ALTA

**Por qué es crítico**:
- Demuestra credibilidad científica
- Muestra fuentes y referencias
- Demo anti-alucinación
- Diferenciador competitivo

**Documentación**: `docs/TECHNICAL_HUB.md`

**Navegación**:
- Coach: Menú → "Hub Técnico"
- Atleta: Bottom Nav → "Técnico"

---

## 2. LegalFooter (LegalFooter.tsx)

**Ubicación**: `components/common/LegalFooter.tsx`

**Propósito**: Disclaimer legal y métricas de precisión

**Criticidad**: ⚠️ ALTA

**Por qué es crítico**:
- Protección legal
- Transparencia de limitaciones
- Usado en Hub Técnico

**Usado en**:
- TechnicalHub
- (Anteriormente en AthleteProfile)

---

## 3. DataRing (CoreArchitecture.ts)

**Ubicación**: `services/CoreArchitecture.ts`

**Propósito**: Sistema central de gestión de datos

**Criticidad**: ⚠️ CRÍTICA

**Por qué es crítico**:
- Arquitectura core
- Gestión de estado
- Usado en toda la app

---

## 4. Brain (CoreArchitecture.ts)

**Ubicación**: `services/CoreArchitecture.ts`

**Propósito**: Orquestación de agentes IA

**Criticidad**: ⚠️ ALTA

**Por qué es crítico**:
- Multi-agent system
- Análisis inteligente
- Toma de decisiones

---

## 5. MediaPipe Integration (VideoAnalyzer.tsx)

**Ubicación**: `components/VideoAnalyzer.tsx`

**Propósito**: Análisis biomecánico de video

**Criticidad**: ⚠️ CRÍTICA

**Por qué es crítico**:
- Feature principal
- Diferenciador único
- 33 landmarks detection

---

## 📋 Checklist Antes de Eliminar Componentes

Antes de eliminar CUALQUIER componente, verificar:

- [ ] ¿Está en esta lista de componentes críticos?
- [ ] ¿Tiene dependencias en otros componentes?
- [ ] ¿Hay documentación asociada?
- [ ] ¿Existe un reemplazo equivalente?
- [ ] ¿Se actualizó la navegación?
- [ ] ¿Se probó la app sin el componente?

---

## 🔄 Proceso de Actualización

### Para componentes críticos:

1. **Documentar cambios** en `docs/`
2. **Crear backup** del componente original
3. **Actualizar referencias** en toda la app
4. **Probar exhaustivamente**
5. **Actualizar esta lista**

---

## 📝 Historial de Cambios Importantes

### 2026-01-05
- ✅ Creado TechnicalHub.tsx
- ✅ Movido LegalFooter de AthleteProfile a TechnicalHub
- ✅ Reemplazado RoundTable con TechnicalHub

### Cambios anteriores
- RoundTable.tsx → Reemplazado por TechnicalHub
- ActivityFeed → Comentado temporalmente

---

**Última actualización**: 2026-01-05
**Mantenedor**: Equipo de desarrollo Elite Athletics
