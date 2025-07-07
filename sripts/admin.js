document.getElementById('generate-btn').addEventListener('click', () => {
    // 1. Indsaml data fra formular
    const ownerEmail = document.getElementById('owner-email').value;
    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const imageUrl = document.getElementById('image-url').value;

    if (!ownerEmail || !title || !price) {
        alert('Udfyld venligst E-mail, Titel og Pris.');
        return;
    }

    // 2. Generér unikke IDs og metadata
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const creationTimestamp = new Date().toISOString();

    // 3. Opret profile.json dataobjekt
    const profileData = {
        profileId: profileId,
        owner: {
            email: ownerEmail,
            accessToken: null // Sættes ved første login
        },
        product: {
            title: title,
            price: parseFloat(price),
            description: description,
            images: imageUrl ? [imageUrl] : [],
        },
        history: [{
            event: "created",
            timestamp: creationTimestamp,
            description: "Profilen blev oprettet."
        }],
        subscription: {
            tier: "offline", // Starter som 'offline'
            status: "active", // Betalt via engangsbeløb
            stripeCustomerId: null
        },
        tracking: {
            views: 0,
            interests: 0
        }
    };

    // 4. Generér QR-koden og vis den
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = ""; // Ryd tidligere QR-kode
    new QRCode(qrContainer, {
        text: `https://DIT_DOMÆNE_HER/view.html?id=${profileId}`, // VIGTIGT: Udskift med dit domæne
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qr-code-container').style.display = 'block';


    // 5. Generér indholdet til view.html
    const viewHtmlContent = createViewHtml(profileId);
    
    // 6. Generér indholdet til profile.css
    const profileCssContent = createProfileCss();

    // 7. Pak alle filer i en ZIP og start download
    createAndDownloadZip(profileId, profileData, viewHtmlContent, profileCssContent);
});

function createViewHtml(profileId) {
    return `<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vis Profil</title>
    <link rel="stylesheet" href="profile.css">
</head>
<body>
    <div id="profile-container">
        </div>

    <div id="admin-panel" class="admin-panel" style="display: none;">
        <h3>Admin Panel</h3>
        <p>Her kan du administrere din profil.</p>
        <button id="logout-btn">Log ud</button>
    </div>

    <div id="verify-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>Bekræft ejerskab</h3>
            <p>Indtast din e-mail for at få adgang til admin-funktioner.</p>
            <input type="email" id="verify-email" placeholder="Indtast din e-mail">
            <button id="verify-btn">Bekræft</button>
        </div>
    </div>
    
    <script>
        // Gem profileId så profile.js kan finde den
        window.QRFLOW_PROFILE_ID = "${profileId}";
    </script>
    <script src="profile.js"></script>
</body>
</html>`;
}

function createProfileCss() {
    return `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 20px; color: #333; }
#profile-container { max-width: 700px; margin: 0 auto; background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
#profile-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
#title { font-size: 2em; font-weight: bold; color: #000; margin: 0 0 10px 0; }
#price { font-size: 1.5em; color: #007bff; margin-bottom: 20px; }
#description { font-size: 1em; line-height: 1.6; white-space: pre-wrap; }
.section { border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
h3 { margin-top: 0; }
#upgrade-section button { background-color: #28a745; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-right: 10px; }
#upgrade-section button:hover { background-color: #218838; }
.admin-panel { background-color: #fffbe6; border: 1px solid #ffe58f; padding: 20px; margin-top: 20px; border-radius: 8px; }
.modal { position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
.modal-content { background-color: #fff; padding: 30px; border-radius: 8px; text-align: center; width: 90%; max-width: 400px; }
.modal-content input { width: 100%; padding: 10px; margin: 15px 0; box-sizing: border-box; }
.modal-content button { width: 100%; padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
.modal-content button:hover { background-color: #0056b3; }
    `;
}

async function createAndDownloadZip(profileId, profileData, viewHtmlContent, cssContent) {
    const zip = new JSZip();
    zip.file("profile.json", JSON.stringify(profileData, null, 2));
    zip.file("view.html", viewHtmlContent);
    zip.file("profile.css", cssContent);

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${profileId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Fejl ved oprettelse af ZIP-fil:", error);
        alert("Der skete en fejl under oprettelsen af ZIP-filen.");
    }
}
