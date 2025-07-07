// Simulerer et server-kald ved at fetche den lokale JSON-fil
async function fetchProfileData() {
    try {
        const response = await fetch('profile.json');
        if (!response.ok) {
            throw new Error('Kunne ikke hente profile.json. Sørg for at filen er uploadet sammen med view.html.');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('profile-container').innerHTML = `<p style="color: red;">${error.message}</p>`;
        return null;
    }
}

// Funktion til at vise profildata på siden
function renderProfile(data) {
    const container = document.getElementById('profile-container');
    
    // Grundlæggende produktinfo
    let html = `
        ${data.product.images.length > 0 ? `<img id="profile-image" src="${data.product.images[0]}" alt="${data.product.title}">` : ''}
        <h1 id="title">${data.product.title}</h1>
        <p id="price">${new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(data.product.price)}</p>
        <p id="description">${data.product.description}</p>
    `;

    // Opgraderingssektion
    html += `
        <div class="section" id="upgrade-section">
            <h3>Abonnement</h3>
            <p>Nuværende niveau: <strong>${data.subscription.tier.toUpperCase()}</strong></p>
            ${getUpgradeButtons(data.subscription.tier)}
        </div>
    `;

    // Historik sektion
     html += `
        <div class="section">
            <h3>Digital Historik</h3>
            <ul>
                ${data.history.map(event => `<li><strong>${new Date(event.timestamp).toLocaleString('da-DK')}:</strong> ${event.description}</li>`).join('')}
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
    setupUpgradeLinks();
}

function getUpgradeButtons(currentTier) {
    // VIGTIGT: Udskift med dine rigtige Stripe Payment Links
    const stripeLinks = {
        passive: "https://buy.stripe.com/test_PASSIV_LINK",
        full: "https://buy.stripe.com/test_FULD_LINK"
    };

    let buttons = '';
    if (currentTier === 'offline') {
        buttons += `<button data-tier="passive" data-url="${stripeLinks.passive}">Opgrader til Passiv Online (5 kr/md)</button>`;
        buttons += `<button data-tier="full" data-url="${stripeLinks.full}">Opgrader til Fuld Adgang (20 kr/md)</button>`;
    } else if (currentTier === 'passive') {
        buttons += `<button data-tier="full" data-url="${stripeLinks.full}">Opgrader til Fuld Adgang (20 kr/md)</button>`;
    }
    return buttons || '<p>Du har fuld adgang.</p>';
}

function setupUpgradeLinks() {
    document.querySelectorAll('#upgrade-section button').forEach(button => {
        button.addEventListener('click', () => {
            const url = button.dataset.url;
            if(url) {
                window.location.href = url;
            }
        });
    });
}

// Funktion til at håndtere ejerskabsverifikation
async function handleOwnership(profileData) {
    const accessToken = localStorage.getItem(`accessToken_${profileData.profileId}`);
    
    // Tjek om brugeren allerede er logget ind via localStorage
    if (accessToken && accessToken === profileData.owner.accessToken) {
        showAdminPanel();
        return;
    }
    
    // Hvis ikke logget ind, og der endnu ikke er sat et accessToken i profilen, vis modal
    if (!profileData.owner.accessToken) {
        showVerificationModal(profileData);
    }
}

function showAdminPanel() {
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('logout-btn').addEventListener('click', () => {
        // I en rigtig app ville man fjerne token fra profile.json via backend-kald.
        // Her fjerner vi det kun fra localStorage for at simulere logout.
        localStorage.removeItem(`accessToken_${window.QRFLOW_PROFILE_ID}`);
        alert('Du er nu logget ud.');
        window.location.reload();
    });
}

function showVerificationModal(profileData) {
    const modal = document.getElementById('verify-modal');
    modal.style.display = 'flex';

    document.getElementById('verify-btn').addEventListener('click', () => {
        const inputEmail = document.getElementById('verify-email').value;

        if (inputEmail.toLowerCase() === profileData.owner.email.toLowerCase()) {
            // Generer et simpelt, men unikt accessToken
            const newAccessToken = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Gem token i localStorage
            localStorage.setItem(`accessToken_${profileData.profileId}`, newAccessToken);
            
            // I en rigtig app ville dette kald opdatere profile.json på serveren.
            // For nu viser vi blot en alert med den data, der SKULLE gemmes.
            alert(`Verifikation succesfuld!\n\nDit nye Access Token er: ${newAccessToken}\n\nDette token ville nu blive gemt i profile.json på serveren for at sikre fremtidig adgang.`);
            
            modal.style.display = 'none';
            showAdminPanel();

        } else {
            alert('Forkert e-mail. Prøv igen.');
        }
    });
}

// Hoved-flow når siden loader
document.addEventListener('DOMContentLoaded', async () => {
    const profileData = await fetchProfileData();
    
    if (profileData) {
        // Valider at profileId i URL/JS-variabel matcher den i JSON-filen
        if(window.QRFLOW_PROFILE_ID !== profileData.profileId) {
            document.getElementById('profile-container').innerHTML = `<p style="color: red;">Fejl: ID-mismatch mellem HTML og JSON-fil.</p>`;
            return;
        }

        renderProfile(profileData);
        handleOwnership(profileData);
    }
});
