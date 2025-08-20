import { FaFilePdf, FaList, FaMoon, FaSun } from "react-icons/fa";
import { useDarkMode } from "../hooks/useDarkMode";
import { Link } from "react-router-dom";

export const Header = () => {
    const [isDarkMode, toggleDarkMode] = useDarkMode();    // modo oscuro (custom hook)

    return (
        <div>
            {/* Header con toggle de dark mode */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <Link
                        to="/"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 text-4xl"
                    >
                        Biblioteca
                    </Link>

                    {/* Navegación */}
                    <nav className="flex space-x-6">
                        <Link
                            to="/upload"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300
                            hover:text-blue-500 dark:hover:text-blue-400 
                            font-medium transition-colors duration-200"
                        >
                            <FaFilePdf className="w-5 h-5" />
                            <span>Analizar PDF</span>
                        </Link>

                        <Link
                            to="/listar-archivos"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 
                            hover:text-blue-500 dark:hover:text-blue-400 
                            font-medium transition-colors duration-200"
                        >
                            <FaList className="w-5 h-5" />
                            <span>Listar Archivos</span>
                        </Link>
                    </nav>


                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    >
                        {isDarkMode ? <FaSun className="w-6 h-6" /> : <FaMoon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );

}