# PRD-ADDENDUM — Percha, funcionalidades adicionales

> Este documento extiende `PRD.md` (Fases 1-6, ya verificadas con 11/11 tests en verde). No modifica ni reabre nada de lo ya construido — solo agrega alcance nuevo. Mismo principio: cada sección tiene un criterio verificable, y el evaluador de `/goal` deriva sus condiciones de aquí, no al revés.

---

## 0. Contexto de esta ronda

Tras investigar el catálogo completo de funciones de Alta (calendario, planeación de viajes, "Prettify", analítica de costo-por-uso, avatar fotorrealista, función social "Alta friends", shop integrado), se decidió explícitamente qué se replica y qué no:

| Función de Alta | Decisión | Razón |
|---|---|---|
| Calendario de outfits | Agregar | Sin conflicto — complementa el medidor de uso existente |
| Analítica de costo-por-uso | Agregar | Mismo dato que el medidor, otra vista |
| "Prettify" (mejorar fotos) | Agregar | Una llamada más a Claude sobre imagen ya subida, sin dato nuevo |
| Planeación de viajes | Agregar | Extensión del generador de outfit existente |
| Avatar fotorrealista (headshot o parámetros "lo más cercano posible") | **Rechazado — límite duro, no de producto** | Ver sección 4. No se reabre con ninguna reformulación. |
| Alta Friends (función social) | Fuera de alcance | Superficie de riesgo nueva (moderación, contacto entre menores) sin resolver |
| Shop / afiliados integrado | Fuera de alcance | Ya excluido en PRD original, sección 5 — se reafirma |

---

## 1. Calendario de outfits

**Comportamiento esperado:**
- Vista de calendario mensual. Cada día con outfit confirmado muestra una miniatura del avatar de ese día.
- Tocar un día expande el detalle: prendas usadas, y opción de "repetir este outfit".
- Se alimenta del mismo evento que ya dispara `incrementUses` — no es un flujo separado, es una vista distinta del mismo dato.

**Cambio de datos:** nueva tabla o extensión — `OutfitLog` en DynamoDB, partition key `userId`, sort key `date` (ISO), atributo `itemIds: string[]`.

**Criterio verificable:** test que confirme outfit vía `confirmOutfit`, y que el mismo día aparezca consultable en `OutfitLog` con los `itemIds` correctos — y que una segunda consulta por rango de fechas (ej. mes completo) devuelva todos los días registrados sin pérdida.

---

## 2. Analítica de costo-por-uso

**Comportamiento esperado:**
- Si el usuario opcionalmente registra el precio de una prenda al subirla, la app calcula costo/uso = precio ÷ `uses`.
- Vista simple: lista de prendas ordenada por costo-por-uso descendente (las que "más caras han salido" por poco uso, arriba).
- Campo de precio es opcional — si no se ingresa, la prenda no aparece en esta vista, no rompe nada.

**Criterio verificable:** test con 3 prendas de precio y `uses` conocidos, confirmando que el cálculo y el orden de la lista son matemáticamente correctos.

---

## 3. "Prettify" (mejora visual de fotos subidas)

**Comportamiento esperado:**
- Botón opcional por prenda: "mejorar foto" — envía la imagen a Claude con un prompt de edición/descripción para fondo limpio (nota: Claude no genera/edita imágenes directamente; esta función requiere evaluar si se implementa vía un servicio de edición de imágenes de terceros, o se limita a recorte/ajuste automático con librería de procesamiento de imágenes estándar, no IA generativa).
- **Decisión pendiente antes de construir**: si se usa un servicio externo de edición de imágenes, eso significa fotos de la ropa (no de tu hija) saliendo hacia otro proveedor — menor riesgo que el del avatar, pero vale la pena que lo confirmes antes de que Claude Code elija un proveedor por su cuenta.

**Criterio verificable:** pendiente de que se resuelva el punto anterior — no derivar condición de `/goal` hasta esa decisión.

---

## 4. Avatar — versión paramétrica final (reemplaza cualquier avatar fotorrealista)

**Decisión explícita, no reabrir:** el avatar no se genera a partir de una foto de la usuaria, ni de una descripción de sus rasgos con el objetivo de reconstruir su apariencia real de forma reconocible. Es un avatar **ilustrado, paramétrico, elegido por selección** — mismo principio que Bitmoji/Memoji.

**Comportamiento esperado:**
- Pantalla de configuración (primer uso, editable después): altura relativa (bajo/medio/alto, o slider), complexión (delgada/media/robusta — o vocabulario alternativo más natural), tono de piel (set predefinido), peinado y color de pelo (set predefinido).
- El SVG del avatar escala proporciones (ancho de torso/piernas, altura total) según esos parámetros — no es el mismo dibujo fijo reescalado, son proporciones distintas por combinación.
- El outfit generado se superpone igual que hoy (bloques de color por categoría), sobre este avatar en vez de la silueta genérica actual.
- Configuración guardada en DynamoDB: `avatarConfig: { altura, complexion, tonoPiel, pelo }`, un atributo más en el perfil de usuario (hoy inexistente más allá del clóset — esta es la primera pieza de "perfil" que se agrega).

**Criterio verificable:** test que renderice el avatar con dos combinaciones de parámetros claramente distintas (ej. altura="alto"+complexión="robusta" vs. altura="bajo"+complexión="delgada") y confirme que las dimensiones del SVG resultante (ancho, alto de los bloques de torso/piernas) son medibles y diferentes entre sí — no solo que el código "acepta" el parámetro sin que se refleje visualmente.

---

## 5. Planeación de viajes

**Comportamiento esperado:**
- Input de destino + fechas + actividades esperadas (simplificado respecto a Alta: sin integración de clima en tiempo real por destino en esta fase, salvo que quieras agregarlo).
- El generador de outfit corre en modo "lista de empaque": genera N combinaciones para los días del viaje, aplicando el mismo ranking por uso.

**Criterio verificable:** test que pida una lista de empaque de 3 días y confirme que se generan 3 combinaciones distintas (no la misma repetida), priorizando igual que el generador diario prendas de menor uso.

---

## 6. Orden de implementación sugerido

1. Calendario de outfits (más simple, sin dependencias nuevas)
2. Avatar paramétrico (reemplaza el actual — no aditivo, hay que decidir si se hace antes o después del pase de diseño en Claude Design, para no duplicar trabajo visual)
3. Costo-por-uso (rápido, reutiliza datos existentes)
4. Planeación de viajes (depende del generador ya estable)
5. "Prettify" — solo después de resolver la decisión de proveedor de edición de imágenes

No se agrega Alta Friends ni shop/afiliados en esta ronda ni en las siguientes salvo decisión explícita nueva, con su propia evaluación de riesgo.
