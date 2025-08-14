export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
        .then(() => alert("Texto copiado al portapapeles"))
        .catch((err) => console.error("Error al copiar al portapapeles:", err));
};

/**
 * Extrae y parsea el JSON desde un texto con marcadores markdown
 * @param {string} texto - El texto que contiene el JSON con marcadores ```json
 * @returns {Object|null} - El objeto parseado o null si hay error
 */
export const extraerJSON = (texto) => {
    try {
        if (!texto) return null;

        // Si el texto es un objeto JSON, parsearlo directamente
        const data = typeof texto === 'string' ? JSON.parse(texto) : texto;

        // Verificar si contiene la propiedad "text" con el bloque JSON
        if (data.text) {
            // Extraer el bloque JSON dentro de los marcadores ```json
            const jsonLimpio = data.text
                .replace(/```json\n?/g, '') // Remover el marcador de inicio ```json
                .replace(/\n?```$/g, '')   // Remover el marcador de cierre ```
                .trim();

            return JSON.parse(jsonLimpio); // Parsear el JSON limpio
        }

        return null; // Si no contiene "text", devolver null
    } catch (error) {
        console.error('Error al parsear JSON:', error);
        return null;
    }
};