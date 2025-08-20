import { useEffect, useState } from "react";
import axios from "axios";
import { API_DELETE_FILE, API_LIST_FILES } from "../constants/urls";
import { FaSpinner, FaTrash } from "react-icons/fa";

export const ListFiles = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(null); // id del archivo en proceso de eliminación

    const getFilesAll = async () => {
        try {
            setLoading(true);
            const resp = await axios.get(API_LIST_FILES);
            setFiles(resp.data.files || []);
        } catch (error) {
            console.error("❌ Error al obtener archivos:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteFileId = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este archivo?")) return;
        try {
            setDeleting(id);
            const encodedId = encodeURIComponent(id);
            await axios.delete(API_DELETE_FILE(encodedId));
            setFiles((prev) => prev.filter((f) => f.id !== id));
        } catch (error) {
            console.error("❌ Error al eliminar archivo:", error.response?.data || error.message);
        } finally {
            setDeleting(null);
        }
    };


    useEffect(() => {
        getFilesAll();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Archivos Subidos</h1>

                {loading ? (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FaSpinner className="animate-spin" />
                        <span>Cargando archivos...</span>
                    </div>
                ) : files.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No hay archivos disponibles.</p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Tamaño</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Creado</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Expira</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {files.map((file) => (
                                    <tr key={file.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{file.id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(file.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(file.expiresAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => deleteFileId(file.id)}
                                                disabled={deleting === file.id}
                                                className="px-3 py-1 flex items-center gap-2 bg-red-600 hover:bg-red-700 
                                                disabled:opacity-50 text-white text-sm rounded-md 
                                                transition-colors duration-200"
                                            >
                                                {deleting === file.id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Eliminando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaTrash />
                                                        Eliminar
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
