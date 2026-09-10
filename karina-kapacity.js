(async function () {

    // =========================================================
    // CARINA – přehled kapacit školních pořadů
    // =========================================================


    // =========================================================
    // ZÁKLADNÍ NASTAVENÍ
    // =========================================================

    const PANEL_ID = 'skolni-prehled-kapacit';
    const STYLE_ID = 'skolni-prehled-style';

    const RESOURCE_STORAGE_KEY =
        'carina-skolni-prehled-resource';


    // Výchozí období
    const VYCHOZI_OD = '2026-09';
    const VYCHOZI_DO = '2027-01';


    // Výchozí časy
    const VYCHOZI_CASY = [
        '09:00',
        '10:15',
        '11:30'
    ];


    // JavaScript getDay():
    // 0 = ne
    // 1 = po
    // 2 = út
    // 3 = st
    // 4 = čt
    // 5 = pá
    // 6 = so

    const VYCHOZI_DNY = new Set([
        2,
        3,
        4,
        5
    ]);


    // Pořadí školních skupin ve filtru
    const PORADI_SKUPIN = [
        'MS',
        'ZS1',
        'ZS2',
        'SS'
    ];


    // =========================================================
    // EXTERNÍ JSON
    // =========================================================

    // Hlavní zdroj:
    // GitHub RAW
    const DATA_URL_RAW =
        'https://raw.githubusercontent.com/PetrKrata/carina-kapacity/main/porady-skupiny.json';


    // Záložní zdroj:
    // GitHub Pages
    const DATA_URL_PAGES =
        'https://petrkrata.github.io/carina-kapacity/porady-skupiny.json';


    // Data načtená z JSON
    let CARINA_SKUPINY = {};
    let CARINA_PORADY_SKUPINY = {};

    let dataSkupinNactena = false;


    // =========================================================
    // ODSTRANĚNÍ STARÉHO PANELU
    // =========================================================

    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();


    // =========================================================
    // NAČTENÍ JSON
    // =========================================================

    async function nactiJSONZURL(url) {

        const separator =
            url.includes('?')
                ? '&'
                : '?';

        const urlBezCache =
            url +
            separator +
            '_=' +
            Date.now();


        const response =
            await fetch(
                urlBezCache,
                {
                    method: 'GET',

                    mode: 'cors',

                    cache: 'no-store',

                    credentials: 'omit'
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        return await response.json();
    }


    async function nactiDataSkupin() {

        const adresy = [
            DATA_URL_RAW,
            DATA_URL_PAGES
        ];


        for (const url of adresy) {

            try {

                console.log(
                    'CARINA: načítám věkové skupiny:',
                    url
                );


                const data =
                    await nactiJSONZURL(url);


                if (
                    !data ||
                    typeof data !== 'object'
                ) {

                    throw new Error(
                        'JSON neobsahuje objekt.'
                    );
                }


                if (
                    !data.skupiny ||
                    typeof data.skupiny !== 'object'
                ) {

                    throw new Error(
                        'Chybí objekt "skupiny".'
                    );
                }


                if (
                    !data.porady ||
                    typeof data.porady !== 'object'
                ) {

                    throw new Error(
                        'Chybí objekt "porady".'
                    );
                }


                CARINA_SKUPINY =
                    data.skupiny;


                CARINA_PORADY_SKUPINY =
                    data.porady;


                console.log(
                    'CARINA: věkové skupiny načteny.',
                    CARINA_PORADY_SKUPINY
                );


                return true;


            } catch (error) {

                console.warn(
                    'CARINA: nepodařilo se načíst:',
                    url,
                    error
                );
            }
        }


        CARINA_SKUPINY = {};
        CARINA_PORADY_SKUPINY = {};

        return false;
    }


    // =========================================================
    // RESOURCE
    // =========================================================

    function ulozResource(resource) {

        try {

            localStorage.setItem(
                RESOURCE_STORAGE_KEY,
                resource
            );

        } catch (e) {

            // nevadí
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

        // -----------------------------------------------------
        // 1. Resource v aktuální URL
        // -----------------------------------------------------

        try {

            const aktualniURL =
                new URL(
                    window.location.href
                );


            const resource =
                aktualniURL
                    .searchParams
                    .get('resource');


            if (resource) {

                ulozResource(resource);

                return resource;
            }

        } catch (e) {

            // pokračujeme
        }


        // -----------------------------------------------------
        // 2. Resource v odkazu na stránce
        // -----------------------------------------------------

        for (
            const odkaz
            of document.querySelectorAll(
                'a[href]'
            )
        ) {

            try {

                const url =
                    new URL(
                        odkaz.href,
                        window.location.origin
                    );


                const resource =
                    url
                        .searchParams
                        .get('resource');


                if (resource) {

                    ulozResource(resource);

                    return resource;
                }

            } catch (e) {

                // pokračujeme
            }
        }


        // -----------------------------------------------------
        // 3. Input name="resource"
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // 4. data-resource
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // 5. Poslední známý resource
        // -----------------------------------------------------

        return nactiUlozenyResource();
    }


    const resource =
        zjistiResource();


    if (!resource) {

        alert(
            'Nepodařilo se zjistit CARINA resource.\n\n' +
            'Spusť program jednou z měsíčního kalendáře.'
        );

        return;
    }


    // =========================================================
    // POMOCNÉ FUNKCE
    // =========================================================

    function inputNaMesic(text) {

        const [
            rok,
            mesic
        ] =
            text
                .split('-')
                .map(Number);


        return {
            rok,
            mesic
        };
    }


    function seznamMesicu(
        od,
        doMesice
    ) {

        const start =
            inputNaMesic(od);

        const konec =
            inputNaMesic(doMesice);


        const vysledek = [];


        let rok =
            start.rok;

        let mesic =
            start.mesic;


        let pojistka = 0;


        while (
            rok < konec.rok ||
            (
                rok === konec.rok &&
                mesic <= konec.mesic
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


            pojistka++;


            if (pojistka > 24) {
                break;
            }
        }


        return vysledek;
    }


    function datumNaCislo(datum) {

        if (!datum) {
            return 0;
        }


        const [
            den,
            mesic,
            rok
        ] =
            datum
                .split('.')
                .map(Number);


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

        const d =
            new Date();


        return (
            d.getDate() +
            '.' +
            (d.getMonth() + 1) +
            '.' +
            d.getFullYear()
        );
    }


    function denVTydnu(datum) {

        if (!datum) {
            return '';
        }


        const [
            den,
            mesic,
            rok
        ] =
            datum
                .split('.')
                .map(Number);


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

        if (!datum) {
            return null;
        }


        const [
            den,
            mesic,
            rok
        ] =
            datum
                .split('.')
                .map(Number);


        return new Date(
            rok,
            mesic - 1,
            den
        ).getDay();
    }


    function casNaMinuty(cas) {

        if (!cas) {
            return 0;
        }


        const [
            hodina,
            minuta
        ] =
            cas
                .split(':')
                .map(Number);


        return (
            hodina * 60 +
            minuta
        );
    }


    function sloupecNaCas(column) {

        const minuty =
            (8 * 60) +
            (
                (column - 2) *
                15
            );


        const hodiny =
            Math.floor(
                minuty / 60
            );


        const mins =
            minuty % 60;


        return (
            String(hodiny)
                .padStart(
                    2,
                    '0'
                ) +
            ':' +
            String(mins)
                .padStart(
                    2,
                    '0'
                )
        );
    }


    function escapeHTML(text) {

        return String(
            text ?? ''
        )
            .replaceAll(
                '&',
                '&amp;'
            )
            .replaceAll(
                '<',
                '&lt;'
            )
            .replaceAll(
                '>',
                '&gt;'
            )
            .replaceAll(
                '"',
                '&quot;'
            )
            .replaceAll(
                "'",
                '&#039;'
            );
    }


    // =========================================================
    // GRID
    // =========================================================

    function gridRowStart(element) {

        let row =
            parseInt(
                element.style.gridRowStart,
                10
            );


        if (row) {
            return row;
        }


        const raw =
            element.style.gridRow ||
            '';


        row =
            parseInt(
                raw.split('/')[0],
                10
            );


        return row || null;
    }


    function gridColumnBounds(element) {

        let start =
            parseInt(
                element.style.gridColumnStart,
                10
            );


        let end =
            parseInt(
                element.style.gridColumnEnd,
                10
            );


        if (
            start &&
            end
        ) {

            return {
                start,
                end
            };
        }


        const raw =
            element.style.gridColumn ||
            '';


        const parts =
            raw
                .split('/')
                .map(
                    x =>
                        parseInt(
                            x.trim(),
                            10
                        )
                );


        start =
            start ||
            parts[0];


        end =
            end ||
            parts[1];


        return {
            start,
            end
        };
    }


    // =========================================================
    // CARINA URL
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
    // ROZPOZNÁNÍ MODRÉHO POŘADU
    // =========================================================

    function jeModryPorad(show) {

        const styleText =
            (
                show.getAttribute(
                    'style'
                ) ||
                ''
            )
                .toLowerCase()
                .replace(
                    /\s/g,
                    ''
                );


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
                .replace(
                    /\s/g,
                    ''
                );


        return (
            barva === '#000075' ||
            barva === 'rgb(0,0,117)'
        );
    }


    // =========================================================
    // ZPRACOVÁNÍ HTML MĚSÍCE
    // =========================================================

    function zpracujMesic(
        doc,
        rok,
        mesic
    ) {

        const dnyPodleRadku =
            new Map();


        doc
            .querySelectorAll(
                '.day[data-date]'
            )
            .forEach(
                day => {

                    const row =
                        gridRowStart(day);


                    const datum =
                        day.dataset.date;


                    if (
                        row &&
                        datum
                    ) {

                        dnyPodleRadku.set(
                            row,
                            datum
                        );
                    }
                }
            );


        const porady = [];


        doc
            .querySelectorAll(
                '.show'
            )
            .forEach(
                show => {

                    if (
                        !jeModryPorad(show)
                    ) {
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


                    const nazev =
                        nameElement
                            .textContent
                            .trim();


                    const capacityId =
                        capacityElement.id ||
                        '';


                    const scheduleId =
                        capacityId.replace(
                            /^capa/,
                            ''
                        );


                    if (!scheduleId) {
                        return;
                    }


                    const uuid =
                        show.dataset.uuid ||
                        '';


                    if (!uuid) {
                        return;
                    }


                    const row =
                        gridRowStart(show);


                    const columns =
                        gridColumnBounds(
                            show
                        );


                    if (
                        !row ||
                        !columns.start ||
                        !columns.end
                    ) {
                        return;
                    }


                    const datum =
                        dnyPodleRadku.get(
                            row
                        );


                    if (!datum) {
                        return;
                    }


                    const od =
                        sloupecNaCas(
                            columns.start
                        );


                    const doCas =
                        sloupecNaCas(
                            columns.end
                        );


                    porady.push({

                        datum,

                        od,

                        do: doCas,

                        nazev,

                        scheduleId,

                        uuid,

                        rok,

                        mesic,

                        url:
                            urlUdalosti(
                                uuid
                            ),

                        volno: null,

                        celkem: null
                    });
                }
            );


        return porady;
    }


    // =========================================================
    // NAČTENÍ MĚSÍCE
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

                    credentials:
                        'same-origin'
                }
            );


        if (!response.ok) {

            throw new Error(
                `Chyba při načítání ${mesic}/${rok}: ` +
                `HTTP ${response.status}`
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
    // KAPACITY
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
                'Chyba při načítání kapacit: ' +
                `HTTP ${response.status}`
            );
        }


        const json =
            await response.json();


        const mapa = {};


        json.forEach(
            item => {

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
            }
        );


        return mapa;
    }


    async function nactiKapacityPoDavkach(
        ids
    ) {

        const vysledek = {};


        const DAVKA = 150;


        for (
            let i = 0;
            i < ids.length;
            i += DAVKA
        ) {

            const davka =
                ids.slice(
                    i,
                    i + DAVKA
                );


            const cast =
                await nactiKapacity(
                    davka
                );


            Object.assign(
                vysledek,
                cast
            );
        }


        return vysledek;
    }


    // =========================================================
    // CSS
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
    z-index: 999999;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);

    width: calc(100% - 40px);
    max-width: 1250px;
    max-height: calc(100vh - 40px);

    overflow: auto;

    background: white;
    color: #222;

    border: 1px solid #aaa;
    border-radius: 10px;

    box-shadow:
        0 8px 35px
        rgba(0,0,0,0.35);

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 14px;
}


#${PANEL_ID} * {
    box-sizing: border-box;
}


#${PANEL_ID} .hlavicka {
    position: sticky;

    top: 0;

    z-index: 20;

    display: flex;

    justify-content:
        space-between;

    align-items: center;

    padding:
        12px 16px;

    background:
        #20242a;

    color:
        white;

    border-radius:
        10px 10px 0 0;
}


