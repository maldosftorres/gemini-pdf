import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { API_LISTAR_DISPOSICIONES } from "../constants/urls";

// Wrapper simple para tu etiqueta y control
function Field({ label, children }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            {children}
        </div>
    );
}

// Util para saber si un campo es editable (por default, todos read-only)
const makeCanEdit = (editableFields = []) => (key) =>
    Array.isArray(editableFields) && editableFields.includes(key);

export const ConsultMongo = ({ editableFields = [] }) => {
    const [disposiciones, setDisposiciones] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const canEdit = useMemo(() => makeCanEdit(editableFields), [editableFields]);

    // Normalizar doc Mongo → form con tus keys exactas
    const toForm = useCallback((doc) => {
        const getNum = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };
        return {
            tipoDoc: doc?.tipoDoc ?? doc?.TipoDoc ?? doc?.tipo_documento ?? doc?.tipo ?? "",
            nro: getNum(doc?.nro ?? doc?.Nro),
            año: getNum(doc?.año ?? doc?.Año ?? doc?.anio ?? doc?.ano),
            titulo: doc?.titulo ?? doc?.Titulo ?? "",
            autor: doc?.autor ?? doc?.Autor ?? "",
            resumen: doc?.resumen ?? doc?.Resumen ?? "",
            contenido: doc?.contenido ?? doc?.Contenido ?? "",
            fecha: doc?.fecha ?? doc?.Fecha ?? "", // por si lo querés en la lista
            _raw: doc, // lo guardamos por si hace falta algo extra
        };
    }, []);

    const [form, setForm] = useState({
        tipoDoc: "",
        nro: 0,
        año: 0,
        titulo: "",
        autor: "",
        resumen: "",
        contenido: "",
    });

    const handleChange = (key) => (e) => {
        const val =
            e?.target?.type === "number" ? Number(e.target.value) : e.target.value;
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    useEffect(() => {
        const fetchDisposiciones = async () => {
            try {
                const { data } = await axios.get(API_LISTAR_DISPOSICIONES);
                const list = Array.isArray(data) ? data : [];
                setDisposiciones(list);
                if (list.length > 0) {
                    const first = list[0];
                    setSelected(first);
                    setForm(toForm(first));
                }
            } catch (err) {
                console.error("Error consultando disposiciones:", err);
                setErrorMsg("No pudimos obtener el listado. Reintentá más tarde.");
            } finally {
                setLoading(false);
            }
        };
        fetchDisposiciones();
    }, [toForm]);

    // Cuando cambia el seleccionado, refrescamos el form normalizado
    useEffect(() => {
        if (selected) setForm(toForm(selected));
    }, [selected, toForm]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Consultar MongoDB
                </h1>

                {loading && (
                    <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
                )}

                {!loading && errorMsg && (
                    <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-200">
                        {errorMsg}
                    </div>
                )}

                {!loading && !errorMsg && (
                    <>
                        {disposiciones.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* LISTA (sin _id, __v, Documento) */}
                                <div className="lg:col-span-1 space-y-3">
                                    {disposiciones.map((d) => {
                                        const isActive = selected?._id === d._id;
                                        const titulo = d.Titulo ?? d.titulo ?? "Sin título";
                                        const autor = d.Autor ?? d.autor ?? "Autor desconocido";
                                        const fecha = d.Fecha ?? d.fecha ?? "—";
                                        const Nro = d.nro ?? d.Nro ?? 0;
                                        return (
                                            <button
                                                key={d._id}
                                                onClick={() => setSelected(d)}
                                                className={`w-full text-left p-4 rounded-xl shadow bg-white dark:bg-gray-800 border ${isActive
                                                        ? "border-blue-500"
                                                        : "border-gray-200 dark:border-gray-700"
                                                    } hover:border-blue-400 transition`}
                                            >
                                                <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                                                    {titulo} {Nro ? `#${Nro}` : ""}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {autor}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {fecha}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* DETALLE EXACTO CON TU ESTRUCTURA/ESTILOS */}
                                <div className="lg:col-span-2">
                                    <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                        <div className="space-y-4 w-full">
                                            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
                                                {/* Tipo Doc */}
                                                <Field label="Tipo de Documento">
                                                    <input
                                                        type="text"
                                                        value={form.tipoDoc || ""}
                                                        onChange={handleChange("tipoDoc")}
                                                        readOnly={!canEdit("tipoDoc")}
                                                        className="w-full rounded-md border px-3 py-2 bg-gray-100 text-justify
                            dark:bg-gray-800/60 dark:text-white"
                                                    />
                                                </Field>

                                                {/* Nro */}
                                                <Field label="Nro">
                                                    <input
                                                        type="number"
                                                        value={Number.isFinite(form.nro) ? form.nro : 0}
                                                        onChange={handleChange("nro")}
                                                        readOnly={!canEdit("nro")}
                                                        className="w-full rounded-md border px-3 py-2 bg-gray-100 text-justify
                            dark:bg-gray-800/60 dark:text-white"
                                                    />
                                                </Field>

                                                {/* Año */}
                                                <Field label="Año">
                                                    <input
                                                        type="number"
                                                        value={Number.isFinite(form.año) ? form.año : 0}
                                                        onChange={handleChange("año")}
                                                        readOnly={!canEdit("año")}
                                                        className="w-full rounded-md border px-3 py-2 bg-gray-100 text-justify
                            dark:bg-gray-800/60 dark:text-white"
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Título */}
                                                <Field label="Título">
                                                    <input
                                                        type="text"
                                                        value={form.titulo || ""}
                                                        onChange={handleChange("titulo")}
                                                        readOnly={!canEdit("titulo")}
                                                        className="w-full rounded-md border px-3 py-2 bg-gray-100 text-justify
                            dark:bg-gray-800/60 dark:text-white"
                                                    />
                                                </Field>

                                                {/* Autor */}
                                                <Field label="Autor">
                                                    <input
                                                        type="text"
                                                        value={form.autor || ""}
                                                        onChange={handleChange("autor")}
                                                        readOnly={!canEdit("autor")}
                                                        className={`w-full rounded-md border px-3 py-2 dark:text-white ${canEdit("autor")
                                                                ? "bg-white dark:bg-gray-800"
                                                                : "bg-gray-100 dark:bg-gray-800/60"
                                                            }`}
                                                    />
                                                </Field>
                                            </div>

                                            {/* Resumen */}
                                            <Field label="Resumen">
                                                <textarea
                                                    rows={4}
                                                    value={form.resumen || ""}
                                                    onChange={handleChange("resumen")}
                                                    readOnly={!canEdit("resumen")}
                                                    className="w-full rounded-md border px-3 py-2 bg-gray-100 
                          dark:bg-gray-800/60 dark:text-white"
                                                />
                                            </Field>

                                            {/* Contenido */}
                                            <Field label="Contenido">
                                                <textarea
                                                    rows={8}
                                                    value={form.contenido || ""}
                                                    onChange={handleChange("contenido")}
                                                    readOnly={!canEdit("contenido")}
                                                    className="w-full rounded-md border px-3 py-2 bg-gray-100
                          dark:bg-gray-800/60 dark:text-white"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300">
                                No hay disposiciones guardadas.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
