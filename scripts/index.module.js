const currencyInput = document.querySelector('[name="currency"]');
const status = document.querySelector('#status');
const fetchButton = document.querySelector('#fetch-button');
const saveButton = document.querySelector('#save-button');

chrome.storage.local.get(['lari_in_dollar']).then(({ lari_in_dollar }) => {
    if(lari_in_dollar) {
        currencyInput.value = lari_in_dollar;
    }
}).catch(error => {
    status.textContent = `Could not load saved rate: ${error.message}`;
});

fetchButton.addEventListener('click', async () => {
    fetchButton.disabled = true;
    status.textContent = 'Fetching rate...';
    try {
        const response = await fetch('https://api.businessonline.ge/api/rates/commercial/usd');
        if(!response.ok) {
            throw new Error(`API request failed (${response.status})`);
        }
        const data = await response.json();
        const sell = Number(data.Sell);
        if(!Number.isFinite(sell) || sell <= 0) {
            throw new Error('API returned an invalid Sell rate');
        }
        currencyInput.value = data.Sell;
        status.textContent = 'Rate updated. Save to apply it.';
    } catch(error) {
        status.textContent = `Could not fetch rate: ${error.message}`;
    } finally {
        fetchButton.disabled = false;
    }
});

function notifyActiveTab(rate) {
    return new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if(!tabs[0] || tabs[0].id === undefined) {
                resolve();
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { greeting: rate }, () => {
                void chrome.runtime.lastError;
                resolve();
            });
        });
    });
}

saveButton.addEventListener('click', async () => {
    const rate = Number(currencyInput.value);
    if(!Number.isFinite(rate) || rate <= 0) {
        status.textContent = 'Fetch a valid rate before saving.';
        return;
    }

    saveButton.disabled = true;
    try {
        const value = String(rate);
        await chrome.storage.local.set({ lari_in_dollar: value });
        await notifyActiveTab(value);
        window.close();
    } catch(error) {
        status.textContent = `Could not save rate: ${error.message}`;
        saveButton.disabled = false;
    }
});
