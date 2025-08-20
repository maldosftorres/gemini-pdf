import React, { useEffect, useMemo, useState } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import * as pdfjs from "pdfjs-dist";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";

export default function PdfAnalysisPanel({
    pdfFile,
    data,                    // { autor, titulo, resumen, contenido, tipoDoc, nro, año }
    loading,
    onClear,
    height = "h-[820px]",
    editableFields = [],     // 👈 e.g. ["autor"]
    onFieldChange,           // 👈 (name, value) => void
    className = "",
    onSubmit,
}) {
    const fileUrl = useMemo(() => (pdfFile ? URL.createObjectURL(pdfFile) : null), [pdfFile]);
    useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

    // Estado editable local, se sincroniza con `data`
    const [form, setForm] = useState(() => ({
        autor: "", titulo: "", resumen: "", contenido: "", tipoDoc: "", nro: 0, año: 0,
        ...(data || {})
    }));
    useEffect(() => {
        setForm(prev => ({ ...prev, ...(data || {}) }));
    }, [data]);

    const canEdit = (name) => editableFields.includes(name);

    const handleChange = (name) => (e) => {
        const value = name === "nro" || name === "año" ? Number(e.target.value || 0) : e.target.value;
        setForm(f => ({ ...f, [name]: value }));
        onFieldChange?.(name, value);
    };

    return (
        <>
            {pdfFile && (
                <div className={`flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 ${height} ${className}`}>
                    {/* Izquierda: PDF */}
                    <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700 flex flex-col min-h-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex-none">Vista previa del PDF</h2>
                        <div className="flex-1 overflow-auto min-h-0">
                            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`}>
                                {fileUrl ? <Viewer fileUrl={fileUrl} /> : null}
                            </Worker>
                        </div>
                    </div>

                    {/* Derecha: Resultado */}
                    <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6 flex-none">
                            <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaCheckCircle className="w-6 h-6 text-green-500" />
                                Resultado del Análisis
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClear}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-sm font-medium
                                    bg-gray-200 hover:bg-gray-300 text-gray-700
                                    dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                    Limpiar
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => onSubmit?.(form)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium
                                    bg-blue-600 hover:bg-blue-700 text-white
                                    dark:bg-blue-500 dark:hover:bg-blue-400
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Enviar
                                </button>
                            </div>

                        </div>

                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 overflow-y-auto min-h-[0]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-2">
                                    <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
                                    <span className="text-gray-500 dark:text-gray-300">Analizando documento...</span>
                                </div>
                            ) : (
                                <div className="space-y-4 w-full">
                                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
                                        {/* Tipo Doc */}
                                        <Field label="Tipo de Documento">
                                            <input
                                                type="text"
                                                value={form.tipoDoc || ""}
                                                onChange={handleChange("tipoDoc")}
                                                readOnly={!canEdit("tipoDoc")}
                                                className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                            />
                                        </Field>

                                        {/* Nro */}
                                        <Field label="Nro">
                                            <input
                                                type="number"
                                                value={Number.isFinite(form.nro) ? form.nro : 0}
                                                onChange={handleChange("nro")}
                                                readOnly={!canEdit("nro")}
                                                className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                            />
                                        </Field>

                                        {/* Año */}
                                        <Field label="Año">
                                            <input
                                                type="number"
                                                value={Number.isFinite(form.año) ? form.año : 0}
                                                onChange={handleChange("año")}
                                                readOnly={!canEdit("año")}
                                                className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* titulo */}
                                        <Field label="Título">
                                            <input
                                                type="text"
                                                value={form.titulo || ""}
                                                onChange={handleChange("titulo")}
                                                readOnly={!canEdit("titulo")}
                                                className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                            />
                                        </Field>

                                        {/* autor (ÚNICO editable si lo pasás en editableFields) */}
                                        <Field label="Autor">
                                            <input
                                                type="text"
                                                value={form.autor || ""}
                                                onChange={handleChange("autor")}
                                                readOnly={!canEdit("autor")}
                                                className={`w-full rounded-md border px-3 py-2 ${canEdit("autor") ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-800/60"}`}
                                            />
                                        </Field>




                                    </div>



                                    {/* resumen */}
                                    <Field label="Resumen">
                                        <textarea
                                            rows={6}
                                            value={form.resumen || ""}
                                            onChange={handleChange("resumen")}
                                            readOnly={!canEdit("resumen")}
                                            className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                        />
                                    </Field>

                                    {/* contenido */}
                                    <Field label="Contenido">
                                        <textarea
                                            rows={8}
                                            value={form.contenido || ""}
                                            onChange={handleChange("contenido")}
                                            readOnly={!canEdit("contenido")}
                                            className="w-full rounded-md border px-3 py-2 bg-gray-100 dark:bg-gray-800/60"
                                        />
                                    </Field>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-sm font-bold mb-1">{label}</label>
            {children}
        </div>
    );
}
