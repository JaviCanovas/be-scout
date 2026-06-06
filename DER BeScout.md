# **Proyecto: Scouting Hub RFEF & Juvenil (BeScout)**

## **Documento de Especificación de Requisitos (v7.1 \- Final)**

### **1\. Introducción y Contexto de Negocio**

**Propósito:** Desarrollar una plataforma de inteligencia de datos orientada a clubes de fútbol con presupuesto limitado. El objetivo es democratizar el acceso al *scouting* profesional en categorías no profesionalizadas, utilizando métricas avanzadas (ELO) para detectar talento joven (Sub-23) y jugadores en fin de contrato antes que la competencia.

**Público Objetivo:** Directores deportivos y analistas de Segunda RFEF, Tercera RFEF y canteras de División de Honor.

---

### **2\. Alcance del Proyecto**

La plataforma centralizará la información de tres grupos específicos de la web **BeSoccer**:

1. **Segunda RFEF** \- Grupo 4\.  
2. **Tercera RFEF** \- Grupo 13 (Región de Murcia).  
3. **División de Honor Juvenil** \- Grupo 7\.

---

### **3\. Identidad Visual (Referencia UI)**

El sistema debe replicar fielmente la estética de las imagenes de referencia (archivos `imagen_interfaz_inicio.jpg` y `imagen_interfaz_perfil.jpg`):

* **Interfaz de Usuario:** Dashboard oscuro (Dark Mode), tipografía técnica y uso de colores vibrantes para acentos (puntuación ELO, badges de posición).  
* **Componentes:** Desarrollado con **Next.js**, **Tailwind CSS** y **Shadcn/UI**.

---

### **4\. Modelo de Datos Relacional (Supabase)**

El agente debe estructurar la base de datos en **Supabase** (PostgreSQL) con las siguientes tablas:

* **Tabla `jugadores`**:  
  * `id_jugador` (PK), `nombre_completo`, `nombre_corto`.  
  * `puntuacion_elo` (Valor entero actual de BeSoccer).  
  * `biometria`: edad, peso, altura, pie dominante.  
  * `club_actual`, `ultimo_club`, `competicion`.  
* **Tabla `estadisticas`**:  
  * `partidos_jugados`, `partidos_titular`, `minutos_totales`.  
  * `goles`, `asistencias`, `tarjetas`.  
* **Tabla `contratos`**:  
  * `fin_contrato` (Año), `estado` (Propiedad/Cedido), `agente, valor_mercado`.

---

### **5\. Fases de Desarrollo**

#### **Fase 1: UI & Mock Data (Validación Visual)**

Creación del Dashboard y la Ficha de Jugador con datos ficticios. No se usarán gráficas de radar ni evolución de ELO; el diseño será limpio y basado en tablas y tarjetas de KPI.

#### **Fase 2: Motor de Scraping (Python \+ Playwright)**

Desarrollo del scraper para BeSoccer. El script debe navegar por las plantillas de los grupos seleccionados, entrar en cada perfil de jugador y extraer los datos biométricos y contractuales. (Puedes sugerir otras herramientas para scrapear los datos si fuese necesario).

#### **Fase 3: Sincronización e Integración**

Implementación de la lógica `upsert` en Supabase para mantener la base de datos actualizada sin duplicar registros, si fuese necesario se puede preparar la conexión del proyecto mediante MCP con supabase, tanto para guardar los datos de la herramienta, como para, en un entorno de producción, crear un mecanismo de autentificación para entrar a la herramienta.

