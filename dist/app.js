import {
  normalize, offsetLabel, clockParts,
  parseServer, TimeSource, isSupportedZone
} from './core.js';

const $ = id => document.getElementById(id);
const source = new TimeSource();
const hands = [...document.querySelectorAll('.hand')];

let cities = [];
let cityMap = new Map();
let cards = [];
let citiesReady = false;
let citiesLoading = false;
let busy = false;
let nextAttempt = -Infinity;
let failures = 0;
let syncError = '';
let searchTimer;

const settings = {
  hour12: false,
  theme: 'dark',
  clocks: [{offset: -300}, {offset: 60}, {offset: 345}]
};

function readStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

const data = readStored('vilagora-v2') || readStored('vilagora-v1');

if (data && typeof data === 'object') {
  settings.hour12 = data.hour12 === true;
  settings.theme = data.theme === 'light' ? 'light' : 'dark';

  if (Array.isArray(data.clocks)) {
    settings.clocks = data.clocks;
  } else if (Array.isArray(data.offsets)) {
    settings.clocks = data.offsets.map(offset => ({offset}));
  }
}

const seen = new Set();

settings.clocks = settings.clocks.flatMap(clock => {
  if (!clock || typeof clock !== 'object') return [];

  let clean;
  let key;

  if (typeof clock.id === 'string' && clock.id.trim()) {
    clean = {id: clock.id};
    key = 'city:' + clock.id;
  } else if (
    Number.isInteger(clock.offset) &&
    clock.offset >= -720 &&
    clock.offset <= 840
  ) {
    clean = {offset: clock.offset};
    key = 'offset:' + clock.offset;
  } else {
    return [];
  }

  if (seen.has(key)) return [];
  seen.add(key);
  return [clean];
}).slice(0, 100);

function save() {
  try {
    localStorage.setItem('vilagora-v2', JSON.stringify(settings));
  } catch {
    $('status').textContent = 'A beállítások tárolása nem érhető el.';
  }
}

function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

function button(text, label, action) {
  const node = element('button', text);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.onclick = action;
  return node;
}

function render() {
  const fragment = document.createDocumentFragment();
  cards = [];

  settings.clocks.forEach((stored, index) => {
    const city = stored.id ? cityMap.get(stored.id) : null;
    const unavailable = Boolean(stored.id && !city);
    const title = city
      ? city.name
      : stored.id
        ? 'Mentett városóra'
        : offsetLabel(stored.offset);

    const card = element('article', undefined, 'card');
    card.append(element('h3', title));

    if (city) {
      card.append(element(
        'div',
        [city.country, city.region, city.zone].filter(Boolean).join(' · '),
        'meta'
      ));
    }

    if (unavailable) {
      card.append(element(
        'p',
        citiesReady
          ? 'Ez a város ezen a böngészőn vagy ebben az adatállományban nem érhető el. A mentését megőriztük.'
          : 'A városóra megjelenítéséhez be kell tölteni a városadatokat.',
        'meta'
      ));
    } else {
      const reading = element('div', undefined, 'reading');
      const time = element('span');
      const period = element('small');
      const date = element('div', undefined, 'date');
      const meta = element('div', undefined, 'meta');

      reading.append(time, period);
      card.append(reading, date, meta);
      cards.push({clock: city || stored, time, period, date, meta});
    }

    const actions = element('div', undefined, 'actions');

    for (const direction of [-1, 1]) {
      const move = button(
        direction < 0 ? '↑' : '↓',
        title + (direction < 0 ? ' előrébb' : ' hátrébb'),
        () => {
          const next = index + direction;
          if (next < 0 || next >= settings.clocks.length) return;

          [settings.clocks[index], settings.clocks[next]] =
            [settings.clocks[next], settings.clocks[index]];

          save();
          render();
          $('grid').children[next]?.querySelector('button')?.focus();
        }
      );

      move.disabled =
        index + direction < 0 ||
        index + direction >= settings.clocks.length;

      actions.append(move);
    }

    actions.append(button('×', title + ' eltávolítása', () => {
      settings.clocks.splice(index, 1);
      save();
      render();
      $('city').focus();
    }));

    card.append(actions);
    fragment.append(card);
  });

  $('grid').replaceChildren(fragment);
  $('empty').hidden = settings.clocks.length > 0;
  tick();
}

