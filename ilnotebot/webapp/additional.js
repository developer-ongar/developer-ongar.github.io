import { POINTS, FIELDS, REAGENT_GROUPS, availablePoints, validContext, normalizeNumber, createPayload } from './additional-core.js';

const params = new URLSearchParams(location.search);
const context = Object.fromEntries(['batch', 'block', 'date', 'time', 'mode'].map(key => [key, params.get(key) || '']));
context.mode ||= 'water';
const reagentMode = context.mode === 'reagents';
document.querySelector('.water-section').hidden = reagentMode;
document.querySelector('.reagents').hidden = !reagentMode;
document.getElementById('context-block').hidden = reagentMode;
if (reagentMode) {
    document.querySelector('h1').textContent = 'ОХА, ГПХН, соль и вода';
    document.querySelector('.subtitle').textContent = 'Дополнительный анализ реагентов';
}
const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg?.platform && tg.platform !== 'unknown');
const storageKey = `additional:v3:${context.batch}:${context.mode}:${context.block}`;
const selected = {};
const reagentInputs = {};
for (const group of REAGENT_GROUPS) {
    const card = document.createElement('article'); card.className = 'card';
    const title = document.createElement('h3'); title.textContent = group.title;
    const grid = document.createElement('div'); grid.className = 'field-grid';
    for (const [key, name] of group.fields) {
        const label = document.createElement('label'); label.textContent = name;
        const input = document.createElement('input');
        input.id = key; input.name = key; input.type = 'text'; input.inputMode = 'decimal';
        input.maxLength = 17; input.placeholder = 'Не определено'; input.autocomplete = 'off';
        reagentInputs[key] = input; label.append(input); grid.append(label);
    }
    card.append(title, grid); document.getElementById('reagent-groups').append(card);
}

const select = document.getElementById('point-select');
const addButton = document.getElementById('add-point');
const submitButton = document.getElementById('submit');
const formError = document.getElementById('form-error');
let sending = false;

document.getElementById('context-date').textContent = context.date || 'Дата не выбрана';
document.getElementById('context-time').textContent = context.time || 'Время не выбрано';
document.getElementById('context-block').textContent = context.block || 'Блок не выбран';
const notice = document.getElementById('session-notice');
if (!validContext(context) || !inTelegram) {
    notice.hidden = false;
    notice.textContent = 'Для сохранения откройте «Заполнить дополнительный анализ» в боте, укажите время и выберите нужный вид анализа.';
}
if (tg) {
    tg.ready();
    tg.expand();
    tg.MainButton.setText('Сохранить данные');
    tg.MainButton.hide();
    tg.onEvent('mainButtonClicked', submit);
}
function reagents() { return Object.fromEntries(Object.entries(reagentInputs).map(([key, input]) => [key, input.value])); }
function persistDraft() {
    if (!validContext(context)) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ selected, reagents: reagents() })); } catch { /* Storage can be disabled in Telegram. */ }
}
function refresh() {
    const hasValues = Object.values(reagents()).some(value => value.trim()) ||
        Object.values(selected).some(values => Object.values(values).some(value => value.trim()));
    submitButton.disabled = sending || !hasValues || !validContext(context) || !inTelegram;
    const count = Object.keys(selected).length;
    document.getElementById('point-count').textContent = `${count} ${count === 1 ? 'точка' : count > 1 && count < 5 ? 'точки' : 'точек'}`;
    document.getElementById('empty-state').hidden = count > 0;
    if (tg) {
        if (inTelegram && validContext(context) && hasValues && !sending) tg.MainButton.show();
        else tg.MainButton.hide();
    }
    persistDraft();
}
function refreshOptions() {
    select.replaceChildren(new Option('Выберите место отбора', ''));
    for (const { name, index } of availablePoints(context.block)) {
        if (!(index in selected)) select.add(new Option(name, String(index)));
    }
    addButton.disabled = true;
}
function addPoint(index, restored = {}) {
    if (index in selected || !availablePoints(context.block).some(point => point.index === index)) return;
    selected[index] = Object.fromEntries(FIELDS.map(([field]) => [field, String(restored[field] ?? '')]));
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.point = String(index);
    const heading = document.createElement('div');
    heading.className = 'point-header';
    const title = document.createElement('h3');
    title.className = 'point-title';
    title.textContent = POINTS[index];
    title.style.margin = '0';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove-button'; remove.textContent = 'Убрать';
    remove.setAttribute('aria-label', `Убрать ${POINTS[index]}`);
    remove.addEventListener('click', () => { delete selected[index]; card.remove(); refreshOptions(); refresh(); });
    heading.append(title, remove);
    const grid = document.createElement('div'); grid.className = 'field-grid';
    for (const [field, name] of FIELDS) {
        const label = document.createElement('label'); label.textContent = name;
        const input = document.createElement('input');
        input.type = 'text'; input.inputMode = 'decimal'; input.maxLength = 17; input.autocomplete = 'off';
        input.placeholder = 'Не измерено'; input.value = selected[index][field];
        input.id = `point-${index}-${field}`;
        input.addEventListener('input', () => { selected[index][field] = input.value; validateInput(input); refresh(); });
        label.append(input); grid.append(label);
    }
    card.append(heading, grid); document.getElementById('points').append(card);
    refreshOptions(); refresh();
}
function validateInput(input) {
    try { normalizeNumber(input.value); input.removeAttribute('aria-invalid'); return true; }
    catch { input.setAttribute('aria-invalid', 'true'); return false; }
}
function submit(event) {
    event?.preventDefault();
    if (sending) return;
    formError.hidden = true;
    try {
        const invalid = [...document.querySelectorAll('input')].find(input => !validateInput(input));
        if (invalid) { invalid.focus(); throw new Error('Проверьте выделенное поле. Введите число, например 10 или 9,7.'); }
        const payload = createPayload(context, selected, reagents());
        if (!inTelegram) throw new Error('Для сохранения откройте эту форму из кнопки в боте.');
        sending = true; persistDraft(); refresh();
        submitButton.textContent = 'Отправляем…';
        tg.sendData(payload);
    } catch (error) {
        sending = false; refresh(); submitButton.textContent = 'Сохранить данные';
        formError.textContent = error.message; formError.hidden = false;
    }
}
select.addEventListener('change', () => { addButton.disabled = select.value === ''; });
addButton.addEventListener('click', () => { if (select.value !== '') addPoint(Number(select.value)); });
for (const input of Object.values(reagentInputs)) {
    input.addEventListener('input', () => { validateInput(input); refresh(); });
}
document.getElementById('analysis-form').addEventListener('submit', submit);
refreshOptions();
if (validContext(context)) {
    try {
        const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (draft) {
            for (const [key, input] of Object.entries(reagentInputs)) input.value = String(draft.reagents?.[key] ?? '');
            for (const [index, values] of Object.entries(draft.selected || {})) addPoint(Number(index), values);
        }
    } catch { /* A broken draft must not prevent opening the form. */ }
}
refresh();
