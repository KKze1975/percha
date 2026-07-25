# GOAL-PROMPT — Cómo construir Percha con `/goal`

> Este documento es el prompt inicial que se le da a Claude Code. Su trabajo es leer `docs/PRD.md` y derivar, sección por sección, condiciones de `/goal` verificables — no copiar el PRD como condición literal.

---

## Instrucciones para Claude Code

Vas a construir "Percha", una app Next.js/Vercel especificada completa en `docs/PRD.md`. Léelo completo antes de escribir código, con atención especial a la sección 2 (stack) y sección 7 (por qué DynamoDB y no Sheets, a diferencia del proyecto hermano Flujo).

**Regla central, aprendida de un caso previo donde `/goal` produjo un resultado técnicamente correcto pero sin sustancia real**: una condición de `/goal` es una especificación de producto, no solo una casilla de verificación. Si conviertes cada sección del PRD en una condición del tipo "la función existe", vas a producir algo que compila pero no demuestra que el mecanismo central (priorizar prendas con menos usos) realmente funciona contra datos reales de DynamoDB. Cada condición que definas debe incluir el criterio verificable que ya está descrito en el PRD para esa sección.

### Antes de empezar: infraestructura

Esta fase no está en el alcance funcional del PRD pero es prerequisito técnico:
1. Confirma o crea la tabla DynamoDB `ClosetItems` (partition key `userId`, sort key `itemId`) — no asumas que ya existe.
2. Confirma acceso a la carpeta de Google Drive dedicada al proyecto vía cuenta de servicio.
3. Confirma que las variables de entorno (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, credenciales de Drive, `ANTHROPIC_API_KEY`) están configuradas en `.env.local` y en Vercel — sin pedir que se hardcodeen en ningún momento.

Si algo de esto falta, pregúntame antes de improvisar credenciales o mockear infraestructura como si fuera el estado final.

### Cómo trabajar

1. Construye por fases, una condición de `/goal` por fase.
2. Orden sugerido de fases:
   - Fase 0 — Infraestructura (tabla DynamoDB, acceso a Drive, env vars) — ver arriba
   - Fase 1 — Setup Next.js + capa de persistencia DynamoDB (sección 3.5)
   - Fase 2 — Carga de clóset individual + batch → Drive + DynamoDB (sección 3.1)
   - Fase 3 — Categorización IA (sección 3.2)
   - Fase 4 — Generador de outfit + ranking por uso (sección 3.3) — **fase crítica, no la apures**
   - Fase 5 — Avatar simplificado (sección 3.4)
   - Fase 6 — Medidor de uso real (sección 3.6)
   - Fase 7 — Pase de diseño sobre las 3 pantallas (sección 4)
3. Para cada fase, antes de correr `/goal`, escribe o actualiza el test que va a servir de evidencia. El evaluador de `/goal` solo lee lo que aparece en la conversación — si el test no corre y su output no queda en la transcripción, el evaluador no tiene cómo confirmar nada real.
4. La condición de `/goal` de cada fase debe nombrar el comando o test exacto que la demuestra, `npx tsc --noEmit` limpio (invariante heredado de Flujo, sección 2 del PRD), más un límite de turnos. Ejemplo de forma (deriva el tuyo desde el PRD, no lo copies literal):
   `/goal el test de integración de carga individual+batch pasa contra DynamoDB (ver criterio verificable 3.1), `npx tsc --noEmit` no tiene errores, o detente después de 15 turnos y reporta qué falta`

### Atención especial a la Fase 4 (generador de outfit)

Esta es la fase que decide si el clon realmente replica el mecanismo que motivó el proyecto. El criterio verificable del PRD (sección 3.3) pide evidencia estadística contra datos reales de DynamoDB, no solo funcional: que las prendas con `uses: 0` aparezcan con más frecuencia que el azar en 5 corridas del generador, y que el update `ADD uses :incr` efectivamente se ejecute tras cada outfit confirmado. Si tu condición de `/goal` para esta fase no incluye ambos chequeos explícitamente, el evaluador puede dar por bueno un generador que ignora el campo `uses` o que no persiste el incremento.

### Qué NO hacer

- No conviertas "diseño propio, no imitar a Alta" en una condición vaga de `/goal` — revisa capturas tú mismo (el usuario) en la Fase 7, no dejes que el evaluador automático decida estética.
- No implementes nada de la sección 5 del PRD (afiliados, notificaciones, sistema de cuentas completo) aunque parezca un paso natural.
- No uses credenciales AWS ni de Google hardcodeadas en el código — variables de entorno, siempre, y respeta least-privilege en el IAM del rol de DynamoDB.
- No mockees DynamoDB o Drive de forma permanente "para avanzar más rápido" — el PRD exige que los criterios verificables corran contra la infraestructura real, no contra mocks que nunca se reemplazan.

### Al terminar todas las fases

Corre `/goal` una vez más con una condición de integración: que las 6 funciones del PRD funcionen encadenadas en un flujo real (subir 3 fotos → generar outfit → ver avatar → confirmar → medidor de uso sube), verificado contra la tabla DynamoDB real y documentado con capturas o log de sesión — no una demo hecha a mano por separado del código que quedó en el repo.
