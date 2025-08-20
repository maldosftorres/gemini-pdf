import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { FaFilePdf } from "react-icons/fa";
import { API_URL_UPLOAD, API_JSON_SCHEMA_URL, API_DISPOSICIONES, API_DELETE_FILE } from "../constants/urls";
import { extraerJSON } from "../utils/utils";
import '@react-pdf-viewer/core/lib/styles/index.css';
import PdfAnalysisPanel from "./PdfAnalysisPanel";

export const UploadPDF = () => {
  // Estado base del flujo
  const [visible, setVisible] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);     // archivo seleccionado
  const [prompt, setPrompt] = useState("");         // prompt desde Mongo
  const [json, setJson] = useState(null);           // plantilla desde Mongo
  const [resGemini, setResGemini] = useState("");       // respuesta cruda si no hubo JSON válido
  const [loading, setLoading] = useState(false);         // spinner botón principal
  const [loadingMongo, setLoadingMongo] = useState(false); // spinner de carga de prompt/json
  const fileInputRef = useRef(null);

  const clearAll = () => {
    setResGemini(null);      // o "" según uses; lo importante es que sea falsy
    setPdfFile(null);
    // setVisible(true);        // vuelve a mostrar el input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const getMongoData = async () => {
    setLoadingMongo(true);
    try {
      const resp = await axios.get(API_JSON_SCHEMA_URL);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file); // Establece el archivo para mostrarlo en el visor
    setLoading(true);
    setResGemini("");
    // setVisible(false);  // Oculta el input de carga una vez que se selecciona un archivo

    const promptFinal = `${prompt}\n\n${json}`;
    // console.log('Prompt final:', promptFinal);


    const formData = new FormData();
    formData.append("pdfFile", file);
    formData.append("prompt", promptFinal);

    try {
      const resp = await axios.post(API_URL_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let data = resp.data;
      const parsedData = extraerJSON(data);
      // console.log('Parseado',parsedData);

      setResGemini(parsedData);

      if (data.file?.id) {
        try {
          const encodedId = encodeURIComponent(data.file.id);
          await axios.delete(API_DELETE_FILE(encodedId));
          console.log("Archivo eliminado de la nube ✅");
        } catch (err) {
          console.error("Error eliminando archivo de Gemini:", err);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Error desconocido";
      setResGemini("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMongoData();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

      {/* Main card: carga de archivo + CTA */}
      <div className="max-w-full mx-auto px-4 py-4">
        {/* {visible ? ( */}
          <div className="mx-auto  max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <form>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-5">
                <label
                  htmlFor="pdf-upload"
                  className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-3
                hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30">
                    <FaFilePdf className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm md:text-base font-medium text-gray-800 dark:text-gray-100">
                      {pdfFile ? pdfFile.name : "Selecciona un archivo PDF"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Solo archivos .pdf
                    </p>
                  </div>
                </label>

                <input
                  id="pdf-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}      // ← aquí ya llamás a tu servicio
                  className="hidden"
                />
              </div>
            </form>
          </div>
          {/* ) : ('')} */}

        {/* Panel de resultados: muestra PDF en la izquierda y JSON en la derecha */}
        <PdfAnalysisPanel
          pdfFile={pdfFile}
          data={resGemini}
          loading={loading}
          onClear={clearAll}
          editableFields={["autor"]}                 // 👈 solo AUTOR editable
          onFieldChange={(name, value) => {
            // opcional: mantener resGemini en sync en el padre
            setResGemini(prev => ({ ...(prev || {}), [name]: value }));
          }}
          // onSubmit={(finalData) => { console.log("Datos listos para enviar:", finalData); }}
          onSubmit={async (finalData) => {
            try {
              const resp = await fetch(API_DISPOSICIONES, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
              });
              const json = await resp.json();
              if(json) {
                alert("Se ha guardado con éxito ✅");
                // console.log("Guardado OK:", json);
              }

            } catch (e) {
              console.error("Error guardando Disposición:", e);
            }
          }}

        />

      </div>
    </div>
  );
}