function tick() {
  const now = source.now();
  const utc = {
    clock: {offset: 0},
    time: $('utc-clock'),
    period: $('utc-period'),
    date: $('utc-date')
  };

  for (const view of [utc, ...cards]) {
    const parts = clockParts(now, view.clock, settings.hour12);
    view.time.textContent = parts.time;
    view.period.textContent = parts.period;
    view.date.textContent = parts.date;

    if (view.meta) {
      view.meta.textContent = offsetLabel(parts.offset) +
        (view.clock.zone
          ? ' · automatikus időzóna'
          : ' · rögzített eltolás');
    }
  }

  const date = new Date(now);
  const angles = [
    date.getUTCHours() % 12 * 30 + date.getUTCMinutes() / 2,
    date.getUTCMinutes() * 6,
    date.getUTCSeconds() * 6
  ];

  angles.forEach((angle, index) => {
    hands[index]?.style.setProperty('--angle', angle + 'deg');
  });

  let label = source.synced
    ? navigator.onLine
      ? 'Interneten szinkronizált időből becsült idő'
      : 'Offline – korábbi szinkronizálásból becsült idő'
    : 'Készülék rendszerideje';

  if (busy) label = 'Szinkronizálás folyamatban · ' + label;
  if (syncError) label += ' · ' + syncError;

  if (source.last !== null) {
    label += ' · Utolsó sikeres szinkronizálás ' +
      new Date(source.last).toISOString().replace('T', ' ').slice(0, 19) +
      ' UTC';
  }

  $('source').textContent = label;
  $('sync').disabled = busy;
}

function preferences() {
  document.documentElement.dataset.theme = settings.theme;
  $('h12').setAttribute('aria-pressed', String(settings.hour12));
  $('h24').setAttribute('aria-pressed', String(!settings.hour12));

  const label = settings.theme === 'dark' ? 'Világos téma' : 'Sötét téma';
  $('theme').textContent = settings.theme === 'dark' ? '☀' : '☾';
  $('theme').setAttribute('aria-label', label);
  $('theme').title = label;
  tick();
}

for (const value of [true, false]) {
  $(value ? 'h12' : 'h24').onclick = () => {
    settings.hour12 = value;
    save();
    preferences();
  };
}

$('theme').onclick = () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  save();
  preferences();
};

for (let offset = -720; offset <= 840; offset += 15) {
  $('offset').add(new Option(offsetLabel(offset), String(offset)));
}
$('offset').value = '330';

function add(clock) {
  const duplicate = settings.clocks.some(
    current => clock.id
      ? current.id === clock.id
      : !current.id && current.offset === clock.offset
  );

  if (duplicate) {
    $('status').textContent = 'Ez az óra már szerepel a listában.';
    return;
  }

  if (settings.clocks.length >= 100) {
    $('status').textContent = 'Legfeljebb 100 óra adható hozzá.';
    return;
  }

  settings.clocks.push(clock);
  save();
  render();
}

$('add-form').onsubmit = event => {
  event.preventDefault();
  const offset = Number($('offset').value);
  if (Number.isInteger(offset) && offset >= -720 && offset <= 840) {
    add({offset});
  }
};

function searchCities() {
  $('results').replaceChildren();
  const query = normalize($('city').value.trim());

  if (!citiesReady || query.length < 2) return;

  const fragment = document.createDocumentFragment();
  let count = 0;

  for (const city of cities) {
    if (!city.search.includes(query)) continue;

    fragment.append(button(
      [city.name, city.country, city.region, city.zone]
        .filter(Boolean).join(' · '),
      'Hozzáadás: ' + city.name,
      () => {
        add({id: city.id});
        clearTimeout(searchTimer);
        $('results').replaceChildren();
        $('city').value = '';
        $('city').focus();
      }
    ));

    count++;
    if (count === 30) break;
  }

  if (!count) fragment.append(element('p', 'Nincs találat.'));
  $('results').append(fragment);
}

$('city').oninput = () => {
  clearTimeout(searchTimer);
  $('results').replaceChildren();
  searchTimer = setTimeout(searchCities, 120);
};

const yieldToBrowser = () =>
  new Promise(resolve => setTimeout(resolve, 0));

async function loadCities() {
  if (citiesLoading || citiesReady) return;
  citiesLoading = true;
  $('results').textContent = 'Városadatok betöltése…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('./cities.json', {
      signal: controller.signal,
      credentials: 'same-origin'
    });

    if (!response.ok) throw new Error('Városadatok HTTP-hiba');
    const data = await response.json();
    clearTimeout(timeout);

    if (!Array.isArray(data)) throw new Error('Hibás városadatok');

    const loaded = [];
    const mapped = new Map();

    for (let start = 0; start < data.length; start += 400) {
      const end = Math.min(start + 400, data.length);

      for (let i = start; i < end; i++) {
        const raw = data[i];

        if (
          !raw ||
          typeof raw !== 'object' ||
          !['string', 'number'].includes(typeof raw.id) ||
          typeof raw.name !== 'string' ||
          !raw.name.trim() ||
          !isSupportedZone(raw.zone)
        ) continue;

        const id = String(raw.id);
        if (!id || mapped.has(id)) continue;

        const aliases = Array.isArray(raw.aliases)
          ? raw.aliases.filter(value => typeof value === 'string').join(' ')
          : typeof raw.aliases === 'string' ? raw.aliases : '';

        const city = {
          id,
          name: raw.name,
          country: typeof raw.country === 'string' ? raw.country : '',
          region: typeof raw.region === 'string' ? raw.region : '',
          zone: raw.zone
        };

        city.search = normalize(
          [city.name, aliases, city.country, city.region].join(' ')
        );

        loaded.push(city);
        mapped.set(id, city);
      }

      await yieldToBrowser();
    }

    if (!loaded.length) throw new Error('Nincsenek használható városadatok');

    cities = loaded;
    cityMap = mapped;
    citiesReady = true;

    // Hiányzó városok miatt nem módosítjuk a mentett órákat.
    render();
    searchCities();
  } catch {
    $('results').replaceChildren(
      element('p', 'A városadatok betöltése sikertelen.'),
      button('Újrapróbálás', 'Városadatok újratöltése', loadCities)
    );
  } finally {
    clearTimeout(timeout);
    citiesLoading = false;
  }
}

