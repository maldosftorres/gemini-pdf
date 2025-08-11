# 📄 Gemini PDF - Analizador Inteligente de Documentos

## 🎯 Descripción del Proyecto

**Gemini PDF** es una aplicación full-stack que permite analizar archivos PDF utilizando la API de Google Gemini AI. El sistema extrae información estructurada de documentos PDF según prompts personalizables y almacena los resultados en MongoDB para consultas posteriores.

## 🏗️ Arquitectura del Sistema

### **Stack Tecnológico**
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + MongoDB
- **IA**: Google Gemini 2.0 Flash API
- **Procesamiento**: Multer (almacenamiento en memoria)

### **Estructura del Proyecto**
```
gemini-pdf-cursor/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── constants/     # Configuraciones
│   │   └── assets/        # Recursos estáticos
│   └── package.json
├── server/                 # Backend Node.js
│   ├── index.js           # Servidor principal
│   └── package.json
└── README.md
```

## 🔧 Componentes del Backend

### **Servidor Principal (`server/index.js`)**

#### **Configuración y Middleware**
- **Express.js**: Framework web para crear APIs REST
- **CORS**: Permite comunicación entre frontend y backend
- **Multer**: Manejo de archivos PDF en memoria (sin almacenamiento local)
- **MongoDB**: Base de datos para almacenar prompts y estructuras JSON

#### **Funciones Principales**

##### **`subirYExtraerPDF(buffer, prompt, mimeType, originalname, responseSchema)`**
```javascript
// Procesa un PDF usando Gemini AI
async function subirYExtraerPDF(buffer, prompt, mimeType, originalname, responseSchema) {
  // 1. Convierte Buffer a Blob
  // 2. Sube archivo a Files API de Gemini
  // 3. Genera contenido usando el modelo AI
  // 4. Retorna respuesta estructurada
}
```

**Parámetros:**
- `buffer`: Contenido del PDF en memoria
- `prompt`: Instrucciones para el análisis
- `mimeType`: Tipo MIME del archivo
- `originalname`: Nombre original del archivo
- `responseSchema`: Esquema JSON para estructurar la respuesta

**Flujo de Procesamiento:**
1. **Buffer → Blob**: Convierte el buffer a Blob para la API
2. **Upload a Gemini**: Sube el archivo a la Files API
3. **Generación de Contenido**: Usa Gemini 2.0 Flash para análisis
4. **Respuesta Estructurada**: Retorna JSON formateado

##### **`conectarMongo()`**
```javascript
// Establece conexión con MongoDB
async function conectarMongo() {
  // Conecta usando MONGODB_URI del .env
  // Crea modelo JsonModel para almacenar datos
}
```

#### **Rutas API**

##### **`POST /api/upload`**
- **Propósito**: Recibe y procesa archivos PDF
- **Entrada**: `multipart/form-data` con PDF y prompt
- **Procesamiento**: 
  - Valida archivo recibido
  - Parsea schema de respuesta (si existe)
  - Llama a Gemini AI
  - Retorna resultado estructurado
- **Salida**: JSON con datos extraídos del PDF

##### **`GET /api/json`**
- **Propósito**: Obtiene prompt y estructura JSON desde MongoDB
- **Uso**: Carga configuración inicial del frontend

#### **Modelo de Datos MongoDB**
```javascript
const jsonSchema = new mongoose.Schema({
  json: mongoose.Schema.Types.Mixed,  // Estructura JSON flexible
  prompt: String,                     // Prompt personalizado
});
```

## 🎨 Componentes del Frontend

### **Componente Principal (`UploadPDF.jsx`)**

#### **Estado del Componente**
```javascript
const [pdfFile, setPdfFile] = useState(null);        // Archivo PDF seleccionado
const [prompt, setPrompt] = useState("");            // Prompt desde MongoDB
const [json, setJson] = useState(null);              // Estructura JSON plantilla
const [resultObj, setResultObj] = useState(null);    // Resultado procesado
const [rawText, setRawText] = useState("");          // Respuesta cruda (fallback)
const [loading, setLoading] = useState(false);       // Estado de carga
const [isDarkMode, toggleDarkMode] = useDarkMode();  // Modo oscuro/claro
```

#### **Funciones Principales**

##### **`handleSubmit(e)`**
```javascript
// Maneja el envío del formulario PDF
const handleSubmit = async (e) => {
  // 1. Valida archivo y prompt
  // 2. Genera schema desde plantilla MongoDB
  // 3. Envía PDF + prompt + schema al backend
  // 4. Procesa respuesta y rellena plantilla
  // 5. Actualiza estado con resultado
}
```

**Flujo de Procesamiento:**
1. **Validación**: Verifica archivo PDF y prompt
2. **Generación de Schema**: Crea esquema JSON desde plantilla
3. **Envío al Backend**: POST con FormData
4. **Procesamiento de Respuesta**: Parsea JSON y rellena plantilla
5. **Actualización de UI**: Muestra resultado estructurado

##### **`getMongoData()`**
```javascript
// Carga prompt y estructura JSON desde MongoDB
const getMongoData = async () => {
  // GET /api/json
  // Actualiza estado con prompt y estructura
}
```

##### **`inferSchemaFromTemplate(tpl)`**
```javascript
// Infiere esquema JSON desde una plantilla
function inferSchemaFromTemplate(tpl) {
  // Analiza estructura del objeto
  // Genera schema compatible con Gemini
  // Define tipos y propiedades requeridas
}
```

