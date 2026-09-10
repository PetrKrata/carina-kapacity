(async function () {

    // =========================================================
    // CARINA – VYHLEDÁVÁNÍ VOLNÝCH KAPACIT
    // =========================================================

    const PANEL_ID = 'skolni-prehled-kapacit';
    const STYLE_ID = 'skolni-prehled-style';

    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();


    // =========================================================
    // 1. RESOURCE
    // =========================================================

    const RESOURCE_STORAGE_KEY =
        'carina-skolni-prehled-resource';


    function ulozResource(resource) {

        if (!resource) return;

        try {
            localStorage.setItem(
                RESOURCE_STORAGE_KEY,
                resource
            );
        } catch (e) {
            console.warn(
                'RESOURCE se nepodařilo uložit.',
                e
            );
        }
    }


    function nactiUlozenyResource() {

        try {
            return localStorage.getItem(
                RESOURCE_STORAGE_KEY
            );
        } catch (e) {
            return null;
        }
    }


    function zjistiResource() {

        // 1. RESOURCE přímo v URL
        try {

            const aktualniURL =
                new URL(window.location.href);

            const resource =
                aktualniURL.searchParams.get(
                    'resource'
                );

            if (resource) {

                ulozResource(resource);

                return resource;
            }

        } catch (e) {

            console.warn(
                'Nepodařilo se přečíst URL.',
                e
            );
        }


        // 2. RESOURCE z odkazů na stránce
        const odkazy =
            document.querySelectorAll(
                'a[href]'
            );


        for (const odkaz of odkazy) {

            try {

                const url =
                    new URL(
                        odkaz.href,
                        window.location.origin
                    );

                const resource =
                    url.searchParams.get(
                        'resource'
                    );


                if (resource) {

                    ulozResource(resource);

                    return resource;
                }

            } catch (e) {
                // neplatný odkaz ignorujeme
            }
        }


        // 3. RESOURCE z formuláře
        const resourceInput =
            document.querySelector(
                '[name="resource"]'
            );


        if (
            resourceInput &&
            resourceInput.value
        ) {

            ulozResource(
                resourceInput.value
            );

            return resourceInput.value;
        }


        // 4. RESOURCE z data-resource
        const resourceElement =
            document.querySelector(
                '[data-resource]'
            );


        if (
            resourceElement &&
            resourceElement.dataset.resource
        ) {

            ulozResource(
                resourceElement.dataset.resource
            );

            return resourceElement.dataset.resource;
        }


        // 5. Dříve zapamatovaný RESOURCE
        return nactiUlozenyResource();
    }


    const resource =
        zjistiResource();


    if (!resource) {

        alert(
            'Nepodařilo se zjistit kalendář CARINY.\n\n' +
            'Otevři jednou měsíční přehled CARINY a spusť skript tam. ' +
            'Skript si kalendář zapamatuje a potom jej můžeš spouštět i ze stránky pořadu.'
        );

        return;
    }


    // =========================================================
    // 2. VÝCHOZÍ OBDOBÍ
    // =========================================================

    const VYCHOZI_OD = '2026-09';
    const VYCHOZI_DO = '2027-01';


    // =========================================================
    // 3. POMOCNÉ FUNKCE
    // =========================================================

    function inputNaMesic(text) {

        const [rok, mesic] =
            text.split('-').map(Number);

        return {
            rok,
            mesic
        };
    }


    function seznamMesicu(
        odRok,
        odMesic,
        doRok,
        doMesic
    ) {

        const vysledek = [];

        let rok = odRok;
        let mesic = odMesic;


        while (
            rok < doRok ||
            (
                rok === doRok &&
                mesic <= doMesic
            )
        ) {

            vysledek.push({
                rok,
                mesic
            });


            mesic++;


            if (mesic > 12) {

                mesic = 1;
                rok++;
            }


            if (vysledek.length > 24) {

                throw new Error(
                    'Zvolené období je příliš dlouhé.'
                );
            }
        }


        return vysledek;
    }


    function datumNaCislo(datum) {

        if (!datum) return 0;


        const [den, mesic, rok] =
            datum.split('.').map(Number);


        return new Date(
            rok,
            mesic - 1,
            den
        ).getTime();
    }


    function dnesBezCasu() {

        const dnes =
            new Date();


        return new Date(
            dnes.getFullYear(),
            dnes.getMonth(),
            dnes.getDate()
        ).getTime();
    }


    function formatDnesniDatum() {

        const dnes =
            new Date();


        return (
            String(dnes.getDate()).padStart(2, '0') +
            '.' +
            String(dnes.getMonth() + 1).padStart(2, '0') +
            '.' +
            dnes.getFullYear()
        );
    }


    function denVTydnu(datum) {

        if (!datum) return '';


        const [den, mesic, rok] =
            datum.split('.').map(Number);


        const dny = [
            'ne',
            'po',
            'út',
            'st',
            'čt',
            'pá',
            'so'
        ];


        return dny[
            new Date(
                rok,
                mesic - 1,
                den
            ).getDay()
        ];
    }


    function cisloDneVTydnu(datum) {

        if (!datum) return null;


        const [den, mesic, rok] =
            datum.split('.').map(Number);


        return new Date(
            rok,
            mesic - 1,
            den
        ).getDay();
    }


    function casNaMinuty(cas) {

        if (!cas) return 0;


        const [hodiny, minuty] =
            cas.split(':').map(Number);


        return (
            hodiny * 60 +
            minuty
        );
    }


    function sloupecNaCas(column) {

        const minuty =
            (8 * 60) +
            ((column - 2) * 15);


        const hodiny =
            Math.floor(
                minuty / 60
            );


        const mins =
            minuty % 60;


        return (
            String(hodiny).padStart(2, '0') +
            ':' +
            String(mins).padStart(2, '0')
        );
    }


    function escapeHTML(text) {

        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }


    // =========================================================
    // 4. URL
    // =========================================================

    function urlMesice(
        rok,
        mesic
    ) {

        const url =
            new URL(
                '/!month@schedule',
                window.location.origin
            );


        url.searchParams.set(
            'year',
            rok
        );

        url.searchParams.set(
            'month',
            mesic
        );

        url.searchParams.set(
            'resource',
            resource
        );


        return url.toString();
    }


    function urlUdalosti(uuid) {

        return (
            window.location.origin +
            '/!view@schedule~' +
            uuid
        );
    }


    // =========================================================
    // 5. MODRÉ POŘADY
    // =========================================================

    function jeModryPorad(show) {

        const styleText =
            (
                show.getAttribute('style') ||
                ''
            )
            .toLowerCase()
            .replace(/\s/g, '');


        if (
            styleText.includes(
                'background-color:#000075'
            )
        ) {

            return true;
        }


        const barva =
            (
                show.style.backgroundColor ||
                ''
            )
            .toLowerCase()
            .replace(/\s/g, '');


        return (
            barva === '#000075' ||
            barva === 'rgb(0,0,117)'
        );
    }


    // =========================================================
    // 6. NAČTENÍ MĚSÍCE
    // =========================================================

    async function nactiMesic(
        rok,
        mesic
    ) {

        const response =
            await fetch(
                urlMesice(
                    rok,
                    mesic
                ),
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );


        if (!response.ok) {

            throw new Error(
                `Chyba při načítání ${mesic}/${rok}: HTTP ${response.status}`
            );
        }


        const html =
            await response.text();


        const doc =
            new DOMParser()
                .parseFromString(
                    html,
                    'text/html'
                );


        return zpracujMesic(
            doc,
            rok,
            mesic
        );
    }


    // =========================================================
    // 7. ZPRACOVÁNÍ MĚSÍCE
    // =========================================================

    function zpracujMesic(
        doc,
        rok,
        mesic
    ) {

        const datumy = {};


        doc.querySelectorAll('.day')
            .forEach((day) => {

                const row =
                    parseInt(
                        day.style.gridRowStart,
                        10
                    );


                if (
                    row &&
                    day.dataset.date
                ) {

                    datumy[row] =
                        day.dataset.date;
                }
            });


        const vysledek = [];


        doc.querySelectorAll('.show')
            .forEach((show) => {

                if (!jeModryPorad(show)) {
                    return;
                }


                const nameElement =
                    show.querySelector(
                        '.name'
                    );


                const capacityElement =
                    show.querySelector(
                        '.capacity'
                    );


                if (
                    !nameElement ||
                    !capacityElement
                ) {

                    return;
                }


                const scheduleId =
                    capacityElement.id
                        .replace(
                            'capa',
                            ''
                        )
                        .trim();


                if (!scheduleId) return;


                const uuid =
                    show.dataset.uuid || '';


                if (!uuid) return;


                const row =
                    parseInt(
                        show.style.gridRowStart,
                        10
                    );


                const columnStart =
                    parseInt(
                        show.style.gridColumnStart,
                        10
                    );


                const columnEnd =
                    parseInt(
                        show.style.gridColumnEnd,
                        10
                    );


                if (
                    !row ||
                    !columnStart ||
                    !columnEnd
                ) {

                    return;
                }


                vysledek.push({

                    datum:
                        datumy[row] || '',

                    od:
                        sloupecNaCas(
                            columnStart
                        ),

                    do:
                        sloupecNaCas(
                            columnEnd
                        ),

                    nazev:
                        nameElement
                            .textContent
                            .trim(),

                    scheduleId,

                    uuid,

                    rok,

                    mesic,

                    url:
                        urlUdalosti(
                            uuid
                        ),

                    volno:
                        null,

                    celkem:
                        null

                });
            });


        return vysledek;
    }


    // =========================================================
    // 8. KAPACITY
    // =========================================================

    async function nactiKapacity(ids) {

        if (
            ids.length === 0
        ) {

            return {};
        }


        const data =
            new URLSearchParams();


        data.set(
            'ids',
            ids.join(',')
        );


        const response =
            await fetch(
                '/!capacities@schedule',
                {
                    method: 'POST',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/x-www-form-urlencoded; charset=UTF-8'
                    },

                    body:
                        data.toString()
                }
            );


        if (!response.ok) {

            throw new Error(
                `Chyba při načítání kapacit: HTTP ${response.status}`
            );
        }


        const json =
            await response.json();


        const mapa = {};


        json.forEach((item) => {

            mapa[
                String(
                    item.schedule_id
                )
            ] = {

                volno:
                    Number(
                        item.available
                    ),

                celkem:
                    Number(
                        item.total
                    )

            };
        });


        return mapa;
    }


    async function nactiKapacityPoDavkach(
        ids,
        statusCallback
    ) {

        const VELIKOST_DAVKY =
            150;


        const mapa =
            {};


        for (
            let i = 0;
            i < ids.length;
            i += VELIKOST_DAVKY
        ) {

            const davka =
                ids.slice(
                    i,
                    i + VELIKOST_DAVKY
                );


            statusCallback(
                `Načítám kapacity ${i + 1}–${Math.min(
                    i + VELIKOST_DAVKY,
                    ids.length
                )} z ${ids.length}…`
            );


            Object.assign(
                mapa,
                await nactiKapacity(
                    davka
                )
            );
        }


        return mapa;
    }


    // =========================================================
    // 9. CSS
    // =========================================================

    const style =
        document.createElement(
            'style'
        );


    style.id =
        STYLE_ID;


    style.textContent = `

        #${PANEL_ID} {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: rgba(0,0,0,.55);
            padding: 25px;
            overflow: auto;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }


        #${PANEL_ID} .panel {
            max-width: 1250px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,.35);
        }


        #${PANEL_ID} .hlavicka {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }


        #${PANEL_ID} h1 {
            margin: 0;
            font-size: 26px;
        }


        #${PANEL_ID} .podnadpis {
            margin-top: 5px;
            color: #666;
        }


        #${PANEL_ID} #zavrit {
            width: 42px;
            height: 42px;
            border: none;
            border-radius: 6px;
            font-size: 28px;
            cursor: pointer;
            background: #eee;
        }


        /* =====================================================
           OVLÁDACÍ PANEL
           ===================================================== */

        #${PANEL_ID} .ovladani {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            margin-bottom: 15px;
        }


        #${PANEL_ID} .ovladani-radek {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            align-items: center;
        }


        #${PANEL_ID} .ovladani label {
            font-size: 15px;
        }


        #${PANEL_ID} input[type="month"],
        #${PANEL_ID} input[type="number"],
        #${PANEL_ID} select {
            padding: 8px;
            font-size: 15px;
            margin-left: 5px;
            border: 1px solid #bbb;
            border-radius: 5px;
            box-sizing: border-box;
        }


        #${PANEL_ID} input[type="number"] {
            width: 75px;
        }


        #${PANEL_ID} .vhodne-label {
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }


        #${PANEL_ID} .vhodne-label input {
            margin: 0;
        }


        #${PANEL_ID} #hledat {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #2563eb;
            color: white;
            font-weight: bold;
            font-size: 15px;
            cursor: pointer;
            white-space: nowrap;
        }


        #${PANEL_ID} #hledat:hover {
            background: #1d4ed8;
        }


        #${PANEL_ID} #hledat:disabled {
            opacity: .5;
            cursor: wait;
        }


        /* =====================================================
           FILTR POŘADU
           ===================================================== */

        #${PANEL_ID} .porad-label {
            display: flex;
            align-items: center;
            gap: 7px;
        }


        #${PANEL_ID} .porad-label select {
            min-width: 360px;
            max-width: 500px;
            margin-left: 0;
        }


        /* =====================================================
           ROZBALOVACÍ FILTRY
           ===================================================== */

        #${PANEL_ID} details.filtr {
            position: relative;
        }


        #${PANEL_ID} details.filtr > summary {
            list-style: none;
            cursor: pointer;
            background: white;
            border: 1px solid #aaa;
            border-radius: 5px;
            padding: 8px 12px;
            min-width: 175px;
            user-select: none;
            box-sizing: border-box;
        }


        #${PANEL_ID} details.filtr > summary::-webkit-details-marker {
            display: none;
        }


        #${PANEL_ID} details.filtr > summary::after {
            content: "▼";
            float: right;
            margin-left: 15px;
            font-size: 11px;
            margin-top: 3px;
        }


        #${PANEL_ID} details.filtr[open] > summary::after {
            content: "▲";
        }


        #${PANEL_ID} .filtr-menu {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            z-index: 1000001;
            background: white;
            border: 1px solid #aaa;
            border-radius: 6px;
            box-shadow: 0 5px 20px rgba(0,0,0,.20);
            padding: 10px;
            min-width: 175px;
            max-height: 330px;
            overflow-y: auto;
        }


        #${PANEL_ID} .filtr-menu label {
            display: block;
            padding: 5px 8px;
            white-space: nowrap;
            cursor: pointer;
            border-radius: 4px;
        }


        #${PANEL_ID} .filtr-menu label:hover {
            background: #f3f4f6;
        }


        #${PANEL_ID} .filtr-menu input {
            margin-right: 7px;
        }


        /* =====================================================
           STAV
           ===================================================== */

        #${PANEL_ID} .status {
            min-height: 24px;
            margin: 8px 0 14px;
            color: #555;
        }


        #${PANEL_ID} .status.chyba {
            color: #b91c1c;
            font-weight: bold;
        }


        #${PANEL_ID} .input-chyba {
            border: 2px solid #dc2626 !important;
            background: #fee2e2;
        }


        /* =====================================================
           TABULKA
           ===================================================== */

        #${PANEL_ID} table {
            width: 100%;
            border-collapse: collapse;
        }


        #${PANEL_ID} th {
            text-align: left;
            padding: 10px;
            background: #e5e7eb;
            border-bottom: 2px solid #aaa;
        }


        #${PANEL_ID} th[data-sort] {
            cursor: pointer;
            user-select: none;
        }


        #${PANEL_ID} th[data-sort]:hover {
            background: #d1d5db;
        }


        #${PANEL_ID} td {
            padding: 9px 10px;
            border-bottom: 1px solid #ddd;
        }


        #${PANEL_ID} tr.vhodne {
            background: #dcfce7;
        }


        #${PANEL_ID} tr.nevhodne {
            background: #fee2e2;
        }


        #${PANEL_ID} .volno {
            font-size: 17px;
            font-weight: bold;
        }


        #${PANEL_ID} .ano {
            color: #15803d;
            font-weight: bold;
        }


        #${PANEL_ID} .ne {
            color: #b91c1c;
            font-weight: bold;
        }


        #${PANEL_ID} .modry-symbol {
            display: inline-block;
            width: 12px;
            height: 12px;
            margin-right: 7px;
            background: #000075;
            border-radius: 2px;
        }


        #${PANEL_ID} .program-link {
            color: #000075;
            font-weight: bold;
            text-decoration: none;
        }


        #${PANEL_ID} .program-link:hover {
            text-decoration: underline;
            color: #2563eb;
        }


        #${PANEL_ID} .sipka {
            margin-left: 5px;
            color: #555;
        }


        #${PANEL_ID} .souhrn {
            margin-bottom: 12px;
            color: #555;
        }


        #${PANEL_ID} .datum-den {
            color: #555;
            font-weight: bold;
            margin-left: 4px;
        }


        /* =====================================================
           MENŠÍ OBRAZOVKY
           ===================================================== */

        @media (max-width: 900px) {

            #${PANEL_ID} .ovladani-radek {
                gap: 10px;
            }

            #${PANEL_ID} .porad-label select {
                min-width: 250px;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    // =========================================================
    // 10. PANEL
    // =========================================================

    const overlay =
        document.createElement(
            'div'
        );


    overlay.id =
        PANEL_ID;


    overlay.innerHTML = `

        <div class="panel">

            <div class="hlavicka">

                <div>

                    <h1>
                        Vyhledávání volných kapacit
                    </h1>

                    <div class="podnadpis">
                        Modré pořady – více měsíců
                    </div>

                </div>


                <button
                    id="zavrit"
                    title="Zavřít"
                >
                    ×
                </button>

            </div>


            <div class="ovladani">


                <!-- ==========================================
                     PRVNÍ ŘÁDEK
                     ========================================== -->

                <div class="ovladani-radek">


                    <label>

                        Od:

                        <input
                            type="month"
                            id="mesic-od"
                            value="${VYCHOZI_OD}"
                        >

                    </label>


                    <label>

                        Do:

                        <input
                            type="month"
                            id="mesic-do"
                            value="${VYCHOZI_DO}"
                        >

                    </label>


                    <label>

                        Počet žáků:

                        <input
                            type="number"
                            id="pocet-zaku"
                            value="45"
                            min="0"
                            step="1"
                        >

                    </label>


                    <label class="vhodne-label">

                        <input
                            type="checkbox"
                            id="jen-vhodne"
                            checked
                        >

                        Pouze vhodné termíny

                    </label>


                    <button id="hledat">

                        PROHLEDAT OBDOBÍ

                    </button>


                </div>


                <!-- ==========================================
                     DRUHÝ ŘÁDEK
                     ========================================== -->

                <div class="ovladani-radek">


                    <!-- ČASY -->

                    <details class="filtr">

                        <summary id="souhrn-casy">
                            Časy: všechny
                        </summary>

                        <div
                            id="filtr-casy"
                            class="filtr-menu"
                        >

                            <label>
                                Nejdříve prohledej období.
                            </label>

                        </div>

                    </details>


                    <!-- DNY -->

                    <details class="filtr">

                        <summary id="souhrn-dny">
                            Dny: všechny
                        </summary>


                        <div
                            id="filtr-dny"
                            class="filtr-menu"
                        >


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="1"
                                    checked
                                >

                                pondělí

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="2"
                                    checked
                                >

                                úterý

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="3"
                                    checked
                                >

                                středa

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="4"
                                    checked
                                >

                                čtvrtek

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="5"
                                    checked
                                >

                                pátek

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="6"
                                    checked
                                >

                                sobota

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    class="filtr-den"
                                    value="0"
                                    checked
                                >

                                neděle

                            </label>


                        </div>

                    </details>


                    <!-- POŘAD -->

                    <label class="porad-label">

                        Pořad:

                        <select id="filtr-poradu">

                            <option value="">
                                Všechny pořady
                            </option>

                        </select>

                    </label>


                </div>


            </div>


            <div
                id="status"
                class="status"
            >
                Připraveno. Výsledky budou nejdříve od dnešního data ${formatDnesniDatum()}.
            </div>


            <div id="vysledek">
            </div>


        </div>

    `;


    document.body.appendChild(
        overlay
    );


    // =========================================================
    // 11. DATA
    // =========================================================

    let vsechnyPorady = [];


    let razeni = {
        sloupec: 'datum',
        smer: 'asc'
    };


    // =========================================================
    // 12. FILTR POŘADŮ
    // =========================================================

    function naplnFiltrPoradu() {

        const select =
            document.getElementById(
                'filtr-poradu'
            );


        const nazvy =
            [
                ...new Set(
                    vsechnyPorady
                        .map(
                            p => p.nazev
                        )
                        .filter(Boolean)
                )
            ]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        'cs'
                    )
            );


        select.innerHTML = '';


        const vsechny =
            document.createElement(
                'option'
            );


        vsechny.value = '';

        vsechny.textContent =
            'Všechny pořady';


        select.appendChild(
            vsechny
        );


        nazvy.forEach(
            (nazev) => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    nazev;


                option.textContent =
                    nazev;


                select.appendChild(
                    option
                );
            }
        );
    }


    // =========================================================
    // 13. FILTR ČASŮ
    // =========================================================

    function naplnFiltrCasu() {

        const kontejner =
            document.getElementById(
                'filtr-casy'
            );


        const casy =
            [
                ...new Set(
                    vsechnyPorady
                        .map(
                            p => p.od
                        )
                        .filter(Boolean)
                )
            ]
            .sort(
                (a, b) =>
                    casNaMinuty(a) -
                    casNaMinuty(b)
            );


        kontejner.innerHTML = '';


        if (
            casy.length === 0
        ) {

            kontejner.innerHTML =
                '<label>Žádné časy.</label>';

            aktualizujSouhrnCasu();

            return;
        }


        casy.forEach(
            (cas) => {

                const label =
                    document.createElement(
                        'label'
                    );


                const checkbox =
                    document.createElement(
                        'input'
                    );


                checkbox.type =
                    'checkbox';


                checkbox.className =
                    'filtr-cas';


                checkbox.value =
                    cas;


                checkbox.checked =
                    true;


                checkbox.addEventListener(
                    'change',
                    () => {

                        aktualizujSouhrnCasu();

                        vykresli();
                    }
                );


                label.appendChild(
                    checkbox
                );


                label.appendChild(
                    document.createTextNode(
                        cas
                    )
                );


                kontejner.appendChild(
                    label
                );
            }
        );


        aktualizujSouhrnCasu();
    }


    // =========================================================
    // 14. SOUHRNY FILTRŮ
    // =========================================================

    function aktualizujSouhrnDnu() {

        const checkboxy =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-den`
                )
            ];


        const pocet =
            checkboxy.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        const summary =
            document.getElementById(
                'souhrn-dny'
            );


        if (
            pocet === checkboxy.length
        ) {

            summary.textContent =
                'Dny: všechny';

        } else if (
            pocet === 0
        ) {

            summary.textContent =
                'Dny: žádné';

        } else {

            summary.textContent =
                `Dny: ${pocet}/${checkboxy.length}`;
        }
    }


    function aktualizujSouhrnCasu() {

        const checkboxy =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-cas`
                )
            ];


        const summary =
            document.getElementById(
                'souhrn-casy'
            );


        if (
            checkboxy.length === 0
        ) {

            summary.textContent =
                'Časy';

            return;
        }


        const pocet =
            checkboxy.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        if (
            pocet === checkboxy.length
        ) {

            summary.textContent =
                'Časy: všechny';

        } else if (
            pocet === 0
        ) {

            summary.textContent =
                'Časy: žádné';

        } else {

            summary.textContent =
                `Časy: ${pocet}/${checkboxy.length}`;
        }
    }


    // =========================================================
    // 15. VYBRANÉ DNY A ČASY
    // =========================================================

    function ziskejVybraneDny() {

        return new Set(

            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-den:checked`
                )
            ]

            .map(
                checkbox =>
                    Number(
                        checkbox.value
                    )
            )
        );
    }


    function ziskejVybraneCasy() {

        return new Set(

            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-cas:checked`
                )
            ]

            .map(
                checkbox =>
                    checkbox.value
            )
        );
    }


    // =========================================================
    // 16. ŘAZENÍ
    // =========================================================

    function serad(data) {

        const vysledek =
            [...data];


        vysledek.sort(
            (a, b) => {

                let A;
                let B;


                switch (
                    razeni.sloupec
                ) {

                    case 'datum':

                        A =
                            datumNaCislo(
                                a.datum
                            );

                        B =
                            datumNaCislo(
                                b.datum
                            );

                        break;


                    case 'cas':

                        A =
                            casNaMinuty(
                                a.od
                            );

                        B =
                            casNaMinuty(
                                b.od
                            );

                        break;


                    case 'nazev':

                        A =
                            a.nazev
                                .toLocaleLowerCase(
                                    'cs'
                                );

                        B =
                            b.nazev
                                .toLocaleLowerCase(
                                    'cs'
                                );

                        break;


                    case 'volno':

                        A =
                            a.volno ?? -1;

                        B =
                            b.volno ?? -1;

                        break;


                    case 'celkem':

                        A =
                            a.celkem ?? -1;

                        B =
                            b.celkem ?? -1;

                        break;
                }


                let porovnani;


                if (
                    typeof A ===
                    'string'
                ) {

                    porovnani =
                        A.localeCompare(
                            B,
                            'cs'
                        );

                } else {

                    porovnani =
                        A - B;
                }


                if (
                    razeni.smer ===
                    'desc'
                ) {

                    porovnani *= -1;
                }


                if (
                    porovnani === 0 &&
                    razeni.sloupec ===
                    'nazev'
                ) {

                    const rozdilData =
                        datumNaCislo(
                            a.datum
                        ) -
                        datumNaCislo(
                            b.datum
                        );


                    if (
                        rozdilData !== 0
                    ) {

                        return rozdilData;
                    }


                    return (
                        casNaMinuty(
                            a.od
                        ) -
                        casNaMinuty(
                            b.od
                        )
                    );
                }


                if (
                    porovnani === 0 &&
                    razeni.sloupec ===
                    'datum'
                ) {

                    return (
                        casNaMinuty(
                            a.od
                        ) -
                        casNaMinuty(
                            b.od
                        )
                    );
                }


                return porovnani;
            }
        );


        return vysledek;
    }


    function sipka(sloupec) {

        if (
            razeni.sloupec !==
            sloupec
        ) {

            return '';
        }


        return (
            razeni.smer === 'asc'

                ? '<span class="sipka">▲</span>'

                : '<span class="sipka">▼</span>'
        );
    }


    // =========================================================
    // 17. VYKRESLENÍ
    // =========================================================

    function vykresli() {

        const pocetZakuText =
            document
                .getElementById(
                    'pocet-zaku'
                )
                .value
                .trim();


        const pocetZaku =
            Number(
                pocetZakuText
            );


        const jenVhodne =
            document
                .getElementById(
                    'jen-vhodne'
                )
                .checked;


        const vybranyPorad =
            document
                .getElementById(
                    'filtr-poradu'
                )
                .value;


        const vybraneDny =
            ziskejVybraneDny();


        const vybraneCasy =
            ziskejVybraneCasy();


        const dnes =
            dnesBezCasu();


        let data =
            vsechnyPorady.filter(
                (porad) => {


                    if (
                        porad.volno === null
                    ) {

                        return false;
                    }


                    if (
                        datumNaCislo(
                            porad.datum
                        ) < dnes
                    ) {

                        return false;
                    }


                    if (
                        vybranyPorad &&
                        porad.nazev !==
                            vybranyPorad
                    ) {

                        return false;
                    }


                    const den =
                        cisloDneVTydnu(
                            porad.datum
                        );


                    if (
                        !vybraneDny.has(
                            den
                        )
                    ) {

                        return false;
                    }


                    if (
                        !vybraneCasy.has(
                            porad.od
                        )
                    ) {

                        return false;
                    }


                    if (
                        Number.isInteger(
                            pocetZaku
                        ) &&
                        pocetZaku >= 0 &&
                        jenVhodne &&
                        porad.volno <
                            pocetZaku
                    ) {

                        return false;
                    }


                    return true;
                }
            );


        data =
            serad(
                data
            );


        let html = `

            <div class="souhrn">

                Nalezeno:

                <strong>
                    ${data.length}
                </strong>

                termínů

                ${
                    vybranyPorad

                        ? `pro pořad <strong>${escapeHTML(
                            vybranyPorad
                        )}</strong>`

                        : ''
                }

                ${
                    jenVhodne &&
                    Number.isInteger(
                        pocetZaku
                    ) &&
                    pocetZaku >= 0

                        ? `s alespoň <strong>${pocetZaku}</strong> volnými místy`

                        : ''
                }.

                <br>

                Zobrazeny jsou pouze termíny od

                <strong>
                    ${formatDnesniDatum()}
                </strong>

                dále.

            </div>


            <table>

                <thead>

                    <tr>

                        <th data-sort="datum">
                            Datum
                            ${sipka('datum')}
                        </th>

                        <th data-sort="cas">
                            Čas
                            ${sipka('cas')}
                        </th>

                        <th data-sort="nazev">
                            Pořad
                            ${sipka('nazev')}
                        </th>

                        <th data-sort="volno">
                            Volno
                            ${sipka('volno')}
                        </th>

                        <th data-sort="celkem">
                            Kapacita
                            ${sipka('celkem')}
                        </th>

                        <th>
                            Pro třídu
                        </th>

                    </tr>

                </thead>


                <tbody>

        `;


        data.forEach(
            (porad) => {

                const vhodne =
                    Number.isInteger(
                        pocetZaku
                    ) &&
                    pocetZaku >= 0

                        ? porad.volno >=
                            pocetZaku

                        : false;


                html += `

                    <tr class="${
                        vhodne
                            ? 'vhodne'
                            : 'nevhodne'
                    }">


                        <td>

                            ${escapeHTML(
                                porad.datum
                            )}

                            <span class="datum-den">

                                ${escapeHTML(
                                    denVTydnu(
                                        porad.datum
                                    )
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHTML(
                                porad.od
                            )}

                            –

                            ${escapeHTML(
                                porad.do
                            )}

                        </td>


                        <td>

                            <span
                                class="modry-symbol"
                            ></span>

                            <a
                                class="program-link"
                                href="${escapeHTML(
                                    porad.url
                                )}"
                                title="Otevřít konkrétní událost"
                            >

                                ${escapeHTML(
                                    porad.nazev
                                )}

                            </a>

                        </td>


                        <td class="volno">

                            ${porad.volno}

                        </td>


                        <td>

                            ${porad.celkem}

                        </td>


                        <td class="${
                            vhodne
                                ? 'ano'
                                : 'ne'
                        }">

                            ${
                                vhodne
                                    ? '✓ ANO'
                                    : '✕ NE'
                            }

                        </td>


                    </tr>

                `;
            }
        );


        html += `

                </tbody>

            </table>

        `;


        if (
            data.length === 0
        ) {

            html += `

                <p>
                    Nebyl nalezen žádný termín odpovídající zvoleným filtrům.
                </p>

            `;
        }


        document
            .getElementById(
                'vysledek'
            )
            .innerHTML =
                html;


        document.querySelectorAll(
            `#${PANEL_ID} th[data-sort]`
        )
        .forEach(
            (hlavicka) => {

                hlavicka.addEventListener(
                    'click',
                    () => {

                        const sloupec =
                            hlavicka.dataset.sort;


                        if (
                            razeni.sloupec ===
                            sloupec
                        ) {

                            razeni.smer =
                                razeni.smer ===
                                'asc'

                                    ? 'desc'
                                    : 'asc';

                        } else {

                            razeni.sloupec =
                                sloupec;

                            razeni.smer =
                                'asc';
                        }


                        vykresli();
                    }
                );
            }
        );
    }


    // =========================================================
    // 18. PROHLEDÁNÍ OBDOBÍ
    // =========================================================

    async function prohledej() {

        const tlacitko =
            document.getElementById(
                'hledat'
            );


        const status =
            document.getElementById(
                'status'
            );


        const pocetInput =
            document.getElementById(
                'pocet-zaku'
            );


        try {

            status.classList.remove(
                'chyba'
            );


            pocetInput.classList.remove(
                'input-chyba'
            );


            // -------------------------------------------------
            // POČET ŽÁKŮ
            // -------------------------------------------------

            const pocetZakuText =
                pocetInput
                    .value
                    .trim();


            const pocetZaku =
                Number(
                    pocetZakuText
                );


            if (
                pocetZakuText === '' ||
                !Number.isInteger(
                    pocetZaku
                ) ||
                pocetZaku < 0
            ) {

                status.textContent =
                    'CHYBA: Počet žáků musí být celé nezáporné číslo.';


                status.classList.add(
                    'chyba'
                );


                pocetInput.classList.add(
                    'input-chyba'
                );


                pocetInput.focus();


                alert(
                    'Nesmyslný počet žáků.\n\n' +
                    'Zadej celé nezáporné číslo, například 0, 25, 45 nebo 120.'
                );


                return;
            }


            // -------------------------------------------------
            // OBDOBÍ
            // -------------------------------------------------

            const od =
                inputNaMesic(
                    document
                        .getElementById(
                            'mesic-od'
                        )
                        .value
                );


            const doMesice =
                inputNaMesic(
                    document
                        .getElementById(
                            'mesic-do'
                        )
                        .value
                );


            if (
                !od.rok ||
                !od.mesic ||
                !doMesice.rok ||
                !doMesice.mesic
            ) {

                throw new Error(
                    'Vyber měsíc OD i DO.'
                );
            }


            const zadanyZacatek =
                od.rok * 12 +
                od.mesic;


            const zadanyKonec =
                doMesice.rok * 12 +
                doMesice.mesic;


            if (
                zadanyZacatek >
                zadanyKonec
            ) {

                throw new Error(
                    'Datum OD musí být před datem DO.'
                );
            }


            const dnes =
                new Date();


            const aktualniRok =
                dnes.getFullYear();


            const aktualniMesic =
                dnes.getMonth() + 1;


            const aktualniMesicCislo =
                aktualniRok * 12 +
                aktualniMesic;


            if (
                zadanyKonec <
                aktualniMesicCislo
            ) {

                throw new Error(
                    'Zvolené období již celé leží v minulosti.'
                );
            }


            let hledatOdRok =
                od.rok;


            let hledatOdMesic =
                od.mesic;


            if (
                zadanyZacatek <
                aktualniMesicCislo
            ) {

                hledatOdRok =
                    aktualniRok;


                hledatOdMesic =
                    aktualniMesic;
            }


            const mesice =
                seznamMesicu(
                    hledatOdRok,
                    hledatOdMesic,
                    doMesice.rok,
                    doMesice.mesic
                );


            if (
                mesice.length > 12
            ) {

                throw new Error(
                    'Najednou lze prohledat maximálně 12 měsíců.'
                );
            }


            // -------------------------------------------------
            // START
            // -------------------------------------------------

            tlacitko.disabled =
                true;


            vsechnyPorady =
                [];


            document
                .getElementById(
                    'vysledek'
                )
                .innerHTML =
                    '';


            document
                .getElementById(
                    'filtr-poradu'
                )
                .innerHTML =
                    '<option value="">Všechny pořady</option>';


            document
                .getElementById(
                    'filtr-casy'
                )
                .innerHTML =
                    '<label>Načítám časy...</label>';


            // -------------------------------------------------
            // VŠECHNY DNY ZNOVU ZAPNOUT
            // -------------------------------------------------

            document.querySelectorAll(
                `#${PANEL_ID} .filtr-den`
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        true;
                }
            );


            aktualizujSouhrnDnu();


            // -------------------------------------------------
            // NAČTENÍ MĚSÍCŮ
            // -------------------------------------------------

            for (
                let i = 0;
                i < mesice.length;
                i++
            ) {

                const m =
                    mesice[i];


                status.textContent =
                    `Načítám ${m.mesic}/${m.rok} (${i + 1} z ${mesice.length})…`;


                const poradyMesice =
                    await nactiMesic(
                        m.rok,
                        m.mesic
                    );


                const budouciPorady =
                    poradyMesice.filter(
                        (porad) =>
                            datumNaCislo(
                                porad.datum
                            ) >=
                            dnesBezCasu()
                    );


                vsechnyPorady.push(
                    ...budouciPorady
                );
            }


            // -------------------------------------------------
            // KAPACITY
            // -------------------------------------------------

            const ids =
                [
                    ...new Set(
                        vsechnyPorady.map(
                            p =>
                                p.scheduleId
                        )
                    )
                ];


            status.textContent =
                `Nalezeno ${vsechnyPorady.length} budoucích modrých termínů. Načítám jejich kapacity…`;


            const kapacity =
                await nactiKapacityPoDavkach(
                    ids,
                    (text) => {

                        status.textContent =
                            text;
                    }
                );


            vsechnyPorady =
                vsechnyPorady.map(
                    (porad) => {

                        const kapa =
                            kapacity[
                                String(
                                    porad.scheduleId
                                )
                            ];


                        if (kapa) {

                            porad.volno =
                                kapa.volno;


                            porad.celkem =
                                kapa.celkem;
                        }


                        return porad;
                    }
                );


            // -------------------------------------------------
            // FILTRY
            // -------------------------------------------------

            naplnFiltrPoradu();

            naplnFiltrCasu();

            aktualizujSouhrnDnu();

            aktualizujSouhrnCasu();


            // -------------------------------------------------
            // HOTOVO
            // -------------------------------------------------

            status.textContent =
                `Hotovo. Vyhledávání od ${formatDnesniDatum()} do konce zvoleného období. Nalezeno ${vsechnyPorady.length} modrých termínů.`;


            vykresli();


        } catch (chyba) {

            console.error(
                chyba
            );


            status.textContent =
                'CHYBA: ' +
                chyba.message;


            status.classList.add(
                'chyba'
            );


            alert(
                chyba.message
            );


        } finally {

            tlacitko.disabled =
                false;
        }
    }


    // =========================================================
    // 19. UDÁLOSTI
    // =========================================================

    document
        .getElementById(
            'zavrit'
        )
        .addEventListener(
            'click',
            () => {

                overlay.remove();

                style.remove();
            }
        );


    document
        .getElementById(
            'hledat'
        )
        .addEventListener(
            'click',
            prohledej
        );


    document
        .getElementById(
            'jen-vhodne'
        )
        .addEventListener(
            'change',
            vykresli
        );


    document
        .getElementById(
            'filtr-poradu'
        )
        .addEventListener(
            'change',
            vykresli
        );


    // =========================================================
    // DNY
    // =========================================================

    document.querySelectorAll(
        `#${PANEL_ID} .filtr-den`
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                'change',
                () => {

                    aktualizujSouhrnDnu();


                    if (
                        vsechnyPorady.length >
                        0
                    ) {

                        vykresli();
                    }
                }
            );
        }
    );


    // =========================================================
    // POČET ŽÁKŮ
    // =========================================================

    document
        .getElementById(
            'pocet-zaku'
        )
        .addEventListener(
            'input',
            () => {

                const input =
                    document.getElementById(
                        'pocet-zaku'
                    );


                const status =
                    document.getElementById(
                        'status'
                    );


                input.classList.remove(
                    'input-chyba'
                );


                status.classList.remove(
                    'chyba'
                );


                if (
                    vsechnyPorady.length >
                    0
                ) {

                    vykresli();
                }
            }
        );


    // =========================================================
    // KLIK MIMO FILTRY JE ZAVŘE
    // =========================================================

    document.addEventListener(
        'click',
        (event) => {

            document
                .querySelectorAll(
                    `#${PANEL_ID} details.filtr[open]`
                )
                .forEach(
                    details => {

                        if (
                            !details.contains(
                                event.target
                            )
                        ) {

                            details.removeAttribute(
                                'open'
                            );
                        }
                    }
                );
        }
    );


    // =========================================================
    // VÝCHOZÍ STAV
    // =========================================================

    aktualizujSouhrnDnu();

})();