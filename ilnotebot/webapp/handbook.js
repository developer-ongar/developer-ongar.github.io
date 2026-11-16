const sectionDetails = {
  analyses: ['Методики анализов', 'Порядок определений, формулы и разбавления', 'Найти методику или показатель'],
  scheme: ['Технологическая схема', 'От исходной воды до распределительной сети', 'Найти этап очистки'],
  terms: ['Справочные материалы', 'Термины, таблицы и перечень стандартов', 'Найти термин или стандарт'],
  station: ['Устройство станции', 'Сооружения, оборудование и реагенты НФС-3', 'Найти сооружение или реагент'],
  control: ['Производственный контроль', 'Точки отбора и определения', 'Найти точку или показатель'],
  note: ['Пояснительная записка', 'Полный текст · 22 раздела', 'Поиск по пояснительной записке'],
};


    let currentMainTab = 'analyses';
    let currentAnalysisFilter = 'all';

    function switchMainTab(tabId, btn) {
      currentMainTab = tabId;
      document.querySelectorAll('.main-tab').forEach(b => { b.classList.remove('active'); b.setAttribute?.('aria-pressed', 'false'); });
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute?.('aria-pressed', 'true');
      document.getElementById('tab-' + tabId).classList.add('active');
      const details = sectionDetails[tabId];
      const title = document.getElementById('sectionTitle');
      const description = document.getElementById('sectionDescription');
      if (title) title.textContent = details[0];
      if (description) description.textContent = details[1];
      document.getElementById('searchInput').placeholder = details[2];

      filterContent();
      document.querySelector?.('.section-heading')?.scrollIntoView?.({ block: 'start' });
    }

    function toggleCard(header) {
      const card = header.parentElement;
      card.classList.toggle('open');
      header.setAttribute('aria-expanded', String(card.classList.contains('open')));
    }

    function filterAnalysisCategory(cat, btn) {
      currentAnalysisFilter = cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');

      filterContent();
    }

    function filterContent() {
      const searchText = document.getElementById('searchInput').value.trim().toLowerCase().replace(/ё/g, 'е');
      const activeTabEl = document.getElementById('tab-' + currentMainTab);
      const cards = activeTabEl.querySelectorAll('.card');

      let matches = 0;
      cards.forEach(card => {
        const textMatch = (card.textContent + ' ' + (card.dataset.keywords || '')).toLowerCase().replace(/ё/g, 'е').includes(searchText);

        if (currentMainTab === 'analyses') {
          const categoryMatch = (currentAnalysisFilter === 'all' || card.dataset.category === currentAnalysisFilter);
          card.style.display = (textMatch && categoryMatch) ? 'block' : 'none';
        } else {
          card.style.display = textMatch ? 'block' : 'none';
        }
        if (card.style.display !== 'none') matches++;
      });
      document.getElementById('searchEmpty').hidden = matches > 0;
    }

function collapseCards() {
  document.getElementById('tab-' + currentMainTab).querySelectorAll('.card.open').forEach(card => {
    card.classList.remove('open');
    card.querySelector('.card-header').setAttribute('aria-expanded', 'false');
  });
}

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = document.getElementById('themeToggle');
  button.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
  button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  button.setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#f5f5f7');
}

function toggleTheme() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('nfs-handbook-theme', theme); } catch (_) { /* Storage may be unavailable inside WebView. */ }
}

let savedTheme = 'light';
try { savedTheme = localStorage.getItem('nfs-handbook-theme') || 'light'; } catch (_) { /* Use the light default. */ }
setTheme(savedTheme);
