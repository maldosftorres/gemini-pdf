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

// --- utils ---
function stripCodeFences(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

// Inferencia simple de JSON Schema a partir de una plantilla (best-effort)
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

// Rellena la plantilla con los valores devueltos por el modelo (merge por claves)
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

export default function UploadPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [json, setJson] = useState(null); // plantilla desde Mongo
  const [resultObj, setResultObj] = useState(null); // plantilla rellenada
  const [rawText, setRawText] = useState(""); // respuesta cruda si falla parseo
  const [loading, setLoading] = useState(false);
  const [loadingMongo, setLoadingMongo] = useState(false);
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  const handleFileChange = (e) => setPdfFile(e.target.files[0]);

  // POST /upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return alert("Selecciona un PDF.");
    if (!prompt) return alert("No se pudo cargar el prompt.");
    if (!json) return alert("No se pudo cargar la estructura JSON desde Mongo.");

    setLoading(true);
    setResultObj(null);
    setRawText("");

    // 1) Generamos un schema desde la plantilla recuperada de Mongo
    const responseSchema = inferSchemaFromTemplate(json);

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("prompt", prompt);
    formData.append("responseSchema", JSON.stringify(responseSchema));

    try {
      const resp = await axios.post(API_URL_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let data = resp.data;
      if (data && typeof data === "object" && "resultado" in data) data = data.resultado;

      // Normalizamos a objeto
      let parsed = null;
      if (data && typeof data === "object") {
        parsed = data;
      } else if (typeof data === "string") {
        try { parsed = JSON.parse(stripCodeFences(data)); }
        catch { setRawText(stripCodeFences(data)); }
      } else if (data && typeof data === "object" && "raw" in data) {
        try { parsed = JSON.parse(stripCodeFences(data.raw)); }
        catch { setRawText(stripCodeFences(data.raw)); }
      }

      if (parsed) {
        // 2) Rellenamos la plantilla con lo devuelto por el modelo
        const filled = fillTemplate(json, parsed);
        setResultObj(filled);
      }

      if (!parsed && !rawText) setRawText(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Error desconocido";
      setRawText("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // GET prompt + estructura desde Mongo
  const getMongoData = async () => {
    setLoadingMongo(true);
    try {
      const resp = await axios.get(API_URL_JSON);
      const data = resp.data;
      if (data?.prompt) setPrompt(data.prompt);
      if (data?.json) setJson(data.json);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Error al cargar datos de MongoDB";
      console.error("Error al cargar datos de MongoDB:", errorMessage);
    } finally {
      setLoadingMongo(false);
    }
  };

  useEffect(() => { getMongoData(); }, []);

  const copyToClipboard = async () => {
    const text = resultObj ? JSON.stringify(resultObj, null, 2) : rawText;
    try { await navigator.clipboard.writeText(text); alert("Copiado al portapapeles"); } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
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

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200">
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <FaFilePdf className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-700 dark:text-gray-300">{pdfFile ? pdfFile.name : "Selecciona un archivo PDF"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Haz clic para seleccionar o arrastra un archivo aquí</p>
                </div>
              </label>
            </div>

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

        {(resultObj || rawText) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <FaCheckCircle className="w-6 h-6 text-green-500" />
                <span>Resultado del Análisis</span>
              </h2>
              <button onClick={copyToClipboard} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                <FaCopy className="w-4 h-4" /> Copiar
              </button>
            </div>

            {resultObj ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                {JSON.stringify(resultObj, null, 2)}
              </pre>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Respuesta sin formato (no fue posible parsear JSON automáticamente):</p>
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