// A Retry-After fejléc csak akkor olvasható, ha a szolgáltató
// böngészőből hozzáférhetővé teszi a CORS-beállításaiban.
function retryDelay(response) {
  const value = response.headers.get('Retry-After');
  if (!value) return 0;

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const delay = Number(trimmed) * 1000;
    return Number.isFinite(delay) ? delay : 0;
  }

  const date = Date.parse(trimmed);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

async function sync(manual = false) {
  if (busy) return;

  if (!navigator.onLine) {
    if (manual) $('status').textContent = 'Offline állapotban nincs időszinkronizálás.';
    tick();
    return;
  }

  const now = performance.now();

  if (now < nextAttempt) {
    if (manual) {
      $('status').textContent =
        'Újabb szinkronizálás ' +
        Math.ceil((nextAttempt - now) / 1000) +
        ' másodperc múlva kérhető.';
    }
    return;
  }

  busy = true;
  nextAttempt = now + 60000;
  tick();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const start = performance.now();
  let serverDelay = 0;

  try {
    const response = await fetch(
      'https://timeapi.io/api/time/current/zone?timeZone=UTC',
      {
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      }
    );

    if (response.status === 429 || response.status === 503) {
      serverDelay = retryDelay(response);
    }

    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? 'A szolgáltató korlátozza a kéréseket'
          : `Időszolgáltatási hiba (HTTP ${response.status})`
      );
    }

    const epoch = parseServer(await response.json());
    const latency = performance.now() - start;

    if (latency > 4000) throw new Error('Túl nagy hálózati késleltetés');

    source.accept(epoch, latency);
    failures = 0;
    syncError = '';
    if (manual) $('status').textContent = 'Az időszinkronizálás sikerült.';
  } catch (error) {
    failures = Math.min(failures + 1, 5);
    const backoff = Math.min(15 * 60000, 60000 * 2 ** (failures - 1));

    nextAttempt = Math.max(
      nextAttempt,
      performance.now() + Math.max(backoff, serverDelay)
    );

    syncError = error.name === 'AbortError'
      ? 'A szinkronizálás túllépte az időkorlátot'
      : error instanceof TypeError
        ? 'Hálózati vagy hozzáférési hiba'
        : error.message || 'Szinkronizálási hiba';

    if (manual) $('status').textContent = syncError;
  } finally {
    clearTimeout(timeout);
    busy = false;
    tick();
  }
}

$('sync').onclick = () => sync(true);

window.addEventListener('online', () => {
  tick();
  sync();
  if (!citiesReady) loadCities();
});

window.addEventListener('offline', tick);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    tick();
    sync();
  }
});

setInterval(() => {
  if (!document.hidden) tick();
}, 1000);

setInterval(() => {
  if (!document.hidden) sync();
}, 15 * 60 * 1000);

preferences();
render();
sync();
loadCities();

if ('serviceWorker' in navigator) {
  let updateRequested = false;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Első telepítéskor nincs szükség automatikus újratöltésre.
    if (updateRequested && !reloading) {
      reloading = true;
      location.reload();
    }
  });

  navigator.serviceWorker.register('./sw.js', {
    updateViaCache: 'none'
  }).then(registration => {
    function showWaiting() {
      $('update').hidden = !registration.waiting;
    }

    function watchInstalling() {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        showWaiting();
        if (worker.state === 'redundant') {
          $('offline').textContent =
            'Az offline telepítés vagy frissítés nem sikerült.';
        }
      });
    }

    showWaiting();
    watchInstalling();
    registration.addEventListener('updatefound', watchInstalling);

    $('update').onclick = () => {
      if (!registration.waiting) return;
      updateRequested = true;
      registration.waiting.postMessage('ACTIVATE');
    };

    navigator.serviceWorker.ready.then(() => {
      $('offline').textContent =
        'Offline fájlok előkészítve. A böngésző később törölheti a gyorsítótárat.';
    });
  }).catch(() => {
    $('offline').textContent =
      'Az offline előkészítés sikertelen. HTTPS vagy localhost szükséges.';
  });
} else {
  $('offline').textContent =
    'Ez a böngésző nem támogatja az offline telepítést.';
}