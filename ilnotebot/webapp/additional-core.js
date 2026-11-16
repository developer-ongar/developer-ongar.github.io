export const POINTS = [
    'Насос 1', 'Насос 2', 'Насос 3', 'Насос 4', 'Насос 5', 'Насос 6',
    'УФО 1', 'УФО 2', 'КЧВ', 'КФВ', 'Общий коллектор', 'После смесителя',
    'Исх. вода', 'Фильтр 1', 'Фильтр 2', 'Фильтр 3', 'Фильтр 4', 'Фильтр 5',
    'Фильтр 6', 'Фильтр 7', 'Фильтр 8', 'Фильтр 9', 'Фильтр 10', 'Фильтр 11',
    'Фильтр 12', 'Оборотная вода',
];
export const FIELDS = [
    ['chlorine', 'Хлор'], ['turbidity', 'Мутность'], ['ph', 'pH'],
    ['alkalinity', 'Щелочность'], ['aluminum', 'Остаточный алюминий'],
    ['oxidizability', 'Перманганатная окисляемость'],
];
export const OXA_FIELDS = [
    ['al2o3', 'Массовая доля основного вещества (Al₂O₃), %'],
    ['iron', 'Массовая доля железа, %'],
    ['chlorides', 'Массовая доля хлоридов, %'],
    ['basicity', 'Основность, %'],
    ['density', 'Плотность, г/см³'],
    ['ph', 'pH'],
];
export const REAGENT_GROUPS = [
    ...[1, 2].map(number => ({ title: `ОХА ${number}`, fields: OXA_FIELDS.map(([key, label]) => [`oxa${number}_${key}`, label]) })),
    { title: 'ГПХН', fields: [['gphn', 'Активность хлора']] },
    { title: 'Пищевая соль', fields: [['salt_chloride', 'Массовая доля хлор-иона']] },
    { title: 'Вода', fields: [['water_active_chlorine', 'Содержание остаточного активного хлора']] },
];
export const REAGENT_KEYS = REAGENT_GROUPS.flatMap(group => group.fields.map(([key]) => key));
export function normalizeNumber(value) {
    const text = String(value ?? '').trim().replace(',', '.');
    if (text && !/^\d{1,10}(?:\.\d{1,6})?$/.test(text)) {
        throw new Error('Введите число, например 10 или 9,7.');
    }
    return text;
}
export function availablePoints(block) {
    return POINTS.map((name, index) => ({ name, index })).filter(({ name }) => {
        if (name.startsWith('Насос')) return block === 'БВО-1';
        if (name.startsWith('Фильтр')) return block !== 'БВО-1' || Number(name.split(' ')[1]) <= 8;
        return true;
    });
}
export function validContext(context) {
    return /^[a-f0-9]{32}$/.test(context.batch || '') &&
        ((context.mode || 'water') === 'reagents' ? !context.block : ['БВО-1', 'БВО-2'].includes(context.block)) &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(context.time || '') &&
        /^\d{2}\.\d{2}\.\d{4}$/.test(context.date || '');
}
export function createPayload(context, selected, reagents) {
    if (!validContext(context)) throw new Error('Откройте дополнительный анализ из кнопки в боте.');
    const mode = context.mode || 'water';
    if (!['water', 'reagents'].includes(mode)) throw new Error('Неизвестный вид анализа.');
    if (mode === 'reagents' && Object.keys(selected).length) throw new Error('ОХА, ГПХН, соль и вода заполняются отдельно от точек отбора.');
    const allowed = new Set(availablePoints(context.block).map(({ index }) => index));
    const measurements = Object.entries(selected).map(([index, values]) => {
        const pointIndex = Number(index);
        if (!Number.isInteger(pointIndex) || !allowed.has(pointIndex)) throw new Error('Неизвестная точка отбора.');
        return [pointIndex, ...FIELDS.map(([field]) => normalizeNumber(values[field]))];
    }).filter(row => row.slice(1).some(Boolean));
    const reagentValues = Object.fromEntries(REAGENT_KEYS.map(key => [key, normalizeNumber(reagents[key])]));
    if (mode === 'water' && Object.values(reagentValues).some(Boolean)) throw new Error('Для ОХА и ГПХН откройте отдельный анализ.');
    if (!measurements.length && !Object.values(reagentValues).some(Boolean)) {
        throw new Error('Заполните хотя бы один результат в выбранной форме.');
    }
    const payload = { type: 'additional_analysis', version: 1, ...context, mode, measurements, reagents: reagentValues };
    const serialized = JSON.stringify(payload);
    if (new TextEncoder().encode(serialized).length > 4096) {
        throw new Error('Слишком много данных для одной отправки. Сохраните часть точек, затем заполните остальные в этом же анализе.');
    }
    return serialized;
}
