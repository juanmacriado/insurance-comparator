# Xeoris - Comparador de Pólizas de Ciberseguridad

Este proyecto es una herramienta avanzada para el análisis y comparación de pólizas de seguros de ciberseguridad. Utiliza Inteligencia Artificial (OpenAI GPT-4o) para extraer detalles críticos como límites de indemnización, franquicias y coberturas específicas.

## Características

- 🛡️ **Análisis de PDF**: Extracción automática de texto de pólizas en formato PDF.
- 🤖 **IA Integrada**: Uso de Vercel AI SDK y OpenAI para una extracción de datos precisa y contextual.
- 🎨 **Diseño Xeoris**: Interfaz moderna y profesional alineada con la identidad visual de Xeoris.com.
- 📄 **Generación de Informes**: Crea comparativas detalladas descargables en formato PDF.
- ⚡ **Tecnología Next.js 15**: Rendimiento optimizado y Server Actions.

## Requisitos Previos

- Node.js 18+ instalado.
- Una clave de API de OpenAI (`OPENAI_API_KEY`).

## Configuración Local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   Crea un archivo `.env.local` en la raíz con:
   ```env
   OPENAI_API_KEY=tu_clave_aqui
   ```
4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Vercel

La forma más rápida de desplegar es usando [Vercel](https://vercel.com):

1. Sube este proyecto a GitHub.
2. Importa el proyecto en Vercel.
3. Añade `OPENAI_API_KEY` en las variables de entorno de Vercel.

---
Desarrollado para Xeoris - Ciberseguridad Inteligente.
