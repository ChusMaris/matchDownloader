// content.js (VERSIÓN CON INTEGRACIÓN VISUAL Y ALINEACIÓN FINAL)

// Función auxiliar para obtener la URL de descarga (sin cambios)
function getApiUrl(matchId) {
    return `https://msstats.optimalwayconsulting.com/v1/fcbq/getJsonWithMatchStats/${matchId}?currentSeason=true`;
}

// Función auxiliar para crear el elemento y manejar la lógica de descarga
function createDownloadLink(API_URL) {
    const downloadLink = document.createElement('a');
    
    // Contenido: Usamos el icono de flecha gruesa y larga (↓)
    downloadLink.innerHTML = '&#x25bd;'; 
    
    downloadLink.href = 'javascript:void(0);'; 
    downloadLink.id = 'extension-download-link';
    downloadLink.title = 'DESCARREGAR JSON';

    // Estilos ajustados para alineación vertical (vertical-align y top)
    downloadLink.style.cssText = `
        /* Visibilidad y prioridad */
        display: inline-block !important;
        visibility: visible !important;
        z-index: 99999 !important;
        
        /* Estilos de diseño del icono (Color Turquesa nativo) */
        color: rgb(0, 211, 195); /* Color turquesa */
        font-weight: bold;
        background: transparent;
        font-size: 26px; /* Tamaño similar a los iconos */        
        text-decoration: none;
        cursor: pointer;
        
        /* AJUSTES DE ALINEACIÓN CRÍTICOS */
        line-height: 1; 
        position: relative;
        top: -12px; /* Ajuste fino vertical para centrar el carácter */
        vertical-align: middle !important; /* Fuerza la alineación al centro */
        
        margin-left: 3px; /* Separación del icono anterior */
        margin-right: 0;
    `;
    
    // [Eventos de descarga]
    downloadLink.addEventListener('click', () => {
        downloadLink.innerHTML = '...'; 
        
        chrome.runtime.sendMessage({ action: "startDownload", url: API_URL }, (response) => {
             if (chrome.runtime.lastError || !response || !response.success) {
                 downloadLink.innerHTML = '<span style="color: red;">X</span>'; 
             } else {
                 downloadLink.innerHTML = '<span style="color: rgb(0, 211, 195);">&#10003;</span>'; 
             }
             setTimeout(() => { downloadLink.innerHTML = '&#x25bd;'; }, 3000); 
        });
    });
    
    return downloadLink;
}

function startInjection() {
    const parts = window.location.pathname.split('/');
    const matchId = parts.pop() || parts.pop(); 
    if (!matchId || matchId.length < 10) return;

    const API_URL = getApiUrl(matchId);
    const downloadLink = createDownloadLink(API_URL);

    // BÚSQUEDA DEL CONTENEDOR DE ICONOS SOCIALES (ID que funciona)
    const TARGET_CONTAINER_SELECTOR = '#brand-right'; 
    let targetContainer = document.querySelector(TARGET_CONTAINER_SELECTOR);
    
    if (targetContainer) {
        targetContainer.appendChild(downloadLink);
        console.log('Inyección finalizada con ajustes de alineación.');
        
    } else {
        document.body.prepend(downloadLink);
        console.error('FALLO: El contenedor de iconos sociales (#brand-right) no fue encontrado.');
    }
}

// Ejecución
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startInjection);
} else {
    startInjection();
}