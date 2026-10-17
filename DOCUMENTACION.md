# Xeoris Solutions Portal — Documentación

> **Versión 1.8 · 17/10/2026**
> Repositorio: `insurance-comparator` (GitHub `juanmacriado/insurance-comparator`) · Despliegue: Vercel, proyecto `insurance-comparator`.
>
> - **Parte I** describe la aplicación **tal cual está hoy en producción** (rama `main`, último commit `daa7d4e` del 24/02/2026).
> - **Parte II** recoge los **evolutivos**: especificación, implementación en la rama `feature/comisiones-evolutivos` (pendiente de revisión) y propuestas.

Aunque el repositorio se llama *insurance-comparator*, la aplicación es un **portal interno de Xeoris** con cuatro herramientas detrás de login (comparador de pólizas de ciberseguro con IA, unificador de PDFs, gestión de comisiones y agente de contenidos para redes sociales) más la administración de usuarios.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 17/10/2026 | Primera documentación completa de la aplicación. |
| 1.1 | 17/10/2026 | Reorganización: Parte I (estado actual) y Parte II (evolutivos). EV-01 a EV-06 de Gestión de comisiones. |
| 1.2 | 17/10/2026 | Pólizas de BAJA sin fecha de baja incluidas por precaución y resaltadas; misma regla para las cuatro periodicidades. |
| 1.3 | 17/10/2026 | EV-07 descarga de copia de datos en ZIP. Nuevos evolutivos propuestos: entorno de pruebas, planes de pago y copias de seguridad, aviso semanal de renovaciones. |
| 1.4 | 17/10/2026 | EV-08 informe semanal de renovaciones por correo (Vercel Cron + Resend), desarrollado. |
| 1.8 | 17/10/2026 | Entorno de base de datos local (Docker + datos ficticios), §3. Acceso a BD centralizado en `lib/sql.ts`. Pruebas funcionales de la rama en navegador contra la base local: superadas. |
| 1.7 | 17/10/2026 | Revisión del commit `b52ed0e` (refinamientos del otro IDE) frente a la especificación: conforme, con observaciones menores (§16). |
| 1.6 | 17/10/2026 | EV-01 a EV-08 implementados en la rama `feature/comisiones-evolutivos` (commit pendiente de revisión por otro IDE antes de fusionar a `main`). Se retira el parche de referencia. |
| 1.5 | 17/10/2026 | La Parte II pasa a especificación para implementar por otro IDE; código retirado del repositorio y guardado como parche de referencia en `docs/evolutivos/`. EV-08 rediseñado: tarea programada de Claude + ruta `/api/renovaciones` (sin servidor de correo en la app). |

## Índice

