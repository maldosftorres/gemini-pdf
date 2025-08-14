import axios from "axios";
import { useState, useEffect } from "react";
import { useDarkMode } from "../hooks/useDarkMode";
import { FaSun, FaMoon, FaFilePdf, FaUpload, FaSpinner, FaCheckCircle, FaExclamationCircle, FaCopy } from "react-icons/fa";
import { API_URL_UPLOAD, API_JSON_SCHEMA_URL } from "../constants/urls";
import { copyToClipboard, extraerJSON } from "../utils/utils";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import * as pdfjs from 'pdfjs-dist';

export default function UploadPDF() {
  // Estado base del flujo
  const [pdfFile, setPdfFile] = useState(null);     // archivo seleccionado
  const [prompt, setPrompt] = useState("");         // prompt desde Mongo
  const [json, setJson] = useState(null);           // plantilla desde Mongo
  const [prompt2, setprompt2] = useState(`Tenés el lugar de Jefe de Asesoría Jurídica de una empresa importante.
    A partir del documento adjunto, extrae la información solicitada y devuélvela EXCLUSIVAMENTE en el siguiente formato JSON válido proveido, sin texto adicional:
    
    {
        "autor": "",
        "titulo": "",
        "resumen": "",
        "contenido": "",
        "tipoDoc": "",
        "nro": 0,
        "año": 0
    }
    
    Notas:
    - "tipoDoc" debe ser uno de: "tdCircular", "tdDisposicion".
    - "nro" y "año" son enteros.
    - "autor" está al final con un sello y una firma. Solamente extrae el nombre no el cargo.
    - "año" es el año del documento, no el año actual. Debe ser un número entero de 4 dígitos.
    `);
  const [resGemini, setResGemini] = useState("");       // respuesta cruda si no hubo JSON válido
  const [loading, setLoading] = useState(false);         // spinner botón principal
  const [loadingMongo, setLoadingMongo] = useState(false); // spinner de carga de prompt/plantilla
  const [isDarkMode, toggleDarkMode] = useDarkMode();    // modo oscuro (custom hook)

  const getMongoData = async () => {
    setLoadingMongo(true);
    try {
      const resp = await axios.get(API_JSON_SCHEMA_URL);
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
  useEffect(() => { getMongoData(); }, []);

  const handleFileChange = (e) => setPdfFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile || !prompt || !json) return alert("Falta un dato no podemos procesar el archivo.");

    setLoading(true);
    setResGemini("");

    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    formData.append("prompt", prompt);
    formData.append("responseSchema", json);

    try {
      const resp = await axios.post(API_URL_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let data = resp.data;
      const parsedData = extraerJSON(data);
      console.log(parsedData);


      setResGemini(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      // UX: mensaje legible (sin stack trace)
      const errorMessage = error.response?.data?.error || error.message || "Error desconocido";
      setResGemini("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboardHandler = async () => {
    const text = resGemini;
    copyToClipboard(text);
  };

  console.log("Prompt:", prompt);
  console.log("JSON:", json);
  
  console.log(`${prompt} 
    ${json}`);
  
  

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header con toggle de dark mode */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
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
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 mb-8">

          {/* Estado de carga del prompt/plantilla desde Mongo */}
          <div className="flex items-center gap-5 mb-1">
            {/* Prompt cargado */}
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
            {/* Schema cargado */}
            <div className="flex items-center space-x-2">
              {json ? (
                <FaCheckCircle className="w-3 h-3 text-green-500" />
              ) : loadingMongo ? (
                <FaSpinner className="w-3 h-3 text-yellow-500 animate-spin" />
              ) : (
                <FaExclamationCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {json ? "Schema cargado" : loadingMongo ? "Cargando Schema..." : "Error al cargar schema"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mb-6 flex justify-between items-center gap-4">
            {/* Contenedor del archivo (60%) */}
            <div className="w-3/5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-blue-500 p-3 dark:hover:border-blue-400 
            transition-colors duration-200 flex items-center">
              <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-row items-center gap-4 w-full">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <FaFilePdf className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>

                <div>
                  <p className="text-md font-medium text-gray-700 dark:text-gray-300">
                    {pdfFile ? pdfFile.name : "Selecciona un archivo PDF"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Haz clic para seleccionar un archivo PDF.
                  </p>
                </div>
              </label>
            </div>

            {/* Botón para analizar (40%) */}
            <div className="w-2/5 flex justify-end">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 h-16"
                type="submit"
                disabled={loading || !pdfFile || !prompt || !json}
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-7 h-7 animate-spin" />
                    <span className="text-xl">Procesando...</span>
                  </>
                ) : (
                  <>
                    <FaUpload className="w-7 h-7" />
                    <span className="text-xl">Analizar PDF</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Panel de resultados: muestra PDF en la izquierda y JSON en la derecha */}
        {(pdfFile) && (
          <div className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            {/* Columna izquierda: Visor de PDF */}
            <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vista previa del PDF</h2>
              <div className="h-[600px] overflow-auto"> {/* Aumentamos la altura */}
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`}>
                  <Viewer fileUrl={URL.createObjectURL(pdfFile)} />
                </Worker>
              </div>
            </div>

            {/* Columna derecha: Resultado del análisis */}
            <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <FaCheckCircle className="w-6 h-6 text-green-500" />
                  <span>Resultado del Análisis</span>
                </span>
                <button
                  onClick={copyToClipboardHandler}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <FaCopy className="w-4 h-4" /> Copiar
                </button>
                <button
                  onClick={() => setResGemini("")}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <FaCopy className="w-4 h-4" /> Limpiar
                </button>
              </div>

              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-[600px] overflow-auto">
                {resGemini || "El resultado del análisis aparecerá aquí."}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
