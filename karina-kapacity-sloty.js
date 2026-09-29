(async () => {
  'use strict';

  const ID = 'carina-skolni-prehled-v2';
  document.getElementById(ID)?.remove();
  document.getElementById(ID + '-css')?.remove();

  const now = new Date();
  const month = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const startMonth = month(now);
  const endMonth = month(
    new Date(now.getFullYear(), now.getMonth() + 4, 1)
  );

  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).getTime();

  const groupURLs = [
    'https://raw.githubusercontent.com/PetrKrata/carina-kapacity/main/porady-skupiny.json',
    'https://petrkrata.github.io/carina-kapacity/porady-skupiny.json'
  ];

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c]
    );

  const dateNumber = value => {
    const [d, m, y] = value.split('.').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const weekday = value =>
    new Date(dateNumber(value)).getDay();

  const dayNames = [
    'ne', 'po', 'út', 'st', 'čt', 'pá', 'so'
  ];

  const minute = value => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };

  const time = column => {
    const n = 480 + (column - 2) * 15;

    return (
      String(Math.floor(n / 60)).padStart(2, '0') +
      ':' +
      String(n % 60).padStart(2, '0')
    );
  };

  const row = el =>
    parseInt(
      el.style.gridRowStart ||
      el.style.gridRow ||
      el.style.gridArea,
      10
    );

  const cols = el => {
    const raw = el.style.gridColumn || '';

    return [
      parseInt(
        el.style.gridColumnStart || raw.split('/')[0],
        10
      ),
      parseInt(
        el.style.gridColumnEnd || raw.split('/')[1],
        10
      )
    ];
  };

  let resource =
    new URL(location.href).searchParams.get('resource');

  if (!resource) {
    for (const a of document.querySelectorAll('a[href]')) {
      try {
        resource =
          new URL(a.href).searchParams.get('resource');
      } catch (_) {}

      if (resource) break;
    }
  }

  resource ||=
    document.querySelector('[name="resource"]')?.value ||
    document.querySelector('[data-resource]')?.dataset.resource ||
    localStorage.getItem('carina-skolni-prehled-resource');

  if (!resource) {
    alert('Spusť skript z měsíčního kalendáře Cariny.');
    return;
  }

  localStorage.setItem(
    'carina-skolni-prehled-resource',
    resource
  );

  const css = document.createElement('style');
  css.id = ID + '-css';

  css.textContent = `
    #${ID} {
      position: fixed;
      z-index: 999999;
      inset: 20px auto auto 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      max-width: 1250px;
      max-height: calc(100vh - 40px);
      overflow: auto;
      background: white;
      color: #222;
      border: 1px solid #aaa;
      border-radius: 10px;
      box-shadow: 0 8px 35px #0005;
      font: 14px Arial, Helvetica, sans-serif;
    }

    #${ID} * {
      box-sizing: border-box;
    }

    #${ID} .head {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 12px 16px;
      background: #20242a;
      color: white;
    }

    #${ID} h2 {
      margin: 0 auto 0 0;
      font-size: 18px;
    }

    #${ID} .toggle {
      flex: 0 0 220px;
      width: 220px;
      height: 38px;
      border: 0;
      border-radius: 5px;
      background: #277447;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    #${ID} .toggle:disabled {
      opacity: .55;
      cursor: default;
    }

    #${ID} .close {
      border: 0;
      background: none;
      color: white;
      font-size: 25px;
      cursor: pointer;
    }

    #${ID} .body {
      padding: 15px;
    }

    #${ID} .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 18px;
      padding: 15px;
      margin-bottom: 15px;
      background: #f3f4f6;
      border-radius: 8px;
    }

    #${ID} label {
      font-weight: 600;
    }

    #${ID} input,
    #${ID} select,
    #${ID} button {
      font: inherit;
    }

    #${ID} input[type=month],
    #${ID} input[type=number],
    #${ID} select {
      padding: 6px 8px;
      border: 1px solid #aaa;
      border-radius: 5px;
      background: white;
    }

    #${ID} input[type=number] {
      width: 75px;
    }

    #${ID} .search {
      padding: 8px 15px;
      border: 0;
      border-radius: 5px;
      background: #1d5fa7;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    #${ID} .search:disabled {
      opacity: .6;
      cursor: wait;
    }

    #${ID} .break {
      flex-basis: 100%;
      height: 0;
    }

    #${ID} details {
      position: relative;
    }

    #${ID} summary {
      min-width: 130px;
      padding: 7px 10px;
      border: 1px solid #aaa;
      border-radius: 5px;
      background: white;
      cursor: pointer;
      font-weight: 600;
      list-style: none;
    }

    #${ID} summary::-webkit-details-marker {
      display: none;
    }

    #${ID} summary:after {
      content: ' ▼';
      font-size: 10px;
    }

    #${ID} details[open] summary:after {
      content: ' ▲';
    }

    #${ID} .menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 30;
      min-width: 180px;
      max-height: 320px;
      overflow: auto;
      padding: 8px;
      background: white;
      border: 1px solid #aaa;
      border-radius: 6px;
      box-shadow: 0 4px 15px #0003;
    }

    #${ID} .menu label {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 5px 4px;
      white-space: nowrap;
      font-weight: normal;
      cursor: pointer;
    }

    #${ID} .menu input {
      margin: 0;
    }

    #${ID} #status {
      padding: 8px 10px;
      margin-bottom: 12px;
      background: #eef2f6;
      border-radius: 5px;
    }

    #${ID} #status.error {
      background: #ffe4e4;
      color: #900;
    }

    #${ID} #status.warn {
      background: #fff1c7;
      color: #664d03;
    }

    #${ID} table {
      width: 100%;
      border-collapse: collapse;
    }

    #${ID} th,
    #${ID} td {
      padding: 7px 9px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }

    #${ID} th {
      position: sticky;
      top: 61px;
      z-index: 10;
      background: #e5e7eb;
      white-space: nowrap;
    }

    #${ID} th[data-sort] {
      cursor: pointer;
    }

    #${ID} tr.yes {
      background: #e7f7e7;
    }

    #${ID} tr.no {
      background: #fde9e9;
    }

    #${ID} td a {
      color: #004b9b;
      font-weight: 600;
      text-decoration: none;
    }

    #${ID} td a:hover {
      text-decoration: underline;
    }

    #${ID} .slots {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    #${ID} .slots a {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 5px;
      background: #e7f7e7;
    }

    #${ID} .empty {
      text-align: center;
      color: #666;
      padding: 20px;
    }

    @media (max-width: 900px) {
      #${ID} {
        top: 8px;
        width: calc(100% - 15px);
        max-height: calc(100vh - 16px);
      }

      #${ID} .toggle {
        flex-basis: 165px;
        width: 165px;
      }
    }
  `;

  document.head.appendChild(css);

  const panel = document.createElement('div');
  panel.id = ID;

  panel.innerHTML = `
    <div class="head">
      <h2>Školní pořady – přehled volných míst</h2>
      <button class="toggle" disabled>
        Volné sloty nenalezeny
      </button>
      <button class="close" title="Zavřít">×</button>
    </div>

    <div class="body">
      <div class="controls">
        <label>
          Od:
          <input id="from" type="month" value="${startMonth}">
        </label>

        <label>
          Do:
          <input id="to" type="month" value="${endMonth}">
        </label>

        <label>
          Počet žáků:
          <input id="students" type="number"
                 min="0" step="1" value="45">
        </label>

        <label>
          <input id="suitable" type="checkbox" checked>
          Pouze vhodné termíny
        </label>

        <button class="search">
          PROHLEDAT OBDOBÍ
        </button>

        <div class="break"></div>

        <details>
          <summary id="days-label">Dny</summary>
          <div id="days" class="menu">
            ${[
              'neděle',
              'pondělí',
              'úterý',
              'středa',
              'čtvrtek',
              'pátek',
              'sobota'
            ].map((name, i) => `
              <label>
                <input type="checkbox" value="${i}"
                  ${[2, 3, 4, 5].includes(i) ? 'checked' : ''}>
                ${name}
              </label>
            `).join('')}
          </div>
        </details>

        <details>
          <summary id="times-label">Časy</summary>
          <div id="times" class="menu">
            Nejdříve prohledej období.
          </div>
        </details>

        <details>
          <summary id="groups-label">Škola</summary>
          <div id="groups" class="menu">
            Načítám skupiny…
          </div>
        </details>

        <label>
          Pořad:
          <select id="shows">
            <option value="">Všechny pořady</option>
          </select>
        </label>
      </div>

      <div id="status">Připravuji program…</div>

      <div id="results" class="empty">
        Zvol období a stiskni „PROHLEDAT OBDOBÍ“.
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const $ = selector => panel.querySelector(selector);
  const $$ = selector =>
    [...panel.querySelectorAll(selector)];

  const status = (message, type = '') => {
    $('#status').textContent = message;
    $('#status').className = type;
  };

  let shows = [];
  let slots = [];
  let mode = 'shows';
  let groups = null;
  let sort = { key: 'date', dir: 1 };

  const selected = selector =>
    new Set(
      $$(selector + ':checked')
        .map(input => input.value)
    );

  const summary = (selector, label, all, none) => {
    const inputs =
      $$(selector + ' input[type=checkbox]');

    const n =
      inputs.filter(input => input.checked).length;

    $(label).textContent =
      !inputs.length
        ? all
        : n === inputs.length
          ? all
          : n
            ? `${all.split(':')[0]}: ${n}/${inputs.length}`
            : none;
  };

  const updateSummaries = () => {
    summary(
      '#days',
      '#days-label',
      'Dny: všechny',
      'Dny: žádné'
    );

    summary(
      '#times',
      '#times-label',
      'Časy: všechny',
      'Časy: žádné'
    );

    summary(
      '#groups',
      '#groups-label',
      'Škola: všechny',
      'Škola: žádná'
    );
  };

  const updateToggle = () => {
    $('.toggle').disabled = slots.length === 0;

    $('.toggle').textContent =
      !slots.length
        ? 'Volné sloty nenalezeny'
        : mode === 'slots'
          ? 'Volná místa'
          : 'Volné sloty nalezeny';

    $('.head h2').textContent =
      mode === 'slots'
        ? 'Školní pořady – přehled volných slotů'
        : 'Školní pořady – přehled volných míst';
  };

  const range = (from, to) => {
    const [fy, fm] = from.split('-').map(Number);
    const [ty, tm] = to.split('-').map(Number);
    const result = [];

    for (
      let y = fy, m = fm;
      y < ty || (y === ty && m <= tm);
      m++
    ) {
      if (m > 12) {
        y++;
        m = 1;
      }

      result.push([y, m]);

      if (result.length > 12) break;
    }

    return result;
  };

  const monthURL = (y, m) => {
    const url = new URL(
      '/!month@schedule',
      location.origin
    );

    url.searchParams.set('year', y);
    url.searchParams.set('month', m);
    url.searchParams.set('resource', resource);

    return url;
  };

  const parseMonth = doc => {
    const days = new Map();
    const validDays = new Map();

    doc
      .querySelectorAll('.day[data-date]')
      .forEach(el => {
        const r = row(el);
        const date = el.dataset.date;

        if (!r || !date) return;

        days.set(r, date);

        if (
          el.classList.contains('day-weekday') &&
          !el.classList.contains('day-anniversary') &&
          ![0, 6].includes(weekday(date)) &&
          dateNumber(date) >= tomorrow
        ) {
          validDays.set(r, date);
        }
      });

    // Carina někdy kreslí zelený podklad i pod pořadem.
    // Proto zaznamenáme všechny obsazené intervaly.
    const occupied = new Map();

    doc
      .querySelectorAll('.show, i.grid')
      .forEach(el => {
        const name =
          el.querySelector('.name')
            ?.textContent.trim();

        if (
          el.matches('i.grid') &&
          name === '---'
        ) {
          return;
        }

        const r = row(el);
        const [a, b] = cols(el);

        if (!r || !a || !b) return;

        if (!occupied.has(r)) {
          occupied.set(r, []);
        }

        occupied.get(r).push([a, b]);
      });

    const foundSlots = [];

    doc
      .querySelectorAll('i.grid[data-uuid]')
      .forEach(el => {
        if (
          el.querySelector('.name')
            ?.textContent.trim() !== '---'
        ) {
          return;
        }

        const r = row(el);
        const date = validDays.get(r);
        const [a, b] = cols(el);

        if (!date || !a || !b) return;

        const from = time(a);

        if (
          ![
            '09:00',
            '10:15',
            '11:30'
          ].includes(from)
        ) {
          return;
        }

        const overlaps =
          (occupied.get(r) || [])
            .some(([x, y]) =>
              a < y && x < b
            );

        if (overlaps) return;

        foundSlots.push({
          date,
          from,
          to: time(b),
          url:
            `${location.origin}/!grid@schedule~` +
            encodeURIComponent(el.dataset.uuid)
        });
      });

    const foundShows = [];

    doc
      .querySelectorAll('.show')
      .forEach(el => {
        const bg =
          (el.style.backgroundColor || '')
            .replace(/\s/g, '')
            .toLowerCase();

        if (
          bg !== '#000075' &&
          bg !== 'rgb(0,0,117)'
        ) {
          return;
        }

        const name =
          el.querySelector('.name')
            ?.textContent.trim();

        const cap =
          el.querySelector('.capacity');

        const id =
          cap?.id.replace(/^capa/, '');

        const uuid =
          el.dataset.uuid;

        const date =
          days.get(row(el));

        const [a, b] =
          cols(el);

        if (
          !name ||
          !id ||
          !uuid ||
          !date ||
          !a ||
          !b ||
          dateNumber(date) < tomorrow
        ) {
          return;
        }

        foundShows.push({
          date,
          from: time(a),
          to: time(b),
          name,
          id,
          url:
            `${location.origin}/!view@schedule~` +
            encodeURIComponent(uuid),
          available: null,
          total: null
        });
      });

    return [foundShows, foundSlots];
  };

  async function capacities(ids) {
    const result = {};

    for (
      let i = 0;
      i < ids.length;
      i += 150
    ) {
      const body = new URLSearchParams({
        ids: ids.slice(i, i + 150).join(',')
      });

      const response = await fetch(
        '/!capacities@schedule',
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body
        }
      );

      if (!response.ok) {
        throw new Error(
          `Kapacity: HTTP ${response.status}`
        );
      }

      for (
        const item of await response.json()
      ) {
        result[String(item.schedule_id)] = {
          available: Number(item.available),
          total: Number(item.total)
        };
      }
    }

    return result;
  }

  async function loadGroups() {
    for (const address of groupURLs) {
      try {
        const response = await fetch(
          address + '?_=' + Date.now(),
          { cache: 'no-store' }
        );

        if (!response.ok) continue;

        const data =
          await response.json();

        if (
          data?.skupiny &&
          data?.porady
        ) {
          groups = data;
          break;
        }
      } catch (_) {}
    }

    $('#groups').innerHTML =
      groups
        ? [
            'MS',
            'ZS1',
            'ZS2',
            'SS'
          ]
            .filter(key =>
              groups.skupiny[key]
            )
            .map(key => `
              <label>
                <input
                  type="checkbox"
                  value="${key}"
                  checked
                >
                ${esc(groups.skupiny[key])}
              </label>
            `)
            .join('')
        : 'Data skupin nejsou dostupná.';

    updateSummaries();

    status(
      groups
        ? 'Připraveno k vyhledávání.'
        : 'Připraveno; data školních skupin se nepodařilo načíst.',
      groups ? '' : 'warn'
    );
  }

  const groupMatches = (show, chosen) => {
    if (!groups) return true;

    const all =
      $$('#groups input').length;

    if (chosen.size === all) {
      return true;
    }

    if (!chosen.size) {
      return false;
    }

    return (
      groups.porady[show.name] || []
    ).some(key =>
      chosen.has(key)
    );
  };

  function renderShows() {
    if (mode !== 'shows') return;

    const amount =
      Number($('#students').value);

    const chosenDays =
      selected('#days input');

    const chosenTimes =
      selected('#times input');

    const chosenGroups =
      selected('#groups input');

    const showName =
      $('#shows').value;

    const filtered =
      shows.filter(s =>
        s.available !== null &&
        chosenDays.has(
          String(weekday(s.date))
        ) &&
        chosenTimes.has(s.from) &&
        (
          !showName ||
          s.name === showName
        ) &&
        groupMatches(
          s,
          chosenGroups
        ) &&
        (
          !$('#suitable').checked ||
          s.available >= amount
        )
      );

    const cmp = (a, b) =>
      sort.key === 'date'
        ? dateNumber(a.date) -
            dateNumber(b.date) ||
          minute(a.from) -
            minute(b.from)
        : sort.key === 'time'
          ? minute(a.from) -
              minute(b.from) ||
            dateNumber(a.date) -
              dateNumber(b.date)
          : sort.key === 'name'
            ? a.name.localeCompare(
                b.name,
                'cs'
              )
            : sort.key === 'available'
              ? a.available -
                  b.available
              : a.total -
                  b.total;

    filtered.sort(
      (a, b) =>
        sort.dir * cmp(a, b)
    );

    if (!filtered.length) {
      $('#results').innerHTML =
        '<div class="empty">' +
        'Pro nastavené filtry nebyly nalezeny žádné termíny.' +
        '</div>';

      return;
    }

    $('#results').innerHTML =
      '<table><thead><tr>' +
      [
        ['date', 'Datum'],
        ['time', 'Čas'],
        ['name', 'Pořad'],
        ['available', 'Volno'],
        ['total', 'Kapacita']
      ]
        .map(([key, label]) => `
          <th data-sort="${key}">
            ${label}${
              sort.key === key
                ? sort.dir === 1
                  ? ' ▲'
                  : ' ▼'
                : ''
            }
          </th>
        `)
        .join('') +
      '<th>Vhodné</th></tr></thead><tbody>' +
      filtered.map(s => {
        const yes =
          s.available >= amount;

        return `
          <tr class="${yes ? 'yes' : 'no'}">
            <td>
              ${esc(s.date)}
              ${dayNames[weekday(s.date)]}
            </td>

            <td>
              ${esc(s.from)}–${esc(s.to)}
            </td>

            <td>
              <a
                href="${esc(s.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${esc(s.name)}
              </a>
            </td>

            <td>
              <strong>
                ${s.available}
              </strong>
            </td>

            <td>
              ${s.total}
            </td>

            <td>
              ${yes ? '✓ ANO' : '✕ NE'}
            </td>
          </tr>
        `;
      }).join('') +
      '</tbody></table>';
  }

  function renderSlots() {
    if (mode !== 'slots') return;

    const days = new Map();

    slots.forEach(s => {
      if (!days.has(s.date)) {
        days.set(s.date, []);
      }

      days.get(s.date).push(s);
    });

    $('#results').innerHTML =
      !slots.length
        ? '<div class="empty">Žádné volné sloty.</div>'
        : '<table><thead><tr>' +
          '<th>Datum</th>' +
          '<th>Volné sloty</th>' +
          '</tr></thead><tbody>' +
          [...days]
            .map(([date, entries]) => `
              <tr>
                <td>
                  ${esc(date)}
                  ${dayNames[weekday(date)]}
                </td>

                <td>
                  <div class="slots">
                    ${entries
                      .map(s => `
                        <a
                          href="${esc(s.url)}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ${esc(s.from)}–${esc(s.to)}
                        </a>
                      `)
                      .join('')}
                  </div>
                </td>
              </tr>
            `)
            .join('') +
          '</tbody></table>';
  }

  async function search() {
    const from = $('#from').value;
    const to = $('#to').value;

    if (
      !from ||
      !to ||
      from > to ||
      to < startMonth
    ) {
      status(
        'Vyber platné počáteční a koncové období.',
        'error'
      );

      return;
    }

    const amount =
      Number($('#students').value);

    if (
      !Number.isInteger(amount) ||
      amount < 0
    ) {
      status(
        'Počet žáků musí být celé nezáporné číslo.',
        'error'
      );

      return;
    }

    const months = range(
      from < startMonth
        ? startMonth
        : from,
      to
    );

    if (
      !months.length ||
      months.length > 12
    ) {
      status(
        'Najednou lze prohledat nejvýše 12 měsíců.',
        'error'
      );

      return;
    }

    $('.search').disabled = true;

    shows = [];
    slots = [];
    mode = 'shows';

    updateToggle();

    $('#results').innerHTML =
      '<div class="empty">' +
      'Načítám kalendář…' +
      '</div>';

    try {
      for (
        let i = 0;
        i < months.length;
        i++
      ) {
        const [y, m] =
          months[i];

        status(
          `Načítám ${m}/${y} ` +
          `(${i + 1}/${months.length})…`
        );

        const response =
          await fetch(
            monthURL(y, m),
            {
              credentials:
                'same-origin'
            }
          );

        if (!response.ok) {
          throw new Error(
            `Kalendář ${m}/${y}: ` +
            `HTTP ${response.status}`
          );
        }

        const doc =
          new DOMParser()
            .parseFromString(
              await response.text(),
              'text/html'
            );

        const [a, b] =
          parseMonth(doc);

        shows.push(...a);
        slots.push(...b);
      }

      status(
        'Zjišťuji volná místa…'
      );

      const cap =
        await capacities(
          [
            ...new Set(
              shows.map(s => s.id)
            )
          ]
        );

      shows.forEach(s => {
        if (cap[s.id]) {
          s.available =
            cap[s.id].available;

          s.total =
            cap[s.id].total;
        }
      });

      slots.sort(
        (a, b) =>
          dateNumber(a.date) -
            dateNumber(b.date) ||
          minute(a.from) -
            minute(b.from)
      );

      $('#shows').innerHTML =
        '<option value="">' +
        'Všechny pořady' +
        '</option>' +
        [
          ...new Set(
            shows.map(s => s.name)
          )
        ]
          .sort(
            (a, b) =>
              a.localeCompare(
                b,
                'cs'
              )
          )
          .map(
            name => `
              <option value="${esc(name)}">
                ${esc(name)}
              </option>
            `
          )
          .join('');

      $('#times').innerHTML =
        [
          ...new Set(
            shows.map(s => s.from)
          )
        ]
          .sort(
            (a, b) =>
              minute(a) -
              minute(b)
          )
          .map(
            t => `
              <label>
                <input
                  type="checkbox"
                  value="${esc(t)}"
                  checked
                >
                ${esc(t)}
              </label>
            `
          )
          .join('');

      updateSummaries();
      updateToggle();
      renderShows();

      status(
        'Prohledávání dokončeno. ' +
        `Nalezeno ${slots.length} ` +
        'volných dopoledních slotů.'
      );
    } catch (e) {
      console.error(e);

      status(
        'Chyba: ' + e.message,
        'error'
      );

      $('#results').innerHTML =
        '<div class="empty">' +
        'Načítání se nezdařilo.' +
        '</div>';

      slots = [];
      updateToggle();
    } finally {
      $('.search').disabled =
        false;
    }
  }

  $('.close')
    .addEventListener(
      'click',
      () => {
        panel.remove();
        css.remove();
      }
    );

  $('.search')
    .addEventListener(
      'click',
      search
    );

  $('.toggle')
    .addEventListener(
      'click',
      () => {
        if (!slots.length) return;

        mode =
          mode === 'shows'
            ? 'slots'
            : 'shows';

        updateToggle();

        mode === 'shows'
          ? renderShows()
          : renderSlots();
      }
    );

  panel.addEventListener(
    'change',
    e => {
      if (
        e.target.closest(
          '.controls'
        )
      ) {
        updateSummaries();
        renderShows();
      }
    }
  );

  $('#students')
    .addEventListener(
      'input',
      renderShows
    );

  $('#results')
    .addEventListener(
      'click',
      e => {
        const th =
          e.target.closest(
            'th[data-sort]'
          );

        if (!th) return;

        if (
          sort.key ===
          th.dataset.sort
        ) {
          sort.dir *= -1;
        } else {
          sort.key =
            th.dataset.sort;

          sort.dir = 1;
        }

        renderShows();
      }
    );

  document.addEventListener(
    'click',
    e => {
      if (!panel.isConnected) {
        return;
      }

      panel
        .querySelectorAll(
          'details[open]'
        )
        .forEach(d => {
          if (
            !d.contains(
              e.target
            )
          ) {
            d.open = false;
          }
        });
    }
  );

  updateSummaries();
  updateToggle();
  await loadGroups();
})();