#${PANEL_ID} .hlavicka h2 {
    margin: 0;

    font-size:
        18px;
}


#${PANEL_ID} .zavrit {
    border: none;

    background:
        transparent;

    color:
        white;

    font-size:
        23px;

    line-height:
        1;

    cursor:
        pointer;
}


#${PANEL_ID} .obsah {
    padding:
        15px;
}


#${PANEL_ID} .ovladani {
    display:
        flex;

    flex-direction:
        column;

    gap:
        12px;

    padding:
        15px;

    background:
        #f3f4f6;

    border-radius:
        8px;

    margin-bottom:
        15px;
}


#${PANEL_ID} .ovladani-radek {
    display:
        flex;

    flex-wrap:
        wrap;

    gap:
        18px;

    align-items:
        center;
}


#${PANEL_ID} label {
    font-weight:
        600;
}


#${PANEL_ID} input,
#${PANEL_ID} select,
#${PANEL_ID} button {
    font:
        inherit;
}


#${PANEL_ID} input[type="month"],
#${PANEL_ID} input[type="number"],
#${PANEL_ID} select {
    padding:
        6px 8px;

    border:
        1px solid #aaa;

    border-radius:
        5px;

    background:
        white;
}


#${PANEL_ID} #pocet-zaku {
    width:
        80px;
}


