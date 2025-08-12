// ============================================================
// UploadPDF.jsx — Front de carga de PDF, envío a backend (Gemini)
// y visualización del JSON resultante (plantilla + rellenado).
// ------------------------------------------------------------
// NOTAS DE ARQUITECTURA:
// - Este componente hace 3 cosas: (1) carga prompt+plantilla desde Mongo,
//   (2) sube PDF al backend para extraer datos, (3) muestra el resultado.
// - Cuando integres "Disposiciones", acá mismo podés POSTear el objeto
//   final (resultObj) a /api/disposiciones (ver TODO más abajo).
// ============================================================

import axios from "axios";
import { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  FaSun,
  FaMoon,
  FaFilePdf,
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaCopy
} from "react-icons/fa";
import { API_URL_UPLOAD, API_URL_JSON } from "../constants/urls";

// ------------------------------------------------------------
// utils: helpers puros (sin efectos)
// ------------------------------------------------------------

/**
 * El modelo a veces responde con bloques ```json ... ```
 * Esto limpia esos “fences” para poder parsear.
 */
function stripCodeFences(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Genera un JSON Schema "best-effort" a partir de una plantilla.
 * - Sirve para “guiar” al modelo y forzar estructura consistente.
 * - No es perfecto; en producción podrías mantener un schema explícito.
 */
function inferSchemaFromTemplate(tpl) {
  const typeOf = (v) => Array.isArray(v) ? "array" : (v === null ? "null" : typeof v);
  const build = (v) => {
    const t = typeOf(v);
    if (t === "object") {
      const props = {};
      for (const k of Object.keys(v)) props[k] = build(v[k]);
      return { type: "object", properties: props };
    }
    if (t === "array") {
      const first = v.length ? v[0] : "";
      return { type: "array", items: build(first) };
    }
    if (t === "number") return { type: "number" };
    if (t === "boolean") return { type: "boolean" };
    return { type: "string" };
  };
  const schema = build(tpl || {});
  if (schema.type === "object") schema.required = Object.keys(tpl || {});
  return schema;
}

/**
 * Rellena la plantilla con lo devuelto por el modelo (merge por claves).
 * - Respeta la estructura del template y copia valores coincidentes.
 * - Si el modelo trae más claves que el template, se ignoran (safe-by-default).
 */
function fillTemplate(template, data) {
  if (template == null) return data;
  if (Array.isArray(template)) {
    if (Array.isArray(data)) {
      if (template.length === 0) return data;
      const itemTpl = template[0];
      return data.map((d) => fillTemplate(itemTpl, d));
    }
    return template;
  }
  if (typeof template === "object") {
    const out = { ...template };
    if (data && typeof data === "object") {
      for (const k of Object.keys(template)) {
        if (k in data) out[k] = fillTemplate(template[k], data[k]);
      }
    }
    return out;
  }
  return data !== undefined ? data : template;
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------
export default function UploadPDF() {
  // Estado base del flujo
  const [pdfFile, setPdfFile] = useState(null);     // archivo seleccionado
  const [prompt, setPrompt] = useState("");         // prompt desde Mongo
  const [json, setJson] = useState(null);           // plantilla desde Mongo
  const [resultObj, setResultObj] = useState(null); // plantilla rellenada con la respuesta
  const [rawText, setRawText] = useState("");       // respuesta cruda si no hubo JSON válido

  // Estado de UX
  const [loading, setLoading] = useState(false);         // spinner botón principal
  const [loadingMongo, setLoadingMongo] = useState(false); // spinner de carga de prompt/plantilla
  const [isDarkMode, toggleDarkMode] = useDarkMode();    // modo oscuro (custom hook)

  // Handler de file input
  const handleFileChange = (e) => setPdfFile(e.target.files[0]);

  // ----------------------------------------------------------
  // SUBMIT: POST /upload — sube el PDF, fuerza schema, procesa respuesta
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guardrails: no seguimos si falta algo clave
    if (!pdfFile) return alert("Selecciona un PDF.");
    if (!prompt) return alert("No se pudo cargar el prompt.");
    if (!json) return alert("No se pudo cargar la estructura JSON desde Mongo.");

    setLoading(true);
    setResultObj(null);
    setRawText("");

    // 1) Derivamos un JSON Schema a partir de la plantilla (guía para el LLM)
    const responseSchema = inferSchemaFromTemplate(json);

    // 2) Armamos FormData para enviar archivo y parámetros
    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("prompt", prompt);
    formData.append("responseSchema", JSON.stringify(responseSchema));

    try {
      // 3) POST al backend (Gemini hará la extracción)
      const resp = await axios.post(API_URL_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 4) Normalizamos la respuesta para obtener un objeto final
      let data = resp.data;

      // Si el backend encapsula en { resultado: ... }, lo abrimos
      if (data && typeof data === "object" && "resultado" in data) data = data.resultado;

      let parsed = null;

      if (data && typeof data === "object") {
        // Caso ideal: ya es JSON
        parsed = data;
      } else if (typeof data === "string") {
        // Intentamos parsear si vino en texto (con o sin fences)
        try { parsed = JSON.parse(stripCodeFences(data)); }
        catch { setRawText(stripCodeFences(data)); }
      } else if (data && typeof data === "object" && "raw" in data) {
        // Backend devolvió { raw: "..." } si no pudo parsear
        try { parsed = JSON.parse(stripCodeFences(data.raw)); }
        catch { setRawText(stripCodeFences(data.raw)); }
      }

      if (parsed) {
        // 5) Merge controlado: rellenamos la plantilla con lo devuelto
        const filled = fillTemplate(json, parsed);
        setResultObj(filled);

        // TODO (siguiente sprint): aquí podrías POSTear a Disposiciones:
        // await axios.post(API_URL_DISPOSICIONES, filled);
      }

      // Si no pudimos parsear nada, mostramos lo que haya
      if (!parsed && !rawText) setRawText(JSON.stringify(data, null, 2));
    } catch (error) {
      // UX: mensaje legible (sin stack trace)
      const errorMessage = error.response?.data?.error || error.message || "Error desconocido";
      setRawText("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // GET /json — carga inicial: prompt + plantilla desde Mongo
  // ----------------------------------------------------------
  const getMongoData = async () => {
    setLoadingMongo(true);
    try {
      const resp = await axios.get(API_URL_JSON);
      const data = resp.data;

      // “Contrato” esperado: { prompt, json }
      if (data?.prompt) setPrompt(data.prompt);
      if (data?.json) setJson(data.json);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Error al cargar datos de MongoDB";
      console.error("Error al cargar datos de MongoDB:", errorMessage);
    } finally {
      setLoadingMongo(false);
    }
  };

  // Carga inicial al montar
  useEffect(() => { getMongoData(); }, []);

  // Logs útiles en dev (puedes quitarlos en prod)
  useEffect(() => {
    if (prompt && json) {
      console.log("prompt:", prompt);
      console.log("json:", json);
    }
  }, [prompt, json]);

  useEffect(() => {
    if (resultObj) {
      console.log("resultObj:", resultObj);
    }
  }, [resultObj]);

  // Utilidad: copiar al portapapeles (para QA rápida)
  const copyToClipboard = async () => {
    const text = resultObj ? JSON.stringify(resultObj, null, 2) : rawText;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado al portapapeles");
    } catch (_) {
      // Silencioso: no cortemos el flujo si falla
    }
  };

  // ----------------------------------------------------------
  // UI — Tailwind + react-icons (simple, legible, dark-mode ready)
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header con toggle de dark mode */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análisis PDF con Gemini</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDarkMode ? <FaSun className="w-6 h-6" /> : <FaMoon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main card: carga de archivo + CTA */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dropzone simple (controlado por input file oculto) */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <FaFilePdf className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
                    {pdfFile ? pdfFile.name : "Selecciona un archivo PDF"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Haz clic para seleccionar o arrastra un archivo aquí
                  </p>
                </div>
              </label>
            </div>

            {/* Estado de carga del prompt/plantilla desde Mongo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {prompt ? (
                  <FaCheckCircle className="w-3 h-3 text-green-500" />
                ) : loadingMongo ? (
                  <FaSpinner className="w-3 h-3 text-yellow-500 animate-spin" />
                ) : (
                  <FaExclamationCircle className="w-3 h-3 text-red-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {prompt ? "Prompt cargado" : loadingMongo ? "Cargando prompt..." : "Error al cargar prompt"}
                </span>
              </div>
            </div>

            {/* Botón principal: lanza el pipeline */}
            <button
              type="submit"
              disabled={loading || !prompt || !pdfFile || !json}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <FaUpload className="w-5 h-5" />
                  <span>Analizar PDF</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Panel de resultados: muestra JSON “bonito” o raw text si falló el parseo */}
        {(resultObj || rawText) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <FaCheckCircle className="w-6 h-6 text-green-500" />
                <span>Resultado del Análisis</span>
              </h2>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <FaCopy className="w-4 h-4" /> Copiar
              </button>
            </div>

            {resultObj ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                {JSON.stringify(resultObj, null, 2)}
              </pre>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Respuesta sin formato (no fue posible parsear JSON automáticamente):
                </p>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  {rawText}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TODOs sugeridos (próximo sprint):
// - Agregar un textarea readonly para ver/editar el prompt.
// - Botón “Guardar en Disposiciones” que haga POST del resultObj.
// - Validar tamaño del PDF antes de subir.
// - Manejo de errores más friendly (toast en vez de alert).
// - Telemetría simple (tiempo de respuesta, % parseo OK, etc).
// ============================================================