**Parte I — Estado actual**
1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Puesta en marcha y despliegue](#3-puesta-en-marcha-y-despliegue)
4. [Autenticación y usuarios](#4-autenticación-y-usuarios)
5. [Base de datos](#5-base-de-datos)
6. [Módulo: Comparador de pólizas](#6-módulo-comparador-de-pólizas)
7. [Módulo: Unificador de PDF](#7-módulo-unificador-de-pdf)
8. [Módulo: Gestión de comisiones](#8-módulo-gestión-de-comisiones)
9. [Módulo: Agente Social Media](#9-módulo-agente-social-media)
10. [Portal y diseño](#10-portal-y-diseño)
11. [Deuda técnica y riesgos](#11-deuda-técnica-y-riesgos)

**Parte II — Evolutivos**
12. [Resumen y forma de trabajo](#12-resumen-y-forma-de-trabajo)
13. [Reglas de negocio comunes](#13-reglas-de-negocio-comunes-gestión-de-comisiones)
14. [Especificación por evolutivo](#14-especificación-por-evolutivo)
15. [Casos de prueba](#15-casos-de-prueba-reglas-13)
16. [Puntos a confirmar y despliegue](#16-puntos-a-confirmar-y-despliegue)
17. [Evolutivos propuestos](#17-evolutivos-propuestos)

---

# Parte I — Estado actual

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16.1** (App Router, Server Actions), React 19.2, TypeScript 5 |
| Estilos | Tailwind CSS 4 (PostCSS), `framer-motion`, iconos `lucide-react` + Material Symbols (Google Fonts) |
| Autenticación | **NextAuth v5 (beta)** con proveedor *Credentials*, sesiones JWT, `bcryptjs` |
| Base de datos | **Postgres de Vercel (Neon)** vía `@vercel/postgres`, SQL directo con template literals, sin ORM |
| IA | Vercel AI SDK (`ai`, `@ai-sdk/openai`) con **GPT-4o** + SDK `openai` para **DALL·E 3** |
| PDF | `pdf-lib` (fusión), `pdfjs-dist` (previsualización), `jspdf` + `jspdf-autotable` (informes) |
| Excel | `xlsx` (SheetJS 0.18.5) para importación y exportación |
| Scraping | `cheerio` |
| Email | `resend` (recuperación de contraseña) |
| Validación | `zod` 4 |
| Despliegue | Vercel (ver §3) |

Dependencias instaladas **sin uso**: `better-sqlite3`, `pdfreader`, `nodemailer`, `vercel` (CLI como dependencia de runtime); `dotenv` solo en scripts.

## 2. Estructura del repositorio

```
├── app/
│   ├── layout.tsx                 # Layout raíz (fuentes Inter/Outfit, Material Symbols)
│   ├── page.tsx                   # Portal (landing con tarjetas de herramientas)
│   ├── globals.css
│   ├── actions.ts                 # Server actions del comparador
│   ├── actions/
│   │   ├── social-agent-orchestrator.ts  # Server actions del agente social
│   │   └── generate-social-post.ts       # (legacy, sin uso)
│   ├── api/auth/[...nextauth]/route.ts   # Handlers NextAuth
│   ├── login/ forgot-password/ reset-password/
│   ├── comparator/page.tsx        # Comparador de pólizas (cliente)
│   ├── unificador/page.tsx        # Unificador de PDF (100 % cliente)
│   ├── comisiones/
│   │   ├── page.tsx               # Wrapper servidor
│   │   ├── client-page.tsx        # Toda la UI y lógica de comisiones (~800 líneas)
│   │   └── actions.ts             # Server actions CRUD
│   ├── social-media/page.tsx      # Agente Social Media (cliente)
│   └── admin/users/page.tsx       # Gestión de usuarios (solo admin)
├── components/
│   ├── LandingPageClient.tsx      # UI del portal
│   ├── FileUpload.tsx, ComparisonTable.tsx, PDFGenerator.tsx, ExcelExport.tsx  # Comparador
│   └── Header.tsx, GlobalNavigation.tsx   # (legacy, comentados en layout)
├── lib/
│   ├── db.ts                      # Acceso a datos de comisiones
│   ├── ai-analyzer.ts             # Prompt + esquema de extracción de pólizas
│   ├── comparator.ts              # Construcción del informe comparativo
│   ├── import-excel.ts            # Importador de la carga inicial (Excel Hiscox)
│   ├── user-actions.ts, auth-actions.ts, password-actions.ts
│   ├── social-agent/              # scraper, analyzer, generator, platform-generator, image-generator, prompts-db, types
│   ├── comisiones.ts              # (legacy: mock en memoria, sin uso)
│   ├── pdf-parser.ts              # (legacy: extracción de texto, sin uso)
│   └── utils.ts                   # cn() = clsx + tailwind-merge
├── scripts/
│   ├── init-db.ts                 # Crea tablas
│   ├── seed-admin.ts              # Crea admin inicial
│   ├── run-import.ts              # Carga inicial: borra año 2025 e importa el Excel
│   └── run-import.js              # (legacy SQLite, roto)
├── auth.ts, auth.config.ts, middleware.ts
├── types/next-auth.d.ts           # Añade `role` a la sesión
├── NUEVA PRODUCCION.xlsx          # Excel de la carga inicial (datos reales)
├── comisiones.db                  # SQLite antiguo (legacy)
└── portal.html / portal.png       # Maqueta original del portal
```

## 3. Puesta en marcha y despliegue

### Requisitos
Node.js 20+, base de datos Postgres (Vercel/Neon) y clave de OpenAI.

### Variables de entorno (`.env.local` y en Vercel)

| Variable | Uso | Obligatoria |
|---|---|---|
| `POSTGRES_URL` (+ resto de `POSTGRES_*`, `PG*`, `DATABASE_URL*`) | Conexión `@vercel/postgres` | Sí |
| `AUTH_SECRET` | Firma de JWT de NextAuth | Sí |
| `OPENAI_API_KEY` | Comparador y agente social | Sí |
| `RESEND_API_KEY` | Envío del email de recuperación | No (sin ella, el enlace solo se escribe en el log) |
| `NEXT_PUBLIC_APP_URL` | URL base del enlace de recuperación | No (por defecto `http://localhost:3000`) |

### Comandos

```bash
npm install
npx tsx scripts/init-db.ts      # crea aseguradoras, registros_comisiones, users, password_resets
npx tsx scripts/seed-admin.ts   # crea admin@admin.com / admin → cambiar de inmediato
npm run dev
```

Los scripts de mantenimiento se lanzan con `npx tsx` (o con los `npm run` de abajo).

### Desarrollo local con base de datos propia (recomendado)
Para probar sin tocar la base de datos real. Requiere **Docker Desktop** en el Mac.

```bash
npm install                 # una vez (o tras cambiar de rama)
npm run db:local:up         # arranca Postgres + proxy de Neon (docker-compose.yml)
npm run db:local:seed       # crea las tablas y carga datos FICTICIOS (borra los anteriores)
npm run dev                 # http://localhost:3000
```

- **Configuración**: el fichero `.env.development.local` (no se sube a git) apunta a `postgres://postgres:postgres@localhost:5432/xeoris`. En `npm run dev` tiene prioridad sobre `.env.local`, que apunta a producción. Para volver a desarrollar contra la base real, renombrarlo.
- **Usuarios de prueba**: `admin@local.test` / `admin-local` (admin) y `usuario@local.test` / `usuario-local` (user).
- **Datos de prueba**: 12 pólizas ficticias en 2 aseguradoras, con fechas relativas al día de la carga: renovaciones próximas, nueva producción, bajas con y sin fecha, trimestral, semestral, un valor antiguo en minúsculas y un tipo de pago fuera de catálogo.
- **Cómo funciona**: la app usa `@vercel/postgres` (driver serverless de Neon), que va por HTTP (`sql\`...\``) y por WebSocket (`sql.query()`), no por el protocolo normal de Postgres. `docker-compose.yml` añade el proxy local que documenta Neon (puerto 4444). `lib/local-postgres.ts` redirige el driver a ese proxy **solo si `POSTGRES_URL` es localhost**; en Vercel no hace nada. Todo el código importa `sql` desde **`lib/sql.ts`** (no directamente de `@vercel/postgres`), para que esa configuración se aplique siempre a la misma copia del driver.
- **Seguridad**: `seed-local` se niega a ejecutarse si `POSTGRES_URL` no es localhost. Si se arranca `npm run dev` contra una base no local, la consola avisa de que los cambios afectarán a la base real.
- **Otros**: `npm run test:rules` (pruebas de reglas), `npm run db:local:down` (parar; los datos se conservan en un volumen de Docker).

### Despliegue
- El proyecto está enlazado a Vercel (`.vercel/project.json`). **No hay ningún YAML, workflow de CI, `vercel.json` ni Dockerfile** en el repositorio ni en su historial: el despliegue lo hace la integración Vercel–GitHub (push a `main`) o `vercel deploy`.
- `next.config.ts` sube `serverActions.bodySizeLimit` a 60 MB, pero en Vercel cada petición está limitada a ~4,5 MB; por eso el comparador sube **un PDF por llamada**.

## 4. Autenticación y usuarios

- **Proveedor**: Credentials (email + contraseña), validado con zod y `bcrypt.compare` contra la tabla `users`.
- **Sesión**: JWT. Los callbacks `jwt`/`session` copian `role` (`user` | `admin`) a `session.user.role`.
- **Protección de rutas**: `middleware.ts` aplica `authConfig.authorized` a todo salvo `/api`, estáticos de Next y `.png`. Sin sesión → `/login`. `/login`, `/forgot-password` y `/reset-password` son públicas (redirigen a `/` si ya hay sesión).
- **Roles**: solo se comprueba `admin` en `/admin/users` y `lib/user-actions.ts`. El resto de módulos están abiertos a cualquier usuario autenticado.
- **Recuperación de contraseña**: token aleatorio (32 bytes), caducidad 1 h en `password_resets`, email por Resend desde `security@xeoris.com`. No revela si el email existe. **Hoy no se envía ningún correo**: `RESEND_API_KEY` no está configurada, así que el enlace solo se escribe en el log del servidor.
- **Gestión de usuarios** (`/admin/users`): alta (nombre, email, contraseña, rol), listado y borrado (no se puede borrar a uno mismo).

## 5. Base de datos

Postgres. No hay migraciones versionadas: el esquema lo crea `scripts/init-db.ts`; `social_agent_prompts` se crea al vuelo.

```sql
aseguradoras (
  id SERIAL PK,
  nombre TEXT UNIQUE NOT NULL
)

registros_comisiones (
  id SERIAL PK,
  aseguradora_id INT NOT NULL → aseguradoras(id),
  año INT NOT NULL,
  tipo_registro TEXT NOT NULL,          -- hoy siempre 'Producción'
  cliente TEXT,
  situacion TEXT,                        -- texto libre ('ALTA', 'BAJA')
  tipo_pago TEXT,                        -- texto libre ('ANUAL', 'MENSUAL')
  numero_poliza TEXT,
  fecha_efecto TEXT,                     -- ISO 'YYYY-MM-DD' guardado como texto
  pago_hiscox DOUBLE PRECISION,          -- "Pago asegurador" (nombre heredado de Hiscox)
  producto TEXT,
  prima_neta DOUBLE PRECISION,
  prima_total DOUBLE PRECISION,
  porcentaje_comision DOUBLE PRECISION,  -- en % (18 = 18 %)
  neto_comision DOUBLE PRECISION,
  comprobacion_prima DOUBLE PRECISION,   -- calculado
  importe_liquidar DOUBLE PRECISION,
  comprobacion_datos DOUBLE PRECISION    -- calculado
)

users (id SERIAL PK, name, email UNIQUE, password (bcrypt), role DEFAULT 'user', created_at)
password_resets (email, token, expires_at)
social_agent_prompts (id SERIAL PK, name, content, created_at)
```

## 6. Módulo: Comparador de pólizas

**Ruta**: `/comparator` · **Archivos**: `app/comparator/page.tsx`, `app/actions.ts`, `lib/ai-analyzer.ts`, `lib/comparator.ts`, `components/{FileUpload,ComparisonTable,PDFGenerator,ExcelExport}.tsx`

### Flujo (asistente de 3 pasos)
1. **Cliente**: nombre de la empresa (obligatorio) y nº de pólizas a comparar.
2. **Pólizas**: subida de PDFs; para cada uno se llama a `analyzePDFAction` (uno a uno, por el límite de 4,5 MB).
3. **Resultado**: `getComparisonReportAction` construye la tabla; se puede exportar a **PDF** (jsPDF, apaisado si hay más de 2 pólizas) y **Excel**.

### Análisis con IA
- El **PDF completo se envía directamente a GPT-4o** (`generateObject` con contenido tipo `file`), sin extraer el texto antes.
- Salida estructurada (zod): `netPremium`, `totalPremium` y **exactamente 13 coberturas**, cada una con `isPresent`, `details`, `amount` (límite), `deductible` (franquicia) y `scope`.
- Las 13 categorías: Respuesta a incidentes · Gastos de mitigación · Pérdida de beneficios · Extorsión cibernética · Recuperación de datos y sistemas · Protección de equipos · RC tecnológica · Fraude tecnológico · Ecrime/suplantación · Sanciones/multas · Reputación · Notificación a afectados · Defensa jurídica.
- El prompt fija reglas de negocio: límites generales, valores de la *misma línea* de la tabla, intervalos literales, equivalencias entre aseguradoras y **herencia de sublímites** (las subcoberturas "Incluido" o en porcentaje heredan el sublímite de su sección).

### Informe
`compareAIAnalyses` genera una fila por categoría más *Prima Neta* y *Prima Total*. El campo `isWinner` existe en el tipo y en la UI pero **nunca se calcula**.

## 7. Módulo: Unificador de PDF

**Ruta**: `/unificador` · **Archivo**: `app/unificador/page.tsx`

Funciona 100 % en el navegador (los documentos no salen del equipo): añadir varios PDFs, previsualizarlos (`pdfjs-dist`), reordenarlos arrastrando (`@dnd-kit`), poner título y descargar el PDF unido (`pdf-lib`).

## 8. Módulo: Gestión de comisiones

**Ruta**: `/comisiones` · **Archivos**: `app/comisiones/{page,client-page,actions}.tsx`, `lib/db.ts`

### Propósito
Controlar la producción de pólizas intermediadas por aseguradora, comprobar que las comisiones cuadran y generar la **liquidación** de un periodo.

### Navegación (una sola página con estados)
1. **LIST** — Gestión de Aseguradoras: listado y alta de aseguradora.
2. **DASHBOARD** — Panel de la aseguradora con tarjetas por categoría; solo existe **"Producción"**.
3. **DETAILS** — Tabla de registros de la categoría (todos los años):
   - Filtros de texto por columna (cliente, situación, tipo de pago, póliza, fecha efecto, pago asegurador, producto).
   - Fila desplegable para **editar**, **borrar** (con confirmación) y **nuevo registro**.
   - **Exportar a Excel** lo filtrado.
   - **Liquidación** (ventana con fecha de inicio y fecha de fin).
4. **SETTLEMENT** — Tabla de liquidación del periodo con totales y exportación a Excel.

### Campos del registro
Cliente, Situación, Tipo de pago, Nº póliza, Fecha efecto, Pago asegurador, Producto, Prima neta, Prima total, % comisión, Neto comisión, Importe a liquidar y dos comprobaciones calculadas. **Situación y tipo de pago son texto libre** (se escribe "ALTA", "anual"…), sin validación. No existe fecha de baja.

### Fórmulas de control (se recalculan en servidor al crear/editar)
```
comprobacion_prima = prima_neta × (porcentaje_comision / 100) − neto_comision
comprobacion_datos = (prima_total − prima_neta × porcentaje_comision / 100) − importe_liquidar
```
Un valor distinto de 0 indica descuadre entre lo calculado y lo informado por la aseguradora.

### Lógica de liquidación (en el navegador)
Para el rango `[inicio, fin]` se toman solo los registros con `situacion = 'ALTA'` **en el momento de sacar el informe**:
- **ANUAL**: entra si el día/mes de la fecha de efecto cae dentro del rango (ignora el año, así cubre renovaciones).
- **MENSUAL**: una línea por cada mes del rango a partir del mes de efecto.
- Cualquier otro tipo de pago (trimestral, semestral, o texto mal escrito) **no se liquida**.
- Una póliza hoy de BAJA **desaparece por completo** de la liquidación, aunque estuviera de alta durante el periodo.

### Carga inicial de datos
`NUEVA PRODUCCION.xlsx` se usó **solo para la carga inicial** (`lib/import-excel.ts` + `scripts/run-import.ts`: aseguradora *Hiscox*, `año = 2025`, `tipo_registro = 'Producción'`). Desde entonces los datos se mantienen en la base de datos de la aplicación. **No volver a ejecutar `run-import.ts`**: borra todos los registros de 2025 antes de importar.

### Limitaciones
- Campos sin control (texto libre) → errores de escritura que excluyen pólizas de la liquidación.
- Sin fecha de baja ni pagos trimestrales/semestrales.
- Sin listado de renovaciones.
- Modelado sobre Hiscox (`pago_hiscox`, "Importe a liquidar Hiscox"); una sola categoría; año de registro nuevo fijo en 2025.
- Sin estado ni histórico de liquidaciones, sin auditoría de cambios.
- Server actions sin control por rol; tipado débil (`any`); fechas como `TEXT` e importes `DOUBLE PRECISION`.
- UI y lógica en un único componente de ~800 líneas.

## 9. Módulo: Agente Social Media

**Ruta**: `/social-media` · **Archivos**: `app/social-media/page.tsx`, `app/actions/social-agent-orchestrator.ts`, `lib/social-agent/*`

1. **Analizar URL**: `scrapeUrl` (fetch + cheerio: título, fuente, fecha, párrafos) → `analyzeNewsContent` (GPT-4o: tema, hechos clave, entidades, tono y resumen en español) → `generateVariations` (3 enfoques: educativo, urgente, corporativo).
2. **Generar contenido** según el enfoque, la **audiencia** (`technology_partners`, `insurance_brokers`, `data_protection`, `general`) e instrucciones propias, para **Blog** (1.300–1.800 palabras, SEO), **LinkedIn** (600–900 caracteres), **Twitter/X** (hilo) e **Instagram** (texto + idea visual). Se puede generar una plataforma o todas; temperatura 0,8 con penalizaciones contra la repetición.
3. **Imagen** bajo demanda con **DALL·E 3** (1024×1024) y marca "Xeoris" forzada en el prompt.

**Prompts guardados**: tabla `social_agent_prompts`. Los 5 últimos se inyectan como "historial" para no repetir (aunque son prompts, no contenidos generados).

## 10. Portal y diseño

- `/` muestra el portal **"Xeoris te hace la vida más fácil"** con tarjetas a cada herramienta (Usuarios solo para admin), modo oscuro y cierre de sesión.
- Colores corporativos: petróleo `#16313a` (primary) y amarillo `#ffe008` (secondary); tipografías Inter y Outfit (`tailwind.config.ts` / `globals.css`).
- Cada módulo tiene su propia cabecera con "Volver al Portal"; `GlobalNavigation` y `Header` no se usan.

## 11. Deuda técnica y riesgos

### Seguridad (prioritario)
1. **Datos reales en git**: `NUEVA PRODUCCION.xlsx` (clientes, pólizas, primas) y `comisiones.db` están versionados. Si el repositorio es o ha sido público, hay exposición de datos personales (RGPD). Hay que retirarlos también del historial.
2. **Admin por defecto `admin@admin.com / admin`** en `seed-admin.ts`; contraseña mínima de 3 caracteres.
3. **Server actions sin autorización por rol** en comisiones y agente social (solo exigen sesión).
4. `deleteRegistrosByYear` borra un año entero sin filtrar por aseguradora.
5. El scraper hace `fetch` a cualquier URL introducida (conviene limitar a http/https públicos).

### Mantenimiento
- Código legacy a eliminar: `lib/comisiones.ts`, `lib/pdf-parser.ts`, `app/actions/generate-social-post.ts`, `scripts/run-import.js`, `components/Header.tsx`, `components/GlobalNavigation.tsx`, `comisiones.db`, `portal.html/png`, dependencias sin uso.
- README desactualizado (habla de Next 15 y solo del comparador).
- `@vercel/postgres` está obsoleto en favor de `@neondatabase/serverless`; Next 16 sustituye `middleware.ts` por `proxy.ts`.
- `xlsx` 0.18.5 de npm tiene vulnerabilidades conocidas y no recibe parches.
- Las URLs de DALL·E caducan; las imágenes no se guardan.
- Sin tests, sin migraciones versionadas, sin CI. NextAuth v5 sigue en beta.

---

# Parte II — Evolutivos

## 12. Resumen y forma de trabajo

Cada evolutivo se documenta como **especificación** (§13–§15) y su implementación se entrega en una **rama aparte para revisión**, sin tocar `main` (producción).

- **Rama**: `feature/comisiones-evolutivos`, creada desde `daa7d4e`. Contiene EV-01 a EV-08 (9 ficheros de código, ~1.150 líneas) y esta documentación. Compila (`tsc --noEmit`) y pasa las pruebas de reglas (`npx tsx scripts/test-comisiones-rules.ts`). **Aún no se ha probado contra la base de datos real.**
- **Revisión**: otro IDE o desarrollador revisa la rama contra esta especificación y corrige lo que haga falta antes de integrar.
- **Flujo**: push de la rama → pull request → URL de prueba de Vercel (idealmente con el entorno de pruebas, EV-22) → pruebas manuales de §15 → fusión a `main` → producción.

| ID | Evolutivo | Módulo | Estado |
|---|---|---|---|
| EV-01 | Campos controlados: desplegables de tipo de pago y situación + validación | Comisiones | Implementado en rama · pendiente de revisión |
| EV-02 | Pagos trimestrales y semestrales | Comisiones | Implementado en rama · pendiente de revisión |
| EV-03 | Fecha de baja asociada a la situación BAJA | Comisiones | Implementado en rama · pendiente de revisión |
| EV-04 | Liquidación por eventos de cobro y meses de alta | Comisiones | Implementado en rama · pendiente de revisión |
| EV-05 | Listado global de próximas renovaciones | Comisiones | Implementado en rama · pendiente de revisión |
| EV-06 | Ocultar el campo "Pago Asegurador" | Comisiones | Implementado en rama · pendiente de revisión |
| EV-07 | Descarga de copia de datos (ZIP con un CSV por tabla) | Administración | Implementado en rama · pendiente de revisión |
| EV-08 | Informe semanal de renovaciones por correo (tarea programada de Claude) | Comisiones | Implementado en rama (parte app) · pendiente de revisión |
| EV-09 a EV-23 | Ver §17 | Varios | Propuestos |

## 13. Reglas de negocio comunes (Gestión de comisiones)

Implementadas en **un único módulo puro** (sin acceso a BD), `lib/comisiones-rules.ts`, que usen tanto el navegador (validación del formulario) como el servidor (validación, liquidación, renovaciones, informe). Fechas siempre como texto ISO `YYYY-MM-DD` y meses como `YYYY-MM`, para evitar desfases de zona horaria.

### 13.1 Catálogos
| Campo | Valores | Meses entre cobros |
|---|---|---|
| `tipo_pago` | `ANUAL`, `SEMESTRAL`, `TRIMESTRAL`, `MENSUAL` | 12, 6, 3, 1 |
| `situacion` | `ALTA`, `BAJA` | — |

Los valores se normalizan (`trim` + mayúsculas) al leer y al guardar.

### 13.2 Validación de un registro
- Obligatorios: `cliente`, `numero_poliza`, `fecha_efecto` (fecha válida), `tipo_pago` y `situacion` (dentro del catálogo).
- Si `situacion = BAJA`: `fecha_baja` obligatoria y **no anterior** a `fecha_efecto`.
- Si `situacion = ALTA`: `fecha_baja` se guarda vacía (`NULL`).
- La misma validación en cliente y servidor; el servidor devuelve los errores por campo (`{ ok: false, errors: { campo: mensaje } }`).

### 13.3 Liquidación de un periodo
Entrada: aseguradora, **mes de inicio** y **mes de fin** (meses naturales, ambos incluidos). Para cada registro y cada mes `M` del periodo se genera **una línea** si:
1. **Hay cobro en `M`**: `M ≥ mes de efecto` y `(M − mes de efecto) mod intervalo = 0` (intervalo según §13.1). Las anuales liquidan cada año en el mes aniversario.
2. **Estuvo de alta al menos parte de `M`**:
   - sin fecha de baja → sí;
   - con fecha de baja → sí si `fecha_baja > día 1 de M` (una baja el día 1 excluye ese mes).

Además:
- La **situación actual no excluye**: una póliza hoy de BAJA aparece en los meses del periodo anteriores a su baja.
- **BAJA sin fecha de baja** → se incluye **por precaución**, tratándola como activa, con la marca `falta_fecha_baja = true`.
- Registros con `tipo_pago`/`situacion` fuera de catálogo o sin `fecha_efecto` → **no** se incluyen y se devuelven como **avisos** (`{ id, cliente, numero_poliza, motivo }`).
- Cada línea lleva los importes del registro tal cual (sin prorrateo) y el mes (`YYYY-MM`, etiqueta `Ene 2026`). Orden: mes y cliente.

### 13.4 Renovaciones
Entrada: fecha desde y fecha hasta (incluidas). Una póliza aparece si:
- está de **ALTA** (sin fecha de baja), **o** está de **BAJA sin fecha de baja** (incluida por precaución, `falta_fecha_baja = true`);
- y su **aniversario** `fecha_efecto + N años` (N ≥ 1) cae en el intervalo. El 29/02 renueva el 28/02 en años no bisiestos.
- **No influye el tipo de pago**. Las de nueva producción (sin cumplir un año) no aparecen.
- Cada resultado añade `fecha_renovacion`, `anualidad` (N) y el nombre de la aseguradora. Orden: fecha de renovación y aseguradora.

## 14. Especificación por evolutivo

### EV-01 · Campos controlados
**Problema**: tipo de pago y situación se escriben a mano; un error deja la póliza fuera de la liquidación sin avisar.
**Cambios**
- Formulario de alta/edición (`app/comisiones/client-page.tsx`): `tipo_pago` y `situacion` pasan a `<select>` con los catálogos de §13.1. Si un registro antiguo tiene un valor fuera de catálogo, mostrarlo como opción deshabilitada "(no válido)" para que el usuario lo corrija.
- Filtros de la tabla de registros: situación y tipo de pago como desplegables (con "Todas/Todos").
- Errores mostrados bajo cada campo.
- Server actions `createRegistro`/`editRegistro` (`app/comisiones/actions.ts`): validar con §13.2 y devolver errores; guardar los valores normalizados.
- El `año` de un registro nuevo se toma de su `fecha_efecto` (hoy está fijo en 2025).

**Aceptación**: no es posible guardar (ni desde la UI ni llamando a la action) un tipo de pago o situación fuera de catálogo.

### EV-02 · Pagos trimestrales y semestrales
Añadir `SEMESTRAL` y `TRIMESTRAL` al catálogo y a la liquidación con la misma regla que anual y mensual (§13.3).
**Aceptación**: casos P07–P10 de §15.

### EV-03 · Fecha de baja
**Cambios**
- BD: `ALTER TABLE registros_comisiones ADD COLUMN IF NOT EXISTS fecha_baja TEXT` (texto ISO, como `fecha_efecto`). Puede ejecutarse como migración o de forma idempotente desde `lib/db.ts` antes de la primera consulta. No modifica datos existentes.
- `lib/db.ts`: incluir `fecha_baja` en `INSERT` y `UPDATE`.
- Formulario: campo *Fecha de baja* visible solo con situación BAJA, obligatorio, `min = fecha_efecto`; al cambiar a ALTA se vacía.
- Tablas (registros y liquidación) y exportaciones Excel: nueva columna *Fecha Baja*. Si BAJA sin fecha → mostrar **FALTA** en ámbar.

### EV-04 · Nueva liquidación
**Cambios**
- Mover el cálculo al **servidor**: nueva server action `fetchLiquidacion(aseguradoraId, mesInicio, mesFin)` que aplica §13.3 y devuelve `{ lineas, avisos }`. Eliminar `isDayMonthInRange` y `getMonthsInRange` del cliente.
- Modal de liquidación: inputs `type="month"` (mes de inicio y fin), validación inicio ≤ fin y texto explicativo de la regla.
- Vista de liquidación:
  - columnas: Mes Liq., Cliente, Situación, Fecha Baja, Pago, Póliza, Fecha Efecto, Producto, Prima Neta, Prima Total, % Comis., Neto Comis., Comp. Prima, Liquidación, Comp. Datos, **Observaciones**;
  - filas con `falta_fecha_baja` **resaltadas en ámbar** y observación *"Falta fecha de baja (incluida por precaución)"*;
  - aviso superior con nº de pólizas sin fecha de baja; bloque de **avisos** de registros no liquidables;
  - pie con totales y una fila extra *"De ellas, sin fecha de baja"* con su importe a liquidar;
  - exportación a Excel con la columna Observaciones.

### EV-05 · Próximas renovaciones
**Cambios**
- Botón **Próximas Renovaciones** en *Gestión de Aseguradoras* (vista LIST), fuera de cualquier aseguradora → nueva vista `RENEWALS`.
- Selector **Desde / Hasta** (por defecto hoy → hoy + 2 meses) y botón Buscar.
- Server action `fetchRenovaciones(desde, hasta)` con §13.4 sobre todas las aseguradoras (consulta con `JOIN aseguradoras` para el nombre).
- Tabla: Renueva, Anualidad, **Aseguradora**, Cliente, Situación, Pago, Póliza, Fecha Efecto, Producto, Prima Neta, Prima Total, % Comis., Neto Comis., Comp. Prima, Liquidación, Comp. Datos, Observaciones. Filas `falta_fecha_baja` en ámbar. Contador de pólizas.
- Exportación a Excel.

### EV-06 · Ocultar "Pago Asegurador"
Quitar la columna/campo `pago_hiscox` de las tablas (registros, liquidación, renovaciones), del formulario, del filtro y de las exportaciones. **No** borrar la columna de BD ni sus datos. Ajustar `colSpan`.

### EV-07 · Descarga de copia de datos
**Cambios**
- Ruta `GET /admin/export` (`app/admin/export/route.ts`): solo `role = admin` (403 en otro caso).
- Descubre las tablas con `information_schema.columns` (`table_schema = 'public'`) y genera **un CSV por tabla** dentro de **un único ZIP** `xeoris_datos_AAAA-MM-DD_HH-MM.zip`, más `LEEME.txt` (fecha, usuario, filas por tabla).
- Excluir la tabla `password_resets` y la columna `users.password`.
- CSV para Excel en español: UTF-8 con BOM, separador `;`, coma decimal, fechas ISO, comillas cuando haga falta.
- Registrar en el log quién descarga.
- En `/admin/users`, bloque *Copia de datos* con el botón **Descargar CSV**.
- La rama genera el ZIP sin dependencias (`lib/csv-zip.ts`); también es válido usar una librería como `jszip`.

### EV-08 · Informe semanal de renovaciones por correo
**Decisión**: lo envía una **tarea programada de Claude** desde Microsoft 365 (`info@xeoris.com`). La app no tiene servidor de correo configurado (no hay `RESEND_API_KEY`) y así los cambios de destinatarios o formato se hacen editando la tarea, sin tocar código.

**Parte app (a implementar)**
- Ruta `GET /api/renovaciones?meses=3&formato=texto` (`app/api/renovaciones/route.ts`), **solo lectura**:
  - Autorización: `Authorization: Bearer <RENEWALS_API_TOKEN>` **o** `?token=<RENEWALS_API_TOKEN>` (la herramienta de lectura web de Claude no envía cabeceras) **o** sesión de administrador. Comparación en tiempo constante. 401 en otro caso. Como `/api` está fuera del middleware de login, la comprobación va en la propia ruta.
  - Periodo: desde hoy (hora de España) hasta hoy + `meses` (1–12, por defecto 3), con §13.4.
  - Respuesta JSON por defecto (`desde`, `hasta`, `total`, `sin_fecha_baja`, `prima_total`, `renovaciones[]`).
  - Con `formato=texto`: texto plano con líneas de control para que el agente verifique que ha leído todo:
    ```
    INFORME DE RENOVACIONES | desde dd/mm/aaaa | hasta dd/mm/aaaa | meses 3
    CONTROL | filas N | sin_fecha_baja M | prima_total X €
    COLUMNAS | n | renueva | anualidad | aseguradora | cliente | poliza | producto | tipo_pago | prima_total | aviso
    FILA 1 | dd/mm/aaaa | 2ª | Hiscox | Cliente | Póliza | Producto | ANUAL | 1.234,56 € | -
    ...
    FIN | filas N
    ```
- Variable de entorno en Vercel (Production): `RENEWALS_API_TOKEN` = cadena aleatoria de 32+ caracteres (p. ej. `openssl rand -base64 32`). **No guardarla en el repositorio.**
- En `/admin/users`, bloque informativo con enlace **Ver datos del informe** (`/api/renovaciones?meses=3`).

**Parte Claude (se configura cuando la ruta esté en producción)**
- Tarea programada: **lunes a las 07:58 (hora de Madrid)**.
- Destinatarios: helena.sansalvador@xeoris.com, omar.abarkan@xeoris.com, ricardo.sanchez@xeoris.com, juanma.criado@xeoris.com.
- Instrucciones de la tarea (la clave se sustituye al crearla; no se escribe en este documento):
  > Cada ejecución: 1) Lee `https://insurance-comparator-eight.vercel.app/api/renovaciones?meses=3&formato=texto&token=<TOKEN>` con la herramienta de lectura web y pide el contenido **literal**. 2) Comprueba que el nº de líneas `FILA` coincide con `CONTROL | filas N` y con `FIN | filas N`; si no, reintenta una vez. 3) Envía desde Outlook a los cuatro destinatarios un correo HTML con asunto *"Renovaciones próximos 3 meses (dd/mm – dd/mm): N pólizas"*, un resumen (total, prima total, nº sin fecha de baja), una tabla ordenada por fecha con todas las filas y las de "FALTA FECHA DE BAJA" marcadas con ⚠ en negrita, y una nota pidiendo completar esas fechas. Si no hay filas, envía el correo indicándolo. 4) Si la lectura falla (error, 401, controles que no cuadran tras reintentar), **no** envíes el informe: envía solo a juanma.criado@xeoris.com un aviso con el error.
- Limitaciones conocidas: el correo no admite adjuntos (va todo en el cuerpo); la clave viaja en la URL (queda en los logs de Vercel; da acceso solo de lectura a este listado). Mejora futura: que el propietario de la organización de Claude permita el dominio de la app en la lista de red (Admin → Capabilities) para usar la cabecera `Authorization` y leer el JSON exacto.

## 15. Casos de prueba (reglas §13)

La rama incluye `scripts/test-comisiones-rules.ts` (`npx tsx scripts/test-comisiones-rules.ts`) con estos casos.

**Liquidación** (periodo enero–marzo 2026 salvo indicación)
| # | Póliza | Fecha de baja | Resultado esperado |
|---|---|---|---|
| P01 | Mensual, efecto 10/06/2025, BAJA | 03/05/2026 (después del periodo) | Ene, Feb, Mar |
| P02 | Mensual, efecto 25/06/2025, BAJA | 20/02/2026 | Ene, Feb |
| P03 | Mensual, efecto 25/06/2025, BAJA | 01/03/2026 | Ene, Feb |
| P04 | Mensual, efecto 14/02/2026, ALTA | — | Feb, Mar |
| P05 | Anual, efecto 01/12/2022, ALTA (periodo oct 2025–mar 2026) | — | Dic 2025 |
| P06 | Anual, efecto 01/12/2022, BAJA (periodo oct 2025–mar 2026) | 15/11/2025 | ninguna |
| P07 | Trimestral, efecto 05/11/2025, ALTA (periodo ene–jun) | — | Feb, May |
| P08 | Semestral, efecto 05/03/2025, ALTA (periodo ene–dic) | — | Mar, Sep |
| P09 | Trimestral, efecto 10/10/2025, BAJA (periodo ene–jun) | 15/03/2026 / 02/04/2026 | Ene / Ene, Abr |
| P10 | Semestral, efecto 05/03/2025, BAJA (periodo ene–dic) | 01/09/2026 / falta | Mar / Mar, Sep (marcadas) |
| P11 | Mensual, efecto 01/01/2025, BAJA | **falta** | Ene, Feb, Mar con `falta_fecha_baja` |
| P12 | Anual, efecto 01/02/2022, BAJA | **falta** | Feb (marcada) |
| P13 | Tipo de pago `BIMESTRAL` | — | sin líneas, 1 aviso |

**Renovaciones** (intervalo 17/10/2026 – 31/12/2026 salvo indicación)
| # | Póliza | Resultado esperado |
|---|---|---|
| R01 | ALTA, efecto 20/11/2022 | 20/11/2026, 4ª anualidad |
| R02 | ALTA, efecto 01/11/2026 (nueva producción) | no aparece |
| R03 | BAJA con fecha, efecto 01/12/2023 | no aparece |
| R04 | ALTA, efecto 31/12/2025 | 31/12/2026, 1ª |
| R05 | ALTA, efecto 29/02/2024 (intervalo feb–mar 2027) | 28/02/2027 |
| R06 | ALTA, efecto 10/01/2023 (intervalo dic 2026–ene 2027) | 10/01/2027 |
| R07 | BAJA **sin** fecha, efecto 15/11/2024 | 15/11/2026, marcada |
| R08 | ALTA trimestral / semestral | aparecen igual que una anual |

**Validación**: BAJA sin fecha de baja → error; ALTA con fecha de baja → se guarda sin ella; tipo de pago fuera de catálogo → error.

**Pruebas manuales en la URL de prueba**: alta y edición con desplegables; paso a BAJA con fecha; liquidación de un trimestre con una póliza mensual dada de baja a mitad; renovaciones de los próximos 2 meses; descarga del ZIP (abrir los CSV en Excel); `/api/renovaciones` sin clave → 401, con clave → listado.

## 16. Puntos a confirmar y despliegue

### Revisión de código (17/10/2026)
Revisada la rama `feature/comisiones-evolutivos` hasta el commit `b52ed0e` (refinamientos: "FALTA" en la columna Fecha Baja del Excel, año inferido de la fecha de efecto, `fecha_baja` en `init-db.ts`, `Content-Type` del ZIP y batería de pruebas ampliada).

- **Resultado**: **conforme** con §13–§14. EV-01 a EV-08 presentes; compila (`tsc --noEmit`); las 28 pruebas pasan (P01–P13, R01–R08, V01–V07).
- **Prueba funcional (17/10/2026)**, con Next.js en modo desarrollo, navegador real y base local con los datos ficticios:
  - inicio de sesión ✓; lista de aseguradoras con el botón *Próximas Renovaciones* ✓;
  - renovaciones a 2 meses: 6 pólizas, la de BAJA sin fecha en ámbar ✓;
  - registros: desplegables, FALTA en las 2 bajas sin fecha ✓; validación (cliente obligatorio, tipo de pago obligatorio, fecha de baja obligatoria con BAJA) ✓; alta de un registro BAJA trimestral ✓;
  - liquidación ene–mar 2026: 2 líneas correctas (trimestral en marzo; la baja del 20/02 solo en febrero) y aviso del tipo de pago `BIMESTRAL` ✓;
  - descarga del ZIP: 4 CSV + LEEME, sin contraseñas ✓; `/api/renovaciones` → 401 sin clave, informe con clave ✓.
- **Observaciones menores** (no bloquean):
  1. `lib/db.ts → updateRegistro` reescribe `año` con el valor que ya tenía el registro, así que **no cambia aunque se cambie el año de la fecha de efecto**. Decidir si en la edición el año debe seguir a la fecha de efecto (entonces calcularlo siempre de `fecha_efecto`) o mantenerse (entonces quitar esa línea).
  2. `lib/db.ts` usa `2025` como valor por defecto del año si faltara la fecha de efecto. Es inalcanzable (la fecha es obligatoria), pero conviene quitarlo para no esconder errores.
  3. El nombre del ZIP de EV-07 lleva la hora en **UTC**, no en hora de España.
  4. En `/api/renovaciones?formato=texto` el tipo de pago sale tal cual está guardado (p. ej. `anual` en minúsculas en registros antiguos); en pantalla se ve en mayúsculas. Conviene normalizarlo en la salida.
  5. El subtítulo de *Próximas renovaciones* dice "Pólizas de alta…", pero también incluye, en ámbar, las de BAJA sin fecha.
  6. Ya existente, no de estos cambios: tras iniciar sesión la URL se queda en `/login` aunque la sesión se crea bien.
  7. **Pendiente**: prueba en la URL de prueba de Vercel antes de fusionar a `main`.

### Decisiones de negocio a validar
1. **Baja el día 1**: excluye ese mes.
2. **Importes por línea**: tal cual el registro, sin prorrateo.
3. **Año del registro nuevo**: el de la fecha de efecto.

### Configuración
| Dónde | Qué |
|---|---|
| Vercel → Environment Variables (Production) | `RENEWALS_API_TOKEN` (EV-08) |
| Datos | Completar la **fecha de baja de las bajas existentes** (hoy ninguna la tiene); hasta entonces saldrán en ámbar en liquidaciones y renovaciones |
| Claude | Crear la tarea programada de EV-08 cuando la ruta esté en producción |

### Sobre Vercel y el correo
- Mantener app en Vercel + BD en Neon + GitHub como origen de despliegues es adecuado. Hobby es solo para uso no comercial → pasar a **Pro**.
- **No hay servidor de correo configurado** (`RESEND_API_KEY` ausente): la recuperación de contraseña no envía correos. Si en el futuro se quiere que la app envíe correos, configurar Resend (verificar `xeoris.com` por DNS y añadir la clave).

## 17. Evolutivos propuestos

### Gestión de comisiones
| ID | Evolutivo | Detalle |
|---|---|---|
| EV-09 | Base sólida de datos | Migraciones versionadas; `NUMERIC(12,2)` para importes y `DATE` para fechas; renombrar `pago_hiscox` → `pago_aseguradora`. |
| EV-10 | Permisos | Autorización por rol en las server actions de comisiones. |
| EV-11 | Refactor de la pantalla | Separar `client-page.tsx` en componentes (aseguradoras, registros, formulario, liquidación, renovaciones) y tipar `Registro`. |
| EV-12 | Multiaseguradora | Configuración por aseguradora: % de comisión por producto, periodicidad de liquidación, mapeo de columnas de su Excel. |
| EV-13 | Importador desde la pantalla | Subir Excel → previsualizar → validar → insertar/actualizar por nº de póliza, sin borrar el año. |
| EV-14 | Categorías reales | Nueva producción, Cartera/Renovaciones, Bajas/Anulaciones, Extornos; selector de año. |
| EV-15 | Liquidaciones guardadas | Tablas `liquidaciones` y `liquidacion_lineas` con estado *borrador → emitida → cobrada*; prorrateo opcional por periodicidad. |
| EV-16 | Conciliación | Marcar descuadres (`comprobacion_* ≠ 0`) y comparar lo cobrado con lo esperado. |
| EV-17 | Panel y auditoría | Dashboard por aseguradora/año (producción, comisión esperada vs. cobrada, descuadres, vencimientos) y registro de cambios (quién, cuándo, qué). |

### Transversales
| ID | Evolutivo | Detalle |
|---|---|---|
| EV-18 | Seguridad de datos | Sacar `NUEVA PRODUCCION.xlsx` y `comisiones.db` del repositorio y su historial; eliminar admin por defecto; contraseñas mínimas robustas. |
| EV-19 | Limpieza | Borrar código y dependencias legacy; actualizar README. |
| EV-20 | Plataforma | Migrar `@vercel/postgres` → `@neondatabase/serverless`; `middleware.ts` → `proxy.ts`; sustituir `xlsx` de npm. |
| EV-21 | Calidad | Tests, CI (lint + tipos + pruebas en cada PR) y previews de Vercel como entorno de validación. |
| EV-22 | Entorno de pruebas | Rama de base de datos en Neon (`pruebas`) para el entorno *Preview* de Vercel, con `AUTH_SECRET` propio y sin envío de correos. Flujo: rama → pull request → URL de prueba → fusión a `main`. Montarlo antes de validar EV-01 a EV-07. |
| EV-23 | Planes y copias de seguridad | Vercel **Pro** (Hobby es solo para uso no comercial; 20 $/usuario desarrollador/mes + IVA). Neon **Launch** (pago por uso; restauración de hasta 7 días frente a 6 h del plan gratuito). Copia periódica independiente con `pg_dump` (Mac con `launchd` o GitHub Actions con cifrado). Probar una restauración. |
