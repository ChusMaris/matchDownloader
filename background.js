// background.js (NUEVO CÓDIGO: Responde al mensaje del botón)

function blobToDataURL(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.readAsDataURL(blob);
    });
}

// ELIMINAMOS EL WEB REQUEST LISTENER. Ahora escuchamos mensajes.
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        
        // Solo procedemos si el content script nos pide iniciar la descarga y nos pasa la URL
        if (request.action === "startDownload" && request.url) {
            
            console.log("Mensaje de botón recibido. Descargando de:", request.url);
            
            // Usamos la URL que nos envió el content.js
            fetch(request.url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Respuesta de red no satisfactoria, estado: ${response.status}`);
                    }
                    return response.json(); 
                })
                .then(async (data) => {
                    
                    const jsonString = JSON.stringify(data, null, 2); 
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const dataUrl = await blobToDataURL(blob); 
                    
                    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                    // Nombre sugerido en el diálogo
                    const suggestedFilename = `datos-partido-${timestamp}.json`;
                    
                    chrome.downloads.download({
                        url: dataUrl, 
                        filename: suggestedFilename,
                        saveAs: true // Mantiene el diálogo de Guardar como...
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error al iniciar la descarga:", chrome.runtime.lastError.message);
                            sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        } else {
                            console.log(`Diálogo de Guardar como... abierto. ID: ${downloadId}`);
                            sendResponse({ success: true }); // Enviamos la respuesta de éxito al Content Script
                        }
                    });
                })
                .catch(error => {
                    console.error("Error al procesar o descargar JSON:", error);
                    sendResponse({ success: false, error: error.message });
                });
            
            // Indicamos que sendResponse será llamado de forma asíncrona.
            return true; 
        }
    }
);