#${PANEL_ID} #hledat {
    padding:
        8px 15px;

    border:
        none;

    border-radius:
        5px;

    background:
        #1d5fa7;

    color:
        white;

    font-weight:
        bold;

    cursor:
        pointer;
}


#${PANEL_ID} #hledat:hover {
    background:
        #174e89;
}


#${PANEL_ID} #hledat:disabled {
    opacity:
        0.6;

    cursor:
        wait;
}


#${PANEL_ID} .vhodne-label {
    display:
        flex;

    align-items:
        center;

    gap:
        6px;

    white-space:
        nowrap;
}


#${PANEL_ID} .porad-label {
    display:
        flex;

    align-items:
        center;

    gap:
        7px;
}


#${PANEL_ID} .porad-label select {
    min-width:
        320px;

    max-width:
        500px;
}


/* =========================================================
   ROZBALOVACÍ FILTRY
   ========================================================= */

#${PANEL_ID} details.filtr {
    position:
        relative;
}


#${PANEL_ID} details.filtr summary {
    min-width:
        130px;

    padding:
        7px 10px;

    border:
        1px solid #aaa;

    border-radius:
        5px;

    background:
        white;

    cursor:
        pointer;

    font-weight:
        600;

    list-style:
        none;
}


#${PANEL_ID} details.filtr summary::-webkit-details-marker {
    display:
        none;
}


#${PANEL_ID} details.filtr summary::after {
    content:
        " ▼";

    font-size:
        10px;
}


#${PANEL_ID} details.filtr[open] summary::after {
    content:
        " ▲";
}


