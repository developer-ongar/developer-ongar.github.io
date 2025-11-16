const input = document.getElementById("formulaInput");
const img = document.getElementById("molImage");
const statusBox = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");
const searchBtn = document.getElementById("searchBtn");

function setStatus(text) {
    if(statusBox) statusBox.innerText = text;
}

function savePNG(blob){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "molecule.png";
    a.click();
}

async function tryFetchPNG(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("PNG not found");
    return res.blob();
}

async function getCIDbyName(query) {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`;
    const res = await fetch(url);
    const json = await res.json();
    return json?.IdentifierList?.CID?.[0];
}

async function runSearch() {
    const q = input.value.trim();
    if (!q) return;

    img.style.opacity = 0;
    downloadBtn.classList.add("hidden");
    setStatus("Загрузка...");

    try {
        
        try {
            const url1 = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/PNG`;
            const blob = await tryFetchPNG(url1);
            img.src = URL.createObjectURL(blob);
            img.onload = () => img.style.opacity = 1;
            downloadBtn.onclick = () => savePNG(blob);
            downloadBtn.classList.remove("hidden"); 
            return;
        } catch {}

        
        const cid = await getCIDbyName(q);
        if (!cid) throw new Error("not-found");

        const url2 = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`;
        const blob = await tryFetchPNG(url2);

        img.src = URL.createObjectURL(blob);
        img.onload = () => img.style.opacity = 1;
        downloadBtn.onclick = () => savePNG(blob);
        downloadBtn.classList.remove("hidden");
        setStatus("Найдено");

    } catch {
        img.src = "";
        downloadBtn.classList.add("hidden");
        setStatus("Не найдено");
        alert("Структура не найдена.");
    }
}

// Смена темы
function applyTheme(theme){
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

function toggleTheme(){
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
}

// Применяем сохранённую тему
(function(){
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);
})();

/* Desktop: Enter */
input.addEventListener("keyup", (e) => {
    if(e.key === "Enter") runSearch();
});

/* Mobile / кнопка */
searchBtn.addEventListener("click", runSearch);
