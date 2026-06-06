# **🛡️ Reglas del Proyecto y Buenas Prácticas: Scouting Hub RFEF & Juvenil (BeScout)**

**Rol:** Senior Frontend Architect & Product Lead.

**Contexto Técnico:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts.

**Objetivo:** Construir un MVP escalable para scouting deportivo, transicionando de **Mock Data** a una persistencia real en **Supabase** alimentada por scraping.

---

### **1\. 🏗️ Integridad Estructural y Organización**

El proyecto debe seguir estrictamente la arquitectura Next.js App Router para asegurar que el motor de búsqueda y las fichas de jugador carguen de forma eficiente.

* **Estructura de Carpetas:**  
  * `src/app`: Solo páginas (`page.tsx`), layouts (`layout.tsx`) y rutas de API para la conexión con Supabase.  
  * `src/components`: Componentes UI atómicos y modulares.  
  * `src/lib`: Lógica de negocio, utilidades (ej: formateo de alturas/pesos) y funciones de fetch (`supabase-client.ts`).  
  * **`src/data/mocks`**: Archivo `jugadores_db.json` (Fuente de la verdad absoluta para la Fase 1).  
* **Separación de Intereses (SoC):**  
  * NUNCA escribas lógica de scraping o de filtrado compleja dentro de un componente UI.  
  * Los componentes deben recibir datos limpios. La lógica de cálculo (ej: determinar si un jugador es `es_sub23` o filtrar por rango de ELO) debe residir en `src/lib/scouting-engine.ts`.

### **2\. ⚛️ Sistema de Diseño Atómico (Referencia: Scouting Pro)**

Implementa la interfaz basándote en la estética oscura de alto contraste vista en las referencias.

* **Átomos:** Botones de filtro, Badges de posición (POR, DEF, CEN, DEL), Indicador ELO.  
* **Moléculas:** Tarjetas de KPI (Market Value, Contract End), Filas de la tabla de base de datos.  
* **Organismos:** Sidebar de filtros avanzado, Ficha técnica del jugador.  
* **Identidad Visual:** Usa siempre las variables de color definidas en `tailwind.config.ts` (Slate, Zinc y acentos en Cyan/Emerald para indicadores positivos). **Prohibido** hardcodear códigos Hex; esto garantiza que el "Modo Oscuro" sea consistente en toda la app.

### **3\. 💾 Protocolo de Datos (Scraping & Supabase)**

Dado que los datos provienen de BeSoccer, la estructura debe ser resiliente a cambios en la web origen.

* **Interfaces Primero:** Antes de renderizar cualquier dato, la interfaz de TypeScript en `src/types/index.ts` debe estar definida.  
* **Manejo de Nulos (Crítico):** Los datos de categorías como Tercera RFEF o DH Juvenil suelen estar incompletos.  
  * SIEMPRE maneja valores `null` o `undefined`.  
  * Usa *Optional Chaining* (`jugador?.contrato?.fin`) y *Nullish Coalescing* (`elo ?? "N/A"`).  
  * Si falta un dato biométrico (peso/altura), muestra "-" para no romper la estética del dashboard.  
* **Lógica de Sincronización:** El sistema debe estar preparado para el mapeo de `id_jugador` (slug de BeSoccer) como clave primaria para evitar duplicados en Supabase.

### **4\. 🖼️ Gestión de Assets (Imágenes y Escudos)**

* **Optimización:** Usa el componente `<Image />` de Next.js para las fotos de los jugadores y escudos de los clubes.  
* **Fallbacks:** Debido a que las URLs de imágenes externas pueden romperse, implementa un componente `SafeImage` que muestre un avatar genérico o un escudo por defecto si la carga falla.

### **5\. 📏 Estándares de Calidad y Código**

* **TypeScript Estricto:** Prohibido el uso de `any`. Define tipos precisos para las estadísticas de temporada y los objetos biográficos.  
* **Diseño Mobile-First:** El dashboard debe ser consultable desde un móvil (para un scout a pie de campo), por lo que la tabla debe ser *scrollable* horizontalmente o colapsable en dispositivos pequeños.  
* **Rendimiento:** Implementa *Skeleton Screens* para la carga de las fichas de jugador mientras se obtienen los datos de Supabase.

### **6\. 🧠 Metainstrucciones de Autocorrección**

Si el agente Antigravity detecta una discrepancia entre las imágenes de referencia y el código generado:

1. Prioriza siempre la **densidad de información** de la imagen (queremos ver muchos datos de un vistazo).  
2. Si una instrucción del PRD v7.1 contradice un componente ya creado, detente y solicita confirmación.  
3. Verifica los datos: Si un filtro no devuelve resultados, imprime en consola el estado actual de los datos para asegurar que los tipos coinciden (ej: comparar `string` vs `number` en el ELO).