#${PANEL_ID} .filtr-menu {
    position:
        absolute;

    top:
        calc(100% + 4px);

    left:
        0;

    z-index:
        100;

    min-width:
        190px;

    max-height:
        320px;

    overflow-y:
        auto;

    padding:
        9px;

    background:
        white;

    border:
        1px solid #aaa;

    border-radius:
        6px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,0.2);
}


#${PANEL_ID} .filtr-menu label {
    display:
        flex;

    align-items:
        center;

    gap:
        7px;

    padding:
        5px 4px;

    font-weight:
        normal;

    white-space:
        nowrap;

    cursor:
        pointer;
}


#${PANEL_ID} .filtr-menu label:hover {
    background:
        #f1f3f5;
}


#${PANEL_ID} .filtr-menu input {
    margin:
        0;
}


/* =========================================================
   STAV
   ========================================================= */

#${PANEL_ID} #stav {
    margin-bottom:
        12px;

    padding:
        8px 10px;

    border-radius:
        5px;

    background:
        #eef2f6;
}


#${PANEL_ID} #stav.chyba {
    background:
        #ffe4e4;

    color:
        #900;
}


#${PANEL_ID} #stav.varovani {
    background:
        #fff1c7;

    color:
        #664d03;
}


/* =========================================================
   TABULKA
   ========================================================= */

#${PANEL_ID} table {
    width:
        100%;

    border-collapse:
        collapse;

    background:
        white;
}


#${PANEL_ID} th,
#${PANEL_ID} td {
    padding:
        7px 9px;

    border-bottom:
        1px solid #ddd;

    text-align:
        left;
}


#${PANEL_ID} th {
    position:
        sticky;

    top:
        47px;

    z-index:
        10;

    background:
        #e5e7eb;

    white-space:
        nowrap;
}


#${PANEL_ID} th[data-sort] {
    cursor:
        pointer;

    user-select:
        none;
}


#${PANEL_ID} th[data-sort]:hover {
    background:
        #d6d9dd;
}


#${PANEL_ID} tr.vhodne {
    background:
        #e7f7e7;
}


#${PANEL_ID} tr.nevhodne {
    background:
        #fde9e9;
}


#${PANEL_ID} tr:hover {
    filter:
        brightness(0.97);
}


#${PANEL_ID} td a {
    color:
        #004b9b;

    font-weight:
        600;

    text-decoration:
        none;
}


#${PANEL_ID} td a:hover {
    text-decoration:
        underline;
}


#${PANEL_ID} .datum-den {
    margin-left:
        3px;

    font-weight:
        bold;

    color:
        #555;
}


#${PANEL_ID} .ano {
    color:
        #087a16;

    font-weight:
        bold;
}


#${PANEL_ID} .ne {
    color:
        #b00020;

    font-weight:
        bold;
}


#${PANEL_ID} .chyba-input {
    border-color:
        red !important;

    background:
        #fff0f0 !important;
}


#${PANEL_ID} .bez-vysledku {
    padding:
        20px;

    text-align:
        center;

    color:
        #666;
}


/* =========================================================
   MENŠÍ OBRAZOVKA
   ========================================================= */

@media (max-width: 900px) {

    #${PANEL_ID} {

        width:
            calc(100% - 15px);

        top:
            8px;

        max-height:
            calc(100vh - 16px);
    }


    #${PANEL_ID} .ovladani-radek {

        gap:
            10px;
    }


    #${PANEL_ID} .porad-label select {

        min-width:
            220px;

        max-width:
            100%;
    }
}

`;


    document.head.appendChild(
        style
    );


    // =========================================================
    // PANEL
    // =========================================================

    const panel =
        document.createElement(
            'div'
        );


    panel.id =
        PANEL_ID;


    panel.innerHTML = `

<div class="hlavicka">

    <h2>
        Školní pořady – přehled volných míst
    </h2>

    <button
        class="zavrit"
        title="Zavřít"
    >
        ×
    </button>

</div>


<div class="obsah">


    <div class="ovladani">


        <!-- =================================================
             HORNÍ ŘÁDEK
             ================================================= -->

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


        <!-- =================================================
             SPODNÍ ŘÁDEK
             ================================================= -->

        <div class="ovladani-radek">


            <!-- ČASY -->

            <details class="filtr">

                <summary id="souhrn-casy">
                    Časy
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
                    Dny
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
                        >

                        sobota

                    </label>


                    <label>

                        <input
                            type="checkbox"
                            class="filtr-den"
                            value="0"
                        >

                        neděle

                    </label>


                </div>

            </details>


            <!-- ŠKOLA -->

            <details class="filtr">

                <summary id="souhrn-skola">
                    Škola
                </summary>


                <div
                    id="filtr-skola"
                    class="filtr-menu"
                >

                    <label>
                        Načítám skupiny…
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


    <div id="stav">

        Připravuji program…

    </div>


    <div id="vysledky">

        <div class="bez-vysledku">

            Zvol období a stiskni
            „PROHLEDAT OBDOBÍ“.

        </div>

    </div>


</div>