##### **`fillTemplate(template, data)`**
```javascript
// Rellena plantilla con datos del modelo AI
function fillTemplate(template, data) {
  // Merge inteligente de plantilla + datos
  // Mantiene estructura original
  // Rellena campos disponibles
}
```

#### **Funciones de Utilidad**

##### **`stripCodeFences(s)`**
```javascript
// Elimina marcadores de código markdown
function stripCodeFences(s) {
  // Remueve ```json, ```, etc.
  // Limpia respuesta del modelo AI
}
```

##### **`copyToClipboard()`**
```javascript
// Copia resultado al portapapeles
const copyToClipboard = async () => {
  // Copia JSON formateado o texto crudo
  // Feedback visual al usuario
}
```

### **Hook Personalizado (`useDarkMode.js`)**

#### **Funcionalidades**
- **Persistencia**: Guarda preferencia en localStorage
- **Detección Automática**: Usa preferencia del sistema
- **Toggle**: Cambia entre modo claro/oscuro
- **Aplicación Automática**: Actualiza clases CSS del documento

#### **Implementación**
```javascript
export const useDarkMode = () => {
  // Estado inicial desde localStorage o sistema
  // useEffect para aplicar cambios
  // Toggle function para cambiar modo
  // Retorna [isDarkMode, toggleDarkMode]
};
```

### **Configuración (`urls.js`)**
```javascript
// URLs de la API
export const API_URL = "http://localhost:4000/api";
export const API_URL_JSON = "http://localhost:4000/api/json";
export const API_URL_UPLOAD = "http://localhost:4000/api/upload";
```

## 🔄 Flujo de Funcionamiento

### **1. Inicialización**
- Frontend carga prompt y estructura JSON desde MongoDB
- Usuario selecciona archivo PDF
- Sistema valida archivo y configuración

### **2. Procesamiento**
- Frontend genera schema JSON desde plantilla
- Envía PDF + prompt + schema al backend
- Backend convierte PDF a Blob
- Sube archivo a Gemini Files API
- Llama al modelo AI con prompt y archivo

### **3. Respuesta**
- Gemini AI analiza PDF y genera respuesta
- Backend procesa y estructura resultado
- Frontend recibe respuesta y rellena plantilla
- UI muestra resultado estructurado

### **4. Características Adicionales**
- **Modo Oscuro/Claro**: Interfaz adaptable
- **Copia al Portapapeles**: Funcionalidad de exportación
- **Manejo de Errores**: Fallbacks para respuestas no estructuradas
- **Validación**: Verificación de archivos y configuración

## 🚀 Instalación y Configuración

### **Requisitos Previos**
- Node.js 18+ (para Blob nativo)
- MongoDB (opcional, para prompts personalizados)
- API Key de Google Gemini

### **Variables de Entorno**
```bash
# .env en el servidor
keygemini=tu_api_key_de_gemini
MONGODB_URI=mongodb://localhost:27017/gemini-pdf
PORT=4000
```

### **Instalación**
```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

## 🎯 Casos de Uso

### **Análisis de Documentos**
- Extracción de datos estructurados
- Procesamiento de formularios PDF
- Análisis de reportes financieros
- Extracción de información de facturas

### **Automatización**
- Procesamiento en lote de PDFs
- Integración con sistemas existentes
- APIs para aplicaciones externas
- Workflows automatizados

## 🔧 Tecnologías Utilizadas

### **Backend**
- **Express.js**: Framework web
- **Multer**: Manejo de archivos
- **Google GenAI**: SDK oficial de Gemini
- **MongoDB + Mongoose**: Base de datos
- **CORS**: Comunicación cross-origin

### **Frontend**
- **React 19**: Framework de UI
- **Vite**: Build tool moderno
- **Tailwind CSS**: Framework de estilos
- **Axios**: Cliente HTTP
- **React Icons**: Iconografía

### **IA y Procesamiento**
- **Google Gemini 2.0 Flash**: Modelo de IA
- **Files API**: Subida de archivos a Gemini
- **JSON Schema**: Estructuración de respuestas
- **Blob API**: Manejo de archivos en memoria

## 📈 Características Destacadas

- **🔄 Procesamiento en Memoria**: Sin archivos temporales en disco
- **🎨 Modo Oscuro/Claro**: Interfaz adaptable y persistente
- **📊 Respuestas Estructuradas**: JSON formateado automáticamente
- **🔒 Seguridad**: No almacenamiento local de archivos sensibles
- **⚡ Rendimiento**: Procesamiento optimizado en memoria
- **📱 Responsive**: Interfaz adaptativa para todos los dispositivos
- **🔄 Persistencia**: Configuración guardada en MongoDB

## 🚧 Limitaciones y Consideraciones

- **Tamaño de Archivo**: Límites de la API de Gemini
- **Tipos de Archivo**: Solo PDFs soportados
- **Conexión a Internet**: Requiere acceso a Gemini API
- **Costos**: Uso de la API de Gemini (tarifas por token)

## 🔮 Futuras Mejoras

- **Soporte Multi-formato**: DOCX, TXT, imágenes
- **Procesamiento en Lote**: Múltiples archivos simultáneos
- **Historial de Análisis**: Guardar resultados previos
- **APIs REST**: Endpoints para integración externa
- **Webhooks**: Notificaciones de procesamiento
- **Dashboard**: Estadísticas y métricas de uso

---

**Desarrollado con ❤️ usando React, Node.js y Google Gemini AI** 