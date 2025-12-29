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
    async (request, sender, sendResponse) => {
        
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
        } else if (request.action === "startMultipleDownloads" && request.urls && Array.isArray(request.urls)) {
            console.log("Mensaje de botón recibido. Descargando múltiples archivos de:", request.urls);

            const results = [];
            for (const url of request.urls) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Respuesta de red no satisfactoria para ${url}, estado: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    const jsonString = JSON.stringify(data, null, 2); 
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const dataUrl = await blobToDataURL(blob); 
                    
                    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                    let filenamePrefix = "datos";
                    if (url.includes("getJsonWithMatchStats")) {
                        filenamePrefix = "J_P_0_0.json";
                    } else if (url.includes("getJsonWithMatchMoves")) {
                        filenamePrefix = "J_P_Moves.json";
                    }
                    const suggestedFilename = `${filenamePrefix}`;
                    
                    await new Promise((resolve, reject) => {
                        chrome.downloads.download({
                            url: dataUrl, 
                            filename: suggestedFilename,
                            saveAs: true 
                        }, (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error(`Error al iniciar la descarga de ${url}:`, chrome.runtime.lastError.message);
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                console.log(`Diálogo de Guardar como... abierto para ${url}. ID: ${downloadId}`);
                                resolve();
                            }
                        });
                    });
                    results.push({ success: true, url: url });

                } catch (error) {
                    console.error(`Error al procesar o descargar JSON de ${url}:`, error);
                    results.push({ success: false, url: url, error: error.message });
                    // If one download fails, we can choose to stop or continue.
                    // For now, let's continue to attempt other downloads.
                }
            }
            const allSuccess = results.every(res => res.success);
            sendResponse({ success: allSuccess, results: results });
            
            return true;
        }
    }
);