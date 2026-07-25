# PRD — Percha (clon funcional de Alta, Next.js/Vercel — stack Flujo)

> Este documento es la especificación de producto. No es un checklist de verificación — es el material del que Claude Code deriva condiciones de `/goal`. Ver GOAL-PROMPT.md para cómo se usa.

---

## 0. Contexto y por qué existe este documento

Un MVP web previo (loop completo: subir ropa → categorización IA → recomendación de outfit → avatar simplificado) validó el mecanismo núcleo con una usuaria real: priorizar en la recomendación las prendas con **menos usos registrados**, no las más recientes o "de tendencia". Este mecanismo ataca directamente el hábito de elegir siempre lo mismo por evitar carga cognitiva — que es el dolor reportado por la usuaria, no una hipótesis sin contrastar.

Este PRD es para la versión web (Next.js/Vercel), alineada al stack real del proyecto Flujo, que replica la funcionalidad de Alta como ejercicio técnico de clonación — **no la marca, no el nombre, no los assets visuales de Alta**.

**Lección aplicada de casos previos con `/goal`:** una condición que solo mide "compila y las funciones existen" produce apps técnicamente correctas y vacías de experiencia. Cada sección de este PRD incluye **criterios verificables**, no solo adjetivos de calidad.

---

## 1. Alcance funcional (fijado en conversación previa — no reabrir sin decisión explícita)

| Función | Incluida | Explícitamente excluida |
|---|---|---|
| Carga de clóset: foto individual | Sí | — |
| Carga de clóset: importación batch | Sí | — |
| Categorización automática por IA (tipo, color, clima, estilo) | Sí | — |
| Generador de outfit por clima + ocasión | Sí | — |
| Ranking que prioriza prendas con menos usos | Sí | Ranking por tendencia externa o "lo más nuevo" |
| Avatar / probador virtual | Sí, simplificado (silueta por color/categoría) | Try-on fotorrealista |
| Persistencia real (DynamoDB) | Sí | — |
| Medidor de "% de clóset usado" | Sí | — |
| Afiliados / enlaces de compra | **No** | Toda integración con marcas externas |
| Notificaciones push / trigger de reentrada | Fuera de este PRD (ver sección 6) | — |

---

## 2. Requisitos técnicos (stack alineado a Flujo)