`;


    document.body.appendChild(
        panel
    );


    // =========================================================
    // PROMĚNNÉ PROGRAMU
    // =========================================================

    let vsechnyPorady = [];


    let razeni = {

        sloupec:
            'datum',

        smer:
            'asc'
    };


    // =========================================================
    // ELEMENTY
    // =========================================================

    const stav =
        document.getElementById(
            'stav'
        );


    const vysledky =
        document.getElementById(
            'vysledky'
        );


    const hledatButton =
        document.getElementById(
            'hledat'
        );


    const pocetZakuInput =
        document.getElementById(
            'pocet-zaku'
        );


    const filtrPoradu =
        document.getElementById(
            'filtr-poradu'
        );


    // =========================================================
    // STAVOVÁ HLÁŠKA
    // =========================================================

    function nastavStav(
        text,
        typ = ''
    ) {

        stav.textContent =
            text;

        stav.className =
            typ;
    }


    // =========================================================
    // FILTR POŘADU
    // =========================================================

    function naplnFiltrPoradu() {

        const nazvy =
            [
                ...new Set(
                    vsechnyPorady
                        .map(
                            p =>
                                p.nazev
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


        filtrPoradu.innerHTML =
            '<option value="">' +
            'Všechny pořady' +
            '</option>';


        nazvy.forEach(
            nazev => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    nazev;


                option.textContent =
                    nazev;


                filtrPoradu.appendChild(
                    option
                );
            }
        );
    }


    // =========================================================
    // FILTR ČASŮ
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
                            p =>
                                p.od
                        )
                        .filter(Boolean)
                )
            ]
                .sort(
                    (a, b) =>
                        casNaMinuty(a) -
                        casNaMinuty(b)
                );


        kontejner.innerHTML =
            '';


        if (
            casy.length === 0
        ) {

            kontejner.innerHTML =
                '<label>Žádné časy.</label>';


            aktualizujSouhrnCasu();

            return;
        }


        casy.forEach(
            cas => {

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
                    VYCHOZI_CASY.includes(
                        cas
                    );


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


    function aktualizujSouhrnCasu() {

        const souhrn =
            document.getElementById(
                'souhrn-casy'
            );


        const vse =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-cas`
                )
            ];


        const oznacene =
            vse.filter(
                checkbox =>
                    checkbox.checked
            );


        if (
            vse.length === 0
        ) {

            souhrn.textContent =
                'Časy';

            return;
        }


        if (
            oznacene.length ===
            vse.length
        ) {

            souhrn.textContent =
                'Časy: všechny';

        } else if (
            oznacene.length === 0
        ) {

            souhrn.textContent =
                'Časy: žádné';

        } else {

            souhrn.textContent =
                `Časy: ${oznacene.length}/${vse.length}`;
        }
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
    // FILTR DNŮ
    // =========================================================

    function aktualizujSouhrnDnu() {

        const souhrn =
            document.getElementById(
                'souhrn-dny'
            );


        const vse =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-den`
                )
            ];


        const oznacene =
            vse.filter(
                checkbox =>
                    checkbox.checked
            );


        if (
            oznacene.length ===
            vse.length
        ) {

            souhrn.textContent =
                'Dny: všechny';

        } else if (
            oznacene.length === 0
        ) {

            souhrn.textContent =
                'Dny: žádné';

        } else {

            souhrn.textContent =
                `Dny: ${oznacene.length}/${vse.length}`;
        }
    }


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


    // =========================================================
    // FILTR ŠKOLY
    // =========================================================

    function naplnFiltrSkoly() {

        const kontejner =
            document.getElementById(
                'filtr-skola'
            );


        kontejner.innerHTML =
            '';


        if (
            !dataSkupinNactena
        ) {

            kontejner.innerHTML =
                '<label>Data skupin nejsou dostupná.</label>';


            aktualizujSouhrnSkoly();

            return;
        }


        PORADI_SKUPIN.forEach(
            kod => {

                const nazev =
                    CARINA_SKUPINY[
                        kod
                    ];


                if (!nazev) {
                    return;
                }


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
                    'filtr-skola-checkbox';


                checkbox.value =
                    kod;


                // Výchozí stav:
                // všechny školy
                checkbox.checked =
                    true;


                checkbox.addEventListener(
                    'change',
                    () => {

                        aktualizujSouhrnSkoly();

                        if (
                            vsechnyPorady.length
                        ) {

                            vykresli();
                        }
                    }
                );


                label.appendChild(
                    checkbox
                );


                label.appendChild(
                    document.createTextNode(
                        nazev
                    )
                );


                kontejner.appendChild(
                    label
                );
            }
        );


        aktualizujSouhrnSkoly();
    }


    function aktualizujSouhrnSkoly() {

        const souhrn =
            document.getElementById(
                'souhrn-skola'
            );


        if (
            !dataSkupinNactena
        ) {

            souhrn.textContent =
                'Škola: nedostupná';

            return;
        }


        const vse =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-skola-checkbox`
                )
            ];


        const oznacene =
            vse.filter(
                checkbox =>
                    checkbox.checked
            );


        if (
            vse.length === 0
        ) {

            souhrn.textContent =
                'Škola';

        } else if (
            oznacene.length ===
            vse.length
        ) {

            souhrn.textContent =
                'Škola: všechny';

        } else if (
            oznacene.length === 0
        ) {

            souhrn.textContent =
                'Škola: žádná';

        } else {

            souhrn.textContent =
                `Škola: ${oznacene.length}/${vse.length}`;
        }
    }


    function ziskejVybraneSkoly() {

        return new Set(

            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-skola-checkbox:checked`
                )
            ]
                .map(
                    checkbox =>
                        checkbox.value
                )
        );
    }


    function odpovidaSkole(
        porad,
        vybraneSkoly
    ) {

        // Pokud JSON není dostupný,
        // školní filtr ignorujeme.
        if (
            !dataSkupinNactena
        ) {

            return true;
        }


        const checkboxy =
            [
                ...document.querySelectorAll(
                    `#${PANEL_ID} .filtr-skola-checkbox`
                )
            ];


        // Žádná škola
        if (
            vybraneSkoly.size === 0
        ) {

            return false;
        }


        // Pokud jsou vybrané všechny,
        // nevylučujeme ani nový nezařazený pořad.
        if (
            checkboxy.length > 0 &&
            vybraneSkoly.size ===
            checkboxy.length
        ) {

            return true;
        }


        const skupinyPoradu =
            CARINA_PORADY_SKUPINY[
                porad.nazev
            ] || [];


        return skupinyPoradu.some(
            skupina =>
                vybraneSkoly.has(
                    skupina
                )
        );
    }


    // =========================================================
    // ŘAZENÍ
    // =========================================================

    function seradPorady(
        porady
    ) {

        const kopie =
            [...porady];


        kopie.sort(
            (a, b) => {

                let vysledek = 0;


                switch (
                    razeni.sloupec
                ) {


                    case 'datum':

                        vysledek =
                            datumNaCislo(
                                a.datum
                            ) -
                            datumNaCislo(
                                b.datum
                            );


                        if (
                            vysledek === 0
                        ) {

                            vysledek =
                                casNaMinuty(
                                    a.od
                                ) -
                                casNaMinuty(
                                    b.od
                                );
                        }

                        break;


                    case 'cas':

                        vysledek =
                            casNaMinuty(
                                a.od
                            ) -
                            casNaMinuty(
                                b.od
                            );


                        if (
                            vysledek === 0
                        ) {

                            vysledek =
                                datumNaCislo(
                                    a.datum
                                ) -
                                datumNaCislo(
                                    b.datum
                                );
                        }

                        break;


                    case 'porad':

                        vysledek =
                            a.nazev.localeCompare(
                                b.nazev,
                                'cs'
                            );


                        if (
                            vysledek === 0
                        ) {

                            vysledek =
                                datumNaCislo(
                                    a.datum
                                ) -
                                datumNaCislo(
                                    b.datum
                                );


                            if (
                                vysledek === 0
                            ) {

                                vysledek =
                                    casNaMinuty(
                                        a.od
                                    ) -
                                    casNaMinuty(
                                        b.od
                                    );
                            }
                        }

                        break;


                    case 'volno':

                        vysledek =
                            Number(
                                a.volno
                            ) -
                            Number(
                                b.volno
                            );

                        break;


                    case 'kapacita':

                        vysledek =
                            Number(
                                a.celkem
                            ) -
                            Number(
                                b.celkem
                            );

                        break;
                }


                if (
                    razeni.smer ===
                    'desc'
                ) {

                    vysledek *= -1;
                }


                return vysledek;
            }
        );


        return kopie;
    }


    function sipkaRazeni(
        sloupec
    ) {

        if (
            razeni.sloupec !==
            sloupec
        ) {

            return '';
        }


        return (
            razeni.smer ===
            'asc'

                ? ' ▲'

                : ' ▼'
        );
    }


    // =========================================================
    // VYKRESLENÍ VÝSLEDKŮ
    // =========================================================

    function vykresli() {

        if (
            vsechnyPorady.length === 0
        ) {

            vysledky.innerHTML =
                '<div class="bez-vysledku">' +
                'Žádné načtené pořady.' +
                '</div>';

            return;
        }


        const pocetZaku =
            Number(
                pocetZakuInput.value
            );


        const jenVhodne =
            document
                .getElementById(
                    'jen-vhodne'
                )
                .checked;


        const vybranyPorad =
            filtrPoradu.value;


        const vybraneDny =
            ziskejVybraneDny();


        const vybraneCasy =
            ziskejVybraneCasy();


        const vybraneSkoly =
            ziskejVybraneSkoly();


        const dnes =
            dnesBezCasu();


        let zobrazene =
            vsechnyPorady.filter(
                porad => {


                    // Kapacita nebyla načtena
                    if (
                        porad.volno ===
                        null
                    ) {

                        return false;
                    }


                    // Minulost
                    if (
                        datumNaCislo(
                            porad.datum
                        ) <
                        dnes
                    ) {

                        return false;
                    }


                    // Konkrétní pořad
                    if (
                        vybranyPorad &&
                        porad.nazev !==
                        vybranyPorad
                    ) {

                        return false;
                    }


                    // Den týdne
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


                    // Čas
                    if (
                        !vybraneCasy.has(
                            porad.od
                        )
                    ) {

                        return false;
                    }


                    // Škola
                    if (
                        !odpovidaSkole(
                            porad,
                            vybraneSkoly
                        )
                    ) {

                        return false;
                    }


                    // Pouze vhodné termíny
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


        zobrazene =
            seradPorady(
                zobrazene
            );


        if (
            zobrazene.length === 0
        ) {

            vysledky.innerHTML = `

<div class="bez-vysledku">

    Pro nastavené filtry nebyly nalezeny
    žádné termíny.

</div>

`;

            return;
        }


        let html = `

<table>

<thead>

<tr>

    <th data-sort="datum">
        Datum${sipkaRazeni('datum')}
    </th>

    <th data-sort="cas">
        Čas${sipkaRazeni('cas')}
    </th>

    <th data-sort="porad">
        Pořad${sipkaRazeni('porad')}
    </th>

    <th data-sort="volno">
        Volno${sipkaRazeni('volno')}
    </th>

    <th data-sort="kapacita">
        Kapacita${sipkaRazeni('kapacita')}
    </th>

    <th>
        Vhodné
    </th>

</tr>

</thead>

<tbody>

`;


        zobrazene.forEach(
            porad => {

                const vhodne =
                    Number.isInteger(
                        pocetZaku
                    ) &&
                    pocetZaku >= 0 &&
                    porad.volno >=
                    pocetZaku;


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

        <a
            href="${escapeHTML(
                porad.url
            )}"
            target="_blank"
            rel="noopener noreferrer"
        >

            ${escapeHTML(
                porad.nazev
            )}

        </a>

    </td>


    <td>

        <strong>

            ${escapeHTML(
                porad.volno
            )}

        </strong>

    </td>


    <td>

        ${escapeHTML(
            porad.celkem
        )}

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


        vysledky.innerHTML =
            html;


        // Řazení
        vysledky
            .querySelectorAll(
                'th[data-sort]'
            )
            .forEach(
                th => {

                    th.addEventListener(
                        'click',
                        () => {

                            const sloupec =
                                th.dataset.sort;


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
    // VYHLEDÁVÁNÍ
    // =========================================================

    async function prohledej() {

        const mesicOdInput =
            document.getElementById(
                'mesic-od'
            );


        const mesicDoInput =
            document.getElementById(
                'mesic-do'
            );


        const od =
            mesicOdInput.value;


        const doMesice =
            mesicDoInput.value;


        const pocetZaku =
            Number(
                pocetZakuInput.value
            );


        pocetZakuInput.classList.remove(
            'chyba-input'
        );


        // =====================================================
        // KONTROLA POČTU ŽÁKŮ
        // =====================================================

        if (
            !Number.isInteger(
                pocetZaku
            ) ||
            pocetZaku < 0
        ) {

            pocetZakuInput
                .classList
                .add(
                    'chyba-input'
                );


            nastavStav(
                'Počet žáků musí být celé číslo 0 nebo větší.',
                'chyba'
            );


            alert(
                'Zadej platný počet žáků.'
            );


            return;
        }


        // =====================================================
        // KONTROLA OBDOBÍ
        // =====================================================

        if (
            !od ||
            !doMesice
        ) {

            nastavStav(
                'Vyber počáteční i koncový měsíc.',
                'chyba'
            );

            return;
        }


        if (
            od >
            doMesice
        ) {

            nastavStav(
                'Počáteční měsíc je pozdější než koncový.',
                'chyba'
            );

            return;
        }


        // =====================================================
        // AKTUÁLNÍ MĚSÍC
        // =====================================================

        const dnes =
            new Date();


        const aktualniMesic =
            dnes.getFullYear() +
            '-' +
            String(
                dnes.getMonth() + 1
            )
                .padStart(
                    2,
                    '0'
                );


        // Celé období je v minulosti
        if (
            doMesice <
            aktualniMesic
        ) {

            nastavStav(
                'Vybrané období je celé v minulosti.',
                'chyba'
            );

            return;
        }


        // Pokud "Od" leží v minulosti,
        // začneme aktuálním měsícem.
        const efektivniOd =
            od <
            aktualniMesic

                ? aktualniMesic

                : od;


        const mesice =
            seznamMesicu(
                efektivniOd,
                doMesice
            );


        if (
            mesice.length === 0
        ) {

            nastavStav(
                'Není co prohledávat.',
                'chyba'
            );

            return;
        }


        if (
            mesice.length > 12
        ) {

            nastavStav(
                'Najednou lze prohledat maximálně 12 měsíců.',
                'chyba'
            );

            return;
        }


        // =====================================================
        // RESET FILTRŮ
        // =====================================================

        document
            .querySelectorAll(
                `#${PANEL_ID} .filtr-den`
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        VYCHOZI_DNY.has(
                            Number(
                                checkbox.value
                            )
                        );
                }
            );


        filtrPoradu.value =
            '';


        document
            .getElementById(
                'filtr-casy'
            )
            .innerHTML =
                '<label>Načítám časy…</label>';


        aktualizujSouhrnDnu();


        // =====================================================
        // ZAČÁTEK HLEDÁNÍ
        // =====================================================

        hledatButton.disabled =
            true;


        vsechnyPorady =
            [];


        nastavStav(
            `Prohledávám ${mesice.length} měsíců…`
        );


        try {

            const vsechnyNactene =
                [];


            for (
                let i = 0;
                i < mesice.length;
                i++
            ) {

                const {
                    rok,
                    mesic
                } =
                    mesice[i];


                nastavStav(
                    `Načítám ${mesic}/${rok} ` +
                    `(${i + 1}/${mesice.length})…`
                );


                const porady =
                    await nactiMesic(
                        rok,
                        mesic
                    );


                // =================================================
                // ODSTRANĚNÍ MINULÝCH TERMÍNŮ
                // =================================================

                const dnesTimestamp =
                    dnesBezCasu();


                const budouci =
                    porady.filter(
                        porad =>
                            datumNaCislo(
                                porad.datum
                            ) >=
                            dnesTimestamp
                    );


                vsechnyNactene.push(
                    ...budouci
                );
            }


            vsechnyPorady =
                vsechnyNactene;


            // =================================================
            // ID PRO KAPACITY
            // =================================================

            const ids =
                [
                    ...new Set(
                        vsechnyPorady
                            .map(
                                porad =>
                                    String(
                                        porad.scheduleId
                                    )
                            )
                            .filter(Boolean)
                    )
                ];


            nastavStav(
                `Načteno ${vsechnyPorady.length} pořadů. ` +
                `Zjišťuji volná místa…`
            );


            const kapacity =
                await nactiKapacityPoDavkach(
                    ids
                );


            // =================================================
            // SPOJENÍ KAPACIT S POŘADY
            // =================================================

            vsechnyPorady.forEach(
                porad => {

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
                }
            );


            // =================================================
            // FILTRY
            // =================================================

            naplnFiltrPoradu();

            naplnFiltrCasu();

            aktualizujSouhrnDnu();

            aktualizujSouhrnCasu();

            aktualizujSouhrnSkoly();


            // =================================================
            // VÝSLEDKY
            // =================================================

            vykresli();


            // =================================================
            // KONTROLA NEZAŘAZENÝCH POŘADŮ
            // =================================================

            let nezarazene = [];


            if (
                dataSkupinNactena
            ) {

                nezarazene =
                    [
                        ...new Set(
                            vsechnyPorady
                                .map(
                                    porad =>
                                        porad.nazev
                                )
                                .filter(
                                    nazev =>
                                        !CARINA_PORADY_SKUPINY[
                                            nazev
                                        ]
                                )
                        )
                    ];
            }


            if (
                nezarazene.length > 0
            ) {

                console.warn(
                    'CARINA: tyto pořady nejsou v porady-skupiny.json:',
                    nezarazene
                );


                nastavStav(
                    `Hotovo. Načteno ${vsechnyPorady.length} budoucích termínů. ` +
                    `Pozor: ${nezarazene.length} pořadů není zařazeno do školní skupiny.`,
                    'varovani'
                );

            } else {

                nastavStav(
                    `Hotovo. Načteno ${vsechnyPorady.length} budoucích školních termínů. ` +
                    `Dnes je ${formatDnesniDatum()}.`
                );
            }


        } catch (error) {

            console.error(
                error
            );


            nastavStav(
                'Chyba: ' +
                error.message,
                'chyba'
            );

        } finally {

            hledatButton.disabled =
                false;
        }
    }


    // =========================================================
    // UDÁLOSTI
    // =========================================================

    panel
        .querySelector(
            '.zavrit'
        )
        .addEventListener(
            'click',
            () => {

                panel.remove();

                document
                    .getElementById(
                        STYLE_ID
                    )
                    ?.remove();
            }
        );


    hledatButton.addEventListener(
        'click',
        prohledej
    );


    // Pouze vhodné
    document
        .getElementById(
            'jen-vhodne'
        )
        .addEventListener(
            'change',
            () => {

                if (
                    vsechnyPorady.length
                ) {

                    vykresli();
                }
            }
        );


    // Pořad
    filtrPoradu.addEventListener(
        'change',
        () => {

            if (
                vsechnyPorady.length
            ) {

                vykresli();
            }
        }
    );


    // Dny
    document
        .querySelectorAll(
            `#${PANEL_ID} .filtr-den`
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    'change',
                    () => {

                        aktualizujSouhrnDnu();


                        if (
                            vsechnyPorady.length
                        ) {

                            vykresli();
                        }
                    }
                );
            }
        );


    // Počet žáků
    pocetZakuInput.addEventListener(
        'input',
        () => {

            pocetZakuInput
                .classList
                .remove(
                    'chyba-input'
                );


            if (
                vsechnyPorady.length
            ) {

                vykresli();
            }
        }
    );


    // =========================================================
    // KLIKNUTÍ MIMO ROZBALOVACÍ FILTR
    // =========================================================

    document.addEventListener(
        'click',
        event => {

            if (
                !document.getElementById(
                    PANEL_ID
                )
            ) {

                return;
            }


            panel
                .querySelectorAll(
                    'details.filtr[open]'
                )
                .forEach(
                    detail => {

                        if (
                            !detail.contains(
                                event.target
                            )
                        ) {

                            detail.open =
                                false;
                        }
                    }
                );
        }
    );


    // =========================================================
    // VÝCHOZÍ DNY
    // =========================================================

    document
        .querySelectorAll(
            `#${PANEL_ID} .filtr-den`
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    VYCHOZI_DNY.has(
                        Number(
                            checkbox.value
                        )
                    );
            }
        );


    aktualizujSouhrnDnu();


    // =========================================================
    // NAČTENÍ DAT PRO ŠKOLY
    // =========================================================

    nastavStav(
        'Načítám zařazení pořadů podle škol…'
    );


    dataSkupinNactena =
        await nactiDataSkupin();


    naplnFiltrSkoly();


    // =========================================================
    // VÝCHOZÍ STAV
    // =========================================================

    if (
        dataSkupinNactena
    ) {

        const pocetPoradu =
            Object.keys(
                CARINA_PORADY_SKUPINY
            ).length;


        nastavStav(
            `Připraveno k vyhledávání. ` +
            `Načteno zařazení ${pocetPoradu} pořadů.`
        );


    } else {

        nastavStav(
            'Připraveno k vyhledávání, ale nepodařilo se načíst ' +
            'porady-skupiny.json. Filtr Škola nebude použit.',
            'varovani'
        );
    }


})();