- **Framework**: Next.js (App Router), TypeScript, desplegado en Vercel.
- **Persistencia estructurada**: **DynamoDB** (AWS) para el inventario del clóset — una tabla `ClosetItems` con `userId` como partition key y `itemId` como sort key (o UUID simple si es de un solo usuario en esta fase). Atributos: `category`, `color`, `warmth`, `style`, `uses`, `driveFileId`, `createdAt`.
- **Almacenamiento de imágenes**: **Google Drive** — cada foto subida se guarda en una carpeta dedicada de Drive, y el `driveFileId` resultante se referencia en el ítem de DynamoDB. Mismo patrón que Flujo usa con Sheets+Drive, adaptado a Sheets→DynamoDB.
- **Credenciales AWS**: vía variables de entorno de Vercel (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`), nunca hardcodeadas. Dado el perfil AWS del propio autor, usar least-privilege real en el IAM role/usuario de DynamoDB — no una policy amplia "por ahora".
- **Credenciales Google Drive**: cuenta de servicio con acceso solo a la carpeta dedicada del proyecto, no a todo el Drive personal.
- **IA**: llamadas a la API de Claude (Anthropic) para (a) categorización de prenda por imagen, (b) generación de outfit por texto/JSON.
- **Invariante heredado de Flujo, aplicable aquí**: `tsc` limpio antes de cualquier commit (equivalente a I-07 de Flujo).

---

## 3. Especificación por función, con criterios verificables

### 3.1 Carga de clóset (individual + batch)

**Comportamiento esperado:**
- Input de archivo (individual o multi-selección) en el frontend Next.js.
- Cada imagen se sube a Google Drive vía API route (`app/api/closet/upload/route.ts`), se obtiene `driveFileId`, y se dispara la categorización.
- Cada prenda aparece en la grilla del clóset en menos de ~5 segundos tras la subida (categorización incluida).

**Criterio verificable:** test de integración (Vitest + mocks de Drive/DynamoDB, o Playwright end-to-end) que suba 1 imagen individual y 3 en batch, y confirme 4 registros en DynamoDB con `category`, `color`, `warmth`, `driveFileId` no vacíos.

### 3.2 Categorización automática por IA

**Comportamiento esperado:**
- La API route de categorización descarga la imagen de Drive (o recibe el buffer directo antes de subir), la envía a la API de Claude, y guarda el JSON resultante en DynamoDB.
- Si la API falla o el JSON es inválido, no se cae — fallback razonable, ítem marcado como "revisar".

**Criterio verificable:** test que ejerza un ciclo real de llamada a la API con una imagen de prueba, la respuesta parseada, y el manejo de fallo (mock de error 500 o JSON malformado) sin romper la ruta.

### 3.3 Generador de outfit (clima + ocasión + ranking por uso)

**Comportamiento esperado:**
- UI de selección de clima/ocasión.
- API route que lee el inventario completo de DynamoDB (incluyendo `uses`), llama a Claude con ese inventario, y recibe una combinación + razón corta.
- Las prendas elegidas incrementan su `uses` en DynamoDB (update atómico, `ADD uses :incr`) tras confirmarse el outfit.

**Criterio verificable — el más importante:**
Test con un clóset simulado de al menos 6 ítems en DynamoDB (2 con `uses: 0`, resto `uses: 5+`), que ejecute el generador 5 veces con el mismo clima/ocasión, y confirme que las prendas con `uses: 0` aparecen en la combinación en proporción claramente mayor a la esperada por azar. No es aceptable que el ranking por uso sea decorativo en el prompt pero no se refleje en el resultado real ni en las actualizaciones de DynamoDB.

### 3.4 Avatar / probador simplificado

**Comportamiento esperado:**
- Al confirmar un outfit, se renderiza (SVG o componente React) una silueta coloreada según `category`/`color` de cada pieza.
- No se requiere fotorrealismo.

**Criterio verificable:** snapshot test o captura de pantalla del avatar con un outfit de prueba conocido, confirmando colores esperados por categoría.

### 3.5 Persistencia real (DynamoDB)

**Comportamiento esperado:**
- Recargar la página / nueva sesión conserva el clóset completo, incluyendo `uses` acumulados — no depende de estado de navegador.

**Criterio verificable:** test que escriba en DynamoDB, simule una nueva sesión/request sin caché de cliente, y confirme lectura idéntica.

### 3.6 Medidor de uso real del clóset

**Comportamiento esperado:**
- Indicador visible: `% de prendas con uses > 0`, calculado sobre el estado real de DynamoDB.
- Se actualiza inmediatamente tras confirmar un outfit (revalidación de la ruta o refetch).

**Criterio verificable:** test que confirme que el porcentaje mostrado coincide matemáticamente con una consulta directa a DynamoDB tras una secuencia de outfits generados.

---

## 4. Diseño

- Identidad visual propia — no imitar el look de Alta.
- Mobile-first (aunque sea web, la mayoría del uso real será desde el celular), paleta cálida no genérica.
- Tono de copy: cercano, sin infantilizar (audiencia adolescente).

**Criterio verificable:** capturas de las 3 pantallas principales revisadas contra los defaults de IA a evitar antes de dar por terminado el trabajo visual.

---

## 5. Fuera de alcance explícito

- Afiliados, enlaces de compra, integración con inventario de marcas.
- Notificaciones push / recordatorios diarios (ver sección 6).
- Autenticación multi-usuario robusta — para esta fase, un único `userId` fijo o auth mínima es suficiente; no construir un sistema de cuentas completo.
- CI/CD más allá del deploy automático de Vercel.

---

## 6. Pendiente de decisión (no resolver dentro de este PRD)

El loop actual tiene motor (categorización + recomendación + métrica de progreso) pero no tiene trigger de reentrada genuino. Pendiente decidir si se instrumenta una notificación diaria no-manipuladora, o si se deja así deliberadamente para que la ausencia de reentrada espontánea sea parte del dato de validación. Se decide con datos de uso real, no en esta fase.

---

## 7. Nota de arquitectura — por qué DynamoDB y no Sheets aquí

Flujo usa Sheets como base de datos por una razón específica de ese proyecto (probablemente auditabilidad manual / edición directa por el usuario no técnico). Percha usa DynamoDB porque el patrón de acceso es distinto: escrituras frecuentes de un contador (`uses`) por outfit generado, que en Sheets requeriría lecturas/escrituras de fila completa y es más frágil bajo escritura concurrente. Esto es una decisión de arquitectura explícita, no una desviación accidental del patrón Flujo — vale la pena que quede registrada así si este PRD se revisa más adelante.
