(async function () {

    // =========================================================
    // CARINA – přehled kapacit školních pořadů
    // =========================================================

    const PANEL_ID = 'skolni-prehled-kapacit';
    const STYLE_ID = 'skolni-prehled-style';

    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();


    // =========================================================
    // NASTAVENÍ
    // =========================================================

    const RESOURCE_STORAGE_KEY =
        'carina-skolni-prehled-resource';


    const VYCHOZI_OD = '2026-09';
    const VYCHOZI_DO = '2027-01';

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

    const PORADI_SKUPIN = [
        'MS',
        'ZS1',
        'ZS2',
        'SS'
    ];


    // =========================================================
    // EXTERNÍ JSON
    // =========================================================

    const DATA_URL_RAW =
        'https://raw.githubusercontent.com/PetrKrata/carina-kapacity/main/porady-skupiny.json';

    const DATA_URL_PAGES =
        'https://petrkrata.github.io/carina-kapacity/porady-skupiny.json';

    let CARINA_SKUPINY = {};
    let CARINA_PORADY_SKUPINY = {};
    let dataSkupinNactena = false;


    async function nactiJSONZURL(url) {

        const separator =
            url.includes('?') ? '&' : '?';

        const response =
            await fetch(
                url +
                separator +
                '_=' +
                Date.now(),
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

                const data =
                    await nactiJSONZURL(url);

                if (
                    !data ||
                    typeof data !== 'object'
                ) {
                    throw new Error(
                        'Neplatný formát JSON.'
                    );
                }

                if (
                    !data.skupiny ||
                    typeof data.skupiny !== 'object'
                ) {
                    throw new Error(
                        'V JSON chybí objekt "skupiny".'
                    );
                }

                if (
                    !data.porady ||
                    typeof data.porady !== 'object'
                ) {
                    throw new Error(
                        'V JSON chybí objekt "porady".'
                    );
                }

                CARINA_SKUPINY =
                    data.skupiny;

                CARINA_PORADY_SKUPINY =
                    data.porady;

                console.log(
                    'CARINA: zařazení pořadů načteno.',
                    CARINA_PORADY_SKUPINY
                );

                return true;

            } catch (error) {

                console.warn(
                    'CARINA: nepodařilo se načíst data:',
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

        } catch (e) {}
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

        try {

            const url =
                new URL(window.location.href);

            const resource =
                url.searchParams.get(
                    'resource'
                );

            if (resource) {

                ulozResource(resource);

                return resource;
            }

        } catch (e) {}


        for (
            const odkaz
            of document.querySelectorAll('a[href]')
        ) {

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

            } catch (e) {}
        }


        const input =
            document.querySelector(
                '[name="resource"]'
            );

        if (
            input &&
            input.value
        ) {

            ulozResource(
                input.value
            );

            return input.value;
        }


        const element =
            document.querySelector(
                '[data-resource]'
            );

        if (
            element &&
            element.dataset.resource
        ) {

            ulozResource(
                element.dataset.resource
            );

            return element.dataset.resource;
        }


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

        const [rok, mesic] =
            text.split('-').map(Number);

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
            dnes.getDate() + 1
        ).getTime();
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
            ((column - 2) * 15);

        const hodiny =
            Math.floor(
                minuty / 60
            );

        const mins =
            minuty % 60;

        return (
            String(hodiny)
                .padStart(2, '0') +
            ':' +
            String(mins)
                .padStart(2, '0')
        );
    }


    function escapeHTML(text) {

        return String(text ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
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
            element.style.gridRow || '';

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
            element.style.gridColumn || '';

        const parts =
            raw
                .split('/')
                .map(
                    value =>
                        parseInt(
                            value.trim(),
                            10
                        )
                );

        start =
            start || parts[0];

        end =
            end || parts[1];

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
    // MODRÉ POŘADY
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
    // ZPRACOVÁNÍ MĚSÍCE
    // =========================================================

    function zpracujMesic(
        doc,
        rok,
        mesic,
        statistiky = false
    ) {

        const dnyPodleRadku =
            new Map();


        doc
            .querySelectorAll(
                '.day[data-date]'
            )
            .forEach(day => {

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
            });


        const porady = [];


        doc
            .querySelectorAll('.show')
            .forEach(show => {

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
                    (!capacityElement && !statistiky)
                ) {
                    return;
                }


                const nazev =
                    nameElement
                        .textContent
                        .trim();


                const capacityId =
                    capacityElement?.id ||
                    '';


                const scheduleId =
                    capacityId.replace(
                        /^capa/,
                        ''
                    );


                if (!scheduleId && !statistiky) {
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
                    gridColumnBounds(show);


                if (
                    !row ||
                    !columns.start ||
                    !columns.end
                ) {
                    return;
                }


                const datum =
                    dnyPodleRadku.get(row);


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
                        urlUdalosti(uuid),

                    volno: null,

                    celkem: null
                });
            });


        return porady;
    }


    async function nactiMesic(
        rok,
        mesic,
        nacitatSloty = true
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

        if (!nacitatSloty && !doc.querySelector('.day[data-date]')) {
            throw new Error('Carina nevrátila kalendář. Zkontroluj přihlášení a dostupnost minulého období.');
        }
        if (nacitatSloty) vsechnySloty.push(...volneSlotyZMesice(doc));

        return zpracujMesic(
            doc,
            rok,
            mesic,
            !nacitatSloty
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


        json.forEach(item => {

            mapa[
                String(
                    item.schedule_id
                )
            ] = {

                volno:
                    item.available == null || item.available === '' ? null : Number(item.available),

                celkem:
                    item.total == null || item.total === '' ? null : Number(item.total)
            };
        });


        return mapa;
    }


    async function nactiKapacityPoDavkach(ids) {

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
    justify-content: space-between;
    align-items: center;

    padding: 12px 16px;

    background: #20242a;
    color: white;

    border-radius:
        10px 10px 0 0;
}


#${PANEL_ID} .hlavicka h2 {
    margin: 0;
    font-size: 18px;
    margin-right: auto;
}


#${PANEL_ID} .zavrit {
    border: none;
    background: transparent;
    color: white;

    font-size: 23px;
    line-height: 1;

    cursor: pointer;
}


#${PANEL_ID} .obsah {
    padding: 15px;
}


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


#${PANEL_ID} label {
    font-weight: 600;
}


#${PANEL_ID} input,
#${PANEL_ID} select,
#${PANEL_ID} button {
    font: inherit;
}


#${PANEL_ID} input[type="month"],
#${PANEL_ID} input[type="number"],
#${PANEL_ID} select {

    padding: 6px 8px;

    border: 1px solid #aaa;
    border-radius: 5px;

    background: white;
}


#${PANEL_ID} #pocet-zaku {
    width: 80px;
}


#${PANEL_ID} #hledat {

    padding: 8px 15px;

    border: none;
    border-radius: 5px;

    background: #1d5fa7;
    color: white;

    font-weight: bold;

    cursor: pointer;
}


#${PANEL_ID} #hledat:hover {
    background: #174e89;
}


#${PANEL_ID} #hledat:disabled {
        opacity: 0.6;
        cursor: wait;
    }

    #${PANEL_ID} #statistiky-button,
    #${PANEL_ID} #hledat-sloty {
        flex: 0 0 210px;
        width: 210px;
        height: 38px;
        padding: 5px 10px;
        border: none;
        border-radius: 5px;
        background: #277447;
        color: white;
        font-weight: bold;
        cursor: pointer;
        margin-right: 18px;
    }

    #${PANEL_ID} #hledat-sloty:disabled {
        opacity: 0.6;
        cursor: default;
    }


    #${PANEL_ID} .sloty-casy {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    #${PANEL_ID} .sloty-casy a {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 5px;
        background: #e7f7e7;
    }

    #${PANEL_ID} .slot-porad {
        margin: 4px 0;
    }


    #${PANEL_ID} [hidden] { display: none !important; }
    #${PANEL_ID} .stat-ovladani { display:flex; gap:16px; flex-wrap:wrap; align-items:center; padding:16px; background:#f1f3f5; border-radius:8px; }
    #${PANEL_ID} .stat-ovladani input { padding:8px; border:1px solid #aaa; border-radius:5px; font:inherit; }
    #${PANEL_ID} #stat-nacist { background:#1763a8; color:white; padding:10px 16px; border:0; border-radius:5px; font-weight:bold; cursor:pointer; }
    #${PANEL_ID} #stat-nacist:disabled { opacity:.5; cursor:wait; }
    #${PANEL_ID} .stat-karty { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:16px 0; }
    #${PANEL_ID} .stat-karta { border:1px solid #d6dce3; border-radius:8px; padding:12px; background:#eef3f8; color:#20242a; text-align:left; font:inherit; }
    #${PANEL_ID} button.stat-karta { cursor:pointer; }
    #${PANEL_ID} .stat-karta strong { display:block; font-size:24px; margin:6px 0; }
    #${PANEL_ID} .stat-link { border:0; background:none; color:#075bab; cursor:pointer; font:inherit; text-align:left; padding:0; }
    #${PANEL_ID} .stat-tabulka { overflow-x:auto; }
    #${PANEL_ID} #stat-vysledky th button { font-weight:bold; white-space:nowrap; }
    #${PANEL_ID} #stat-detail { margin-top:20px; }
    #${PANEL_ID} .stat-chyba { color:#ad2020; }
    @media (max-width:850px) {
        #${PANEL_ID} .hlavicka { flex-wrap:wrap; gap:8px; }
        #${PANEL_ID} .hlavicka h2 { flex:1 1 100%; }
        #${PANEL_ID} #statistiky-button, #${PANEL_ID} #hledat-sloty { flex:1 1 140px; width:auto; margin-right:0; }
    }

    #${PANEL_ID}.sloty-rezim .jen-mista {
        opacity: 0.35;
        pointer-events: none;
    }


#${PANEL_ID} .vhodne-label {
    display: flex;
    align-items: center;

    gap: 6px;

    white-space: nowrap;
}


#${PANEL_ID} .porad-label {
    display: flex;
    align-items: center;

    gap: 7px;
}


#${PANEL_ID} .porad-label select {

    min-width: 320px;
    max-width: 500px;
}


/* =========================================================
   ROZBALOVACÍ FILTRY
   ========================================================= */

#${PANEL_ID} details.filtr {
    position: relative;
}


#${PANEL_ID} details.filtr summary {

    min-width: 130px;

    padding: 7px 10px;

    border: 1px solid #aaa;
    border-radius: 5px;

    background: white;

    cursor: pointer;

    font-weight: 600;

    list-style: none;
}


#${PANEL_ID} details.filtr summary::-webkit-details-marker {
    display: none;
}


#${PANEL_ID} details.filtr summary::after {
    content: " ▼";
    font-size: 10px;
}


#${PANEL_ID} details.filtr[open] summary::after {
    content: " ▲";
}


#${PANEL_ID} .filtr-menu {

    position: absolute;

    top: calc(100% + 4px);
    left: 0;

    z-index: 100;

    min-width: 190px;
    max-height: 320px;

    overflow-y: auto;

    padding: 9px;

    background: white;

    border: 1px solid #aaa;
    border-radius: 6px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,0.2);
}


#${PANEL_ID} .filtr-menu label {

    display: flex;
    align-items: center;

    gap: 7px;

    padding: 5px 4px;

    font-weight: normal;

    white-space: nowrap;

    cursor: pointer;
}


#${PANEL_ID} .filtr-menu label:hover {
    background: #f1f3f5;
}


#${PANEL_ID} .filtr-menu input {
    margin: 0;
}


/* =========================================================
   STAV
   ========================================================= */

#${PANEL_ID} #stav {

    margin-bottom: 12px;

    padding: 8px 10px;

    border-radius: 5px;

    background: #eef2f6;
}


#${PANEL_ID} #stav.chyba {

    background: #ffe4e4;
    color: #900;
}


#${PANEL_ID} #stav.varovani {

    background: #fff1c7;
    color: #664d03;
}


/* =========================================================
   TABULKA
   ========================================================= */

#${PANEL_ID} table {

    width: 100%;

    border-collapse: collapse;

    background: white;
}


#${PANEL_ID} th,
#${PANEL_ID} td {

    padding: 7px 9px;

    border-bottom:
        1px solid #ddd;

    text-align: left;
}


#${PANEL_ID} th {

    position: sticky;

    top: 47px;

    z-index: 10;

    background: #e5e7eb;

    white-space: nowrap;
}


#${PANEL_ID} th[data-sort] {

    cursor: pointer;
    user-select: none;
}

/* Záhlaví statistik patří nad řádky, bez posouvání uvnitř tabulky. */
#${PANEL_ID} #statistiky-panel thead,
#${PANEL_ID} #statistiky-panel thead tr,
#${PANEL_ID} #statistiky-panel th {
    position: static;
    top: auto;
    inset: auto;
    z-index: auto;
}


#${PANEL_ID} th[data-sort]:hover {
    background: #d6d9dd;
}


#${PANEL_ID} tr.vhodne {
    background: #e7f7e7;
}


#${PANEL_ID} tr.nevhodne {
    background: #fde9e9;
}


#${PANEL_ID} tr:hover {
    filter: brightness(0.97);
}


#${PANEL_ID} td a {

    color: #004b9b;

    font-weight: 600;

    text-decoration: none;
}


#${PANEL_ID} td a:hover {
    text-decoration: underline;
}


#${PANEL_ID} .datum-den {

    margin-left: 3px;

    font-weight: bold;

    color: #555;
}


#${PANEL_ID} .ano {

    color: #087a16;
    font-weight: bold;
}


#${PANEL_ID} .ne {

    color: #b00020;
    font-weight: bold;
}


#${PANEL_ID} .chyba-input {

    border-color:
        red !important;

    background:
        #fff0f0 !important;
}


#${PANEL_ID} .bez-vysledku {

    padding: 20px;

    text-align: center;

    color: #666;
}


@media (max-width: 900px) {

    #${PANEL_ID} {

        width:
            calc(100% - 15px);

        top: 8px;

        max-height:
            calc(100vh - 16px);
    }


    #${PANEL_ID} .ovladani-radek {
        gap: 10px;
    }


    #${PANEL_ID} .porad-label select {

        min-width: 220px;
        max-width: 100%;
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
        document.createElement('div');

    panel.id =
        PANEL_ID;


    panel.innerHTML = `

    <div class="hlavicka">

        <h2>
            Školní pořady – přehled volných míst
        </h2>

        <button id="statistiky-button" type="button">Statistiky</button>
        <button id="hledat-sloty" type="button" disabled>
            Volné sloty nenalezeny
        </button>

        <button
        class="zavrit"
        title="Zavřít"
    >
        ×
    </button>

</div>


<div class="obsah">


    <div class="ovladani">


        <!-- HORNÍ ŘÁDEK -->

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


            <label class="jen-mista">
                Počet žáků:

                <input
                    type="number"
                    id="pocet-zaku"
                    value="45"
                    min="0"
                    step="1"
                >
            </label>


            <label class="vhodne-label jen-mista">

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


        <!-- SPODNÍ ŘÁDEK -->

        <div class="ovladani-radek">


            <!-- DNY -->

            <details class="filtr jen-mista">

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


            <!-- ČASY -->

            <details class="filtr jen-mista">

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


            <!-- ŠKOLA -->

            <details class="filtr jen-mista">

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

            <label class="porad-label jen-mista">

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


    <section id="statistiky-panel" hidden>
        <div class="stat-ovladani">
            <label>Od: <input id="stat-od" type="date"></label>
            <label>Do: <input id="stat-do" type="date"></label>
            <button id="stat-nacist" type="button">NAČÍST STATISTIKY</button>
        </div>
        <p>Statistiky školních (modrých) pořadů. Každý termín se počítá jako jedno uvedení.
        Zaplněnost vychází z rezervací uložených v Carině, nikoli z evidence návštěvnosti.</p>
        <div id="stat-stav" role="status">Vyber období a načti statistiky.</div>
        <div id="stat-vysledky"></div>
    </section>
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
    // PROMĚNNÉ
    // =========================================================

    let vsechnyPorady = [];
    let vsechnySloty = [];
    let obsazenePoradySlotu = [];
    let zobrazeni = 'mista';


    let razeni = {

        sloupec: 'datum',

        smer: 'asc'
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

    const hledatSlotyButton =
        document.getElementById(
            'hledat-sloty'
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
    // STAV
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
    // FILTR POŘADŮ
    // =========================================================

    function naplnFiltrPoradu() {

        const nazvy =
            [
                ...new Set(
                    vsechnyPorady
                        .map(
                            porad =>
                                porad.nazev
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
            '<option value="">Všechny pořady</option>';


        nazvy.forEach(nazev => {

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
        });
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
                            porad =>
                                porad.od
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


        casy.forEach(cas => {

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

            // Všechny nalezené časy jsou výchozím stavem zaškrtnuté
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
        });


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


        PORADI_SKUPIN.forEach(kod => {

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
        });


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


        if (
            vybraneSkoly.size === 0
        ) {

            return false;
        }


        // Všechny školy = žádné omezení.
        // Díky tomu nezmizí ani nový nezařazený pořad.

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

    function seradPorady(porady) {

        const kopie =
            [...porady];


        kopie.sort((a, b) => {

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
        });


        return kopie;
    }


    function sipkaRazeni(sloupec) {

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
    // VYKRESLENÍ
    // =========================================================

    function vykresli() {
        if (zobrazeni !== 'mista') return;

        if (
            vsechnyPorady.length === 0
        ) {

            vysledky.innerHTML =
                '<div class="bez-vysledku">Žádné načtené pořady.</div>';

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


                    if (
                        porad.volno ===
                        null
                    ) {
                        return false;
                    }


                    if (
                        datumNaCislo(
                            porad.datum
                        ) <
                        dnes
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
                        !odpovidaSkole(
                            porad,
                            vybraneSkoly
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


        zobrazene =
            seradPorady(
                zobrazene
            );


        if (
            zobrazene.length === 0
        ) {

            vysledky.innerHTML = `

<div class="bez-vysledku">
    Pro nastavené filtry nebyly nalezeny žádné termíny.
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


        zobrazene.forEach(porad => {

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
        });


        html += `

</tbody>

</table>

`;


        vysledky.innerHTML =
            html;


        vysledky
            .querySelectorAll(
                'th[data-sort]'
            )
            .forEach(th => {

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
            });
    }


    // =========================================================
    // VYHLEDÁVÁNÍ
    // =========================================================

    function volneSlotyZMesice(doc) {
        const povoleneDny = new Map();

        doc.querySelectorAll('.day[data-date]').forEach(day => {
            const row = gridRowStart(day);
            const datum = day.dataset.date;

            // Svátky mají day-anniversary; víkendy vlastní třídu.
            // Přijímáme výhradně běžný pracovní den.
            if (
                row &&
                datum &&
                day.classList.contains('day-weekday') &&
                !day.classList.contains('day-anniversary') &&
                ![0, 6].includes(cisloDneVTydnu(datum)) &&
                datumNaCislo(datum) >= dnesBezCasu()
            ) {
                povoleneDny.set(row, datum);
            }
        });

        // Carina kreslí prázdnou zelenou mřížku i pod již
        // založeným pořadem. Překryté intervaly nejsou volné.
        const obsazene = new Map();
        doc.querySelectorAll('.show, i.grid').forEach(element => {
            const nazev = element.querySelector('.name')?.textContent.trim();
            if (element.matches('i.grid') && nazev === '---') return;
            const row = gridRowStart(element);
            const columns = gridColumnBounds(element);
            if (!row || !columns.start || !columns.end) return;
            if (!obsazene.has(row)) obsazene.set(row, []);
            obsazene.get(row).push(columns);
            const datum = povoleneDny.get(row);
            if (datum) {
                const uuid = element.dataset.uuid;
                obsazenePoradySlotu.push({
                    datum,
                    od: sloupecNaCas(columns.start),
                    do: sloupecNaCas(columns.end),
                    nazev: nazev || 'Obsazeno',
                    scheduleId: (element.querySelector('.capacity')?.id || '')
                        .replace(/^capa/, ''),
                    url: uuid ? urlUdalosti(uuid) : null,
                    volno: null,
                    celkem: null
                });
            }
        });

        const sloty = [];
        doc.querySelectorAll('i.grid[data-uuid]').forEach(cell => {
            if (cell.querySelector('.name')?.textContent.trim() !== '---') {
                return;
            }

            const row = gridRowStart(cell);
            const datum = povoleneDny.get(row);
            const columns = gridColumnBounds(cell);
            const uuid = cell.dataset.uuid;

            if (!datum || !columns.start || !columns.end || !uuid) {
                return;
            }

            if ((obsazene.get(row) || []).some(occupied =>
                columns.start < occupied.end &&
                occupied.start < columns.end
            )) {
                return;
            }

            const od = sloupecNaCas(columns.start);
            if (!['09:00', '10:15', '11:30'].includes(od)) {
                return;
            }

            sloty.push({
                datum,
                od,
                do: sloupecNaCas(columns.end),
                url: window.location.origin + '/!grid@schedule~' +
                    encodeURIComponent(uuid)
            });
        });

        return sloty;
    }

    function vykresliSloty() {
        const podleDne = new Map();
        for (const slot of vsechnySloty) {
            if (!podleDne.has(slot.datum)) podleDne.set(slot.datum, []);
            podleDne.get(slot.datum).push(slot);
        }

        vysledky.innerHTML = !vsechnySloty.length
            ? '<div class="bez-vysledku">Žádné volné sloty v období.</div>'
            : '<table><thead><tr><th>Datum</th><th>9:00</th>' +
              '<th>10:15</th><th>11:30</th>' +
              '</tr></thead><tbody>' +
              [...podleDne].map(([datum, sloty]) =>
                  '<tr><td><a href="' + escapeHTML(urlMesice(
                      Number(datum.split('.')[2]), Number(datum.split('.')[1])
                  )) + '" title="Zobrazit příslušný měsíc v Carině">' +
                  escapeHTML(datum) + ' ' + escapeHTML(denVTydnu(datum)) +
                  '</a></td>' +
                  ['09:00', '10:15', '11:30'].map(cas => {
                      const slot = sloty.find(item => item.od === cas);
                      if (slot) return '<td><div class="sloty-casy"><a href="' +
                          escapeHTML(slot.url) + '">Volný slot<br>' +
                          escapeHTML(slot.od) + '–' + escapeHTML(slot.do) +
                          '</a></div></td>';
                      const porady = obsazenePoradySlotu.filter(porad =>
                          porad.datum === datum &&
                          casNaMinuty(porad.od) <= casNaMinuty(cas) &&
                          casNaMinuty(cas) < casNaMinuty(porad.do)
                      );
                      return '<td>' + (porady.length ? porady.map(porad => {
                          const kapacitaZnama = Number.isFinite(porad.volno) &&
                              Number.isFinite(porad.celkem);
                          const obsazenost = kapacitaZnama
                              ? porad.volno + '/' + porad.celkem
                              : 'nezjištěna';
                          const nazev = escapeHTML(porad.nazev);
                          return '<div class="slot-porad">' + (porad.url
                              ? '<a href="' + escapeHTML(porad.url) + '">' +
                                nazev + '</a>' : nazev) +
                              '<br><small title="Volná místa / celková kapacita">Volná místa: ' + escapeHTML(obsazenost) +
                              '</small></div>';
                      }).join('') : '—') + '</td>';
                  }).join('') + '</tr>'
              ).join('') + '</tbody></table>';
    }

    function nastavRezimFiltru() {
        const sloty = zobrazeni === 'sloty';
        panel.classList.toggle('sloty-rezim', sloty);
        panel.querySelectorAll('.jen-mista details[open], details.jen-mista[open]')
            .forEach(detail => { detail.open = false; });
        panel.querySelectorAll('.jen-mista input, .jen-mista select')
            .forEach(input => { input.disabled = sloty; });
    }

    function aktualizujTlacitkoSlotu() {
        hledatSlotyButton.disabled = !vsechnySloty.length;
        hledatSlotyButton.textContent = !vsechnySloty.length
            ? 'Volné sloty nenalezeny'
            : zobrazeni === 'sloty'
                ? 'Volná místa'
                : 'Volné sloty nalezeny';
    }

    function prepniZobrazeni() {
        if (!vsechnySloty.length) return;
        if (zobrazeni === 'statistiky') zavriStatistiky();
        zobrazeni = zobrazeni === 'mista' ? 'sloty' : 'mista';
        nastavRezimFiltru();
        panel.querySelector('.hlavicka h2').textContent =
            zobrazeni === 'sloty'
                ? 'Školní pořady – přehled volných slotů'
                : 'Školní pořady – přehled volných míst';
        if (zobrazeni === 'sloty') vykresliSloty();
        else vykresli();
        aktualizujTlacitkoSlotu();
    }


    // Statistiky mají vlastní data a období; hledání míst a slotů se nemění.
    let statistickePorady = [];
    let statistikyNacteny = false;
    let statistikyRazeni = {sloupec: 'pocet', smer: -1};
    let predStatistikami = 'mista';

    function nastavStatistickeObdobi() {
        const iso = datum => datum.getFullYear() + '-' +
            String(datum.getMonth() + 1).padStart(2, '0') + '-' +
            String(datum.getDate()).padStart(2, '0');
        const {rok, mesic} = inputNaMesic(VYCHOZI_DO);
        const konec = new Date(rok, mesic, 0);
        document.getElementById('stat-od').value = VYCHOZI_OD + '-01';
        document.getElementById('stat-do').value = iso(konec);
    }

    function prepniStatistiky() {
        if (zobrazeni === 'statistiky') { zavriStatistiky(); return; }
        predStatistikami = zobrazeni;
        zobrazeni = 'statistiky';
        panel.querySelector('.ovladani').hidden = true;
        stav.hidden = true;
        vysledky.hidden = true;
        document.getElementById('statistiky-panel').hidden = false;
        document.getElementById('statistiky-button').textContent = 'Zpět na přehled';
        panel.querySelector('.hlavicka h2').textContent = 'Školní pořady – statistiky';
    }

    function zavriStatistiky() {
        zobrazeni = predStatistikami;
        panel.querySelector('.ovladani').hidden = false;
        stav.hidden = false;
        vysledky.hidden = false;
        document.getElementById('statistiky-panel').hidden = true;
        document.getElementById('statistiky-button').textContent = 'Statistiky';
        panel.querySelector('.hlavicka h2').textContent = zobrazeni === 'sloty'
            ? 'Školní pořady – přehled volných slotů' : 'Školní pořady – přehled volných míst';
        nastavRezimFiltru();
        aktualizujTlacitkoSlotu();
        if (zobrazeni === 'sloty') vykresliSloty();
        else vykresli();
    }

    function statistickaKapacita(porad) {
        if (!Number.isFinite(porad.volno) || !Number.isFinite(porad.celkem) ||
            porad.celkem <= 0 || porad.volno < 0 || porad.volno > porad.celkem) return null;
        const obsazeno = porad.celkem - porad.volno;
        const procent = 100 * obsazeno / porad.celkem;
        const skupina = obsazeno === porad.celkem ? 'plne' : obsazeno === 0 ? 'prazdne'
            : obsazeno * 10 >= porad.celkem * 9 ? 'temer' : 'mene';
        return {obsazeno, procent, skupina};
    }

    function souhrnStatistik(porady) {
        const s = {pocet: porady.length, objednano:0, plne:0, temer:0, mene:0,
            prazdne:0, nezname:0, volno:0, kapacita:0, obsazeno:0};
        for (const p of porady) {
            const k = statistickaKapacita(p);
            if (!k) { s.nezname++; continue; }
            s[k.skupina]++;
            if (k.obsazeno > 0) s.objednano++;
            s.volno += p.volno;
            s.kapacita += p.celkem;
            s.obsazeno += k.obsazeno;
        }
        s.obsazenost = s.kapacita ? s.obsazeno / s.kapacita * 100 : null;
        return s;
    }

    function procentoStatistik(hodnota) {
        // Dvě desetinná místa; téměř plný pořad se nezaokrouhlí na 100 %.
        return hodnota === null ? '—' :
            (Math.floor(hodnota * 100) / 100).toLocaleString('cs-CZ', {maximumFractionDigits:2}) + ' %';
    }

    async function nactiStatistiky() {
        const odInput = document.getElementById('stat-od');
        const doInput = document.getElementById('stat-do');
        const info = document.getElementById('stat-stav');
        const button = document.getElementById('stat-nacist');
        const od = odInput.value;
        const konec = doInput.value;
        if (!od || !konec || !odInput.checkValidity() || !doInput.checkValidity() || od > konec) {
            info.textContent = 'Vyber platné období. Datum Od musí být nejpozději datum Do.';
            info.className = 'stat-chyba';
            return;
        }
        const [rokOd, mesicOd] = od.split('-').map(Number);
        const [rokDo, mesicDo] = konec.split('-').map(Number);
        const pocetMesicu = (rokDo - rokOd) * 12 + mesicDo - mesicOd + 1;
        if (pocetMesicu > 24) {
            info.textContent = 'Vyber období nejvýše 24 kalendářních měsíců.';
            info.className = 'stat-chyba';
            return;
        }
        button.disabled = true;
        odInput.disabled = doInput.disabled = true;
        info.className = '';
        statistikyNacteny = false;
        statistickePorady = [];
        document.getElementById('stat-vysledky').innerHTML = '';
        try {
            const mesice = seznamMesicu(od.slice(0,7), konec.slice(0,7));
            const porady = [];
            const datumIso = datum => {
                const [den, mesic, rok] = datum.split('.').map(Number);
                return rok + '-' + String(mesic).padStart(2,'0') + '-' + String(den).padStart(2,'0');
            };
            for (let i = 0; i < mesice.length; i++) {
                info.textContent = `Načítám období: ${i + 1}/${mesice.length} měsíců…`;
                const {rok, mesic} = mesice[i];
                const nactene = await nactiMesic(rok, mesic, false);
                porady.push(...nactene.filter(p => datumIso(p.datum) >= od && datumIso(p.datum) <= konec));
            }
            // Jedno uvedení = jeden unikátní záznam v rozvrhu.
            const jedinecne = [...new Map(porady.map(p => [p.uuid, p])).values()];
            info.textContent = 'Zjišťuji uložené rezervace…';
            const ids = [...new Set(jedinecne.map(p => String(p.scheduleId)).filter(Boolean))];
            const kapacity = await nactiKapacityPoDavkach(ids);
            for (const p of jedinecne) {
                const k = kapacity[String(p.scheduleId)];
                if (k) { p.volno = k.volno; p.celkem = k.celkem; }
            }
            statistickePorady = jedinecne;
            statistikyNacteny = true;
            info.textContent = 'Načtené období: ' + od.split('-').reverse().join('.') + ' – ' +
                konec.split('-').reverse().join('.') + '. Údaje odpovídají aktuálně uloženým rezervacím.';
            vykresliStatistiky();
        } catch (error) {
            info.textContent = 'Statistiky se nepodařilo načíst: ' + error.message;
            info.className = 'stat-chyba';
        } finally {
            button.disabled = false;
            odInput.disabled = doInput.disabled = false;
        }
    }

    function vykresliStatistiky() {
        if (!statistikyNacteny) return;
        const target = document.getElementById('stat-vysledky');
        const podleNazvu = new Map();
        for (const p of statistickePorady) {
            const nazev = p.nazev.trim().replace(/\s+/g, ' ');
            if (!podleNazvu.has(nazev)) podleNazvu.set(nazev, []);
            podleNazvu.get(nazev).push(p);
        }
        const celkem = souhrnStatistik(statistickePorady);
        const radky = [...podleNazvu].map(([nazev, porady]) => ({nazev, porady, ...souhrnStatistik(porady)}));
        const sloupce = [['nazev','Pořad'],['pocet','Počet uvedení'],['objednano','Alespoň částečně obsazené'],
            ['plne','100 %'],['temer','90 až <100 %'],['mene','Více než 0 až <90 %'],
            ['prazdne','0 %'],['nezname','Nezjištěno'],['obsazenost','Celková zaplněnost']];
        radky.sort((a,b) => {
            const sl = statistikyRazeni.sloupec;
            if (sl === 'nazev') return a.nazev.localeCompare(b.nazev, 'cs') * statistikyRazeni.smer;
            if (a[sl] === null) return b[sl] === null ? 0 : 1;
            if (b[sl] === null) return -1;
            return (a[sl] - b[sl]) * statistikyRazeni.smer || a.nazev.localeCompare(b.nazev,'cs');
        });
        const karty = [['pocet','Všechna uvedení'],['objednano','Alespoň částečně obsazené'],['plne','Zaplněno 100 %'],
            ['temer','Zaplněno 90 až <100 %'],['mene','Zaplněno více než 0 až <90 %'],
            ['prazdne','Neobsazené (0 %)'],['nezname','Kapacita nezjištěna']];
        const td = row => sloupce.slice(1).map(([k]) => '<td>' +
            (k === 'obsazenost' ? procentoStatistik(row[k]) : row[k]) + '</td>').join('');
        target.innerHTML = '<div class="stat-karty">' +
            '<div class="stat-karta">Různých pořadů<strong>' + podleNazvu.size + '</strong></div>' +
            karty.map(([k,n]) => '<button type="button" class="stat-karta" data-stat-skupina="' + k + '">' +
                escapeHTML(n) + '<strong>' + celkem[k] + '</strong>' +
                procentoStatistik(celkem.pocet ? celkem[k] / celkem.pocet * 100 : null) +
                ' ze všech uvedení</button>').join('') +
            '<div class="stat-karta">Celková zaplněnost<strong>' + procentoStatistik(celkem.obsazenost) +
            '</strong>Volno / kapacita: ' + celkem.volno + '/' + celkem.kapacita + '</div></div>' +
            (celkem.nezname ? '<p>U ' + celkem.nezname + ' uvedení chybí platná kapacita. Do výpočtu zaplněnosti a součtu míst nejsou zahrnuta.</p>' : '') +
            '<div class="stat-tabulka"><table><thead><tr>' + sloupce.map(([k,n]) =>
                '<th><button class="stat-link" type="button" data-stat-sort="' + k + '">' + escapeHTML(n) +
                (statistikyRazeni.sloupec === k ? (statistikyRazeni.smer === 1 ? ' ▲' : ' ▼') : '') +
                '</button></th>').join('') + '</tr></thead><tbody>' + radky.map((r,i) =>
                '<tr><td><button type="button" class="stat-link" data-stat-porad="' + i + '">' +
                escapeHTML(r.nazev) + '</button></td>' + td(r) + '</tr>').join('') +
            '</tbody><tfoot><tr><td><strong>Celkem</strong></td>' + td(celkem) +
            '</tr></tfoot></table></div><div id="stat-detail"></div>';
        target.querySelectorAll('[data-stat-sort]').forEach(button => button.addEventListener('click', () => {
            const sloupec = button.dataset.statSort;
            statistikyRazeni = {sloupec, smer: statistikyRazeni.sloupec === sloupec
                ? -statistikyRazeni.smer : sloupec === 'nazev' ? 1 : -1};
            vykresliStatistiky();
        }));
        target.querySelectorAll('[data-stat-porad]').forEach(button => button.addEventListener('click', () => {
            const r = radky[Number(button.dataset.statPorad)];
            vykresliDetailStatistik(r.nazev, r.porady);
        }));
        target.querySelectorAll('[data-stat-skupina]').forEach(button => button.addEventListener('click', () => {
            const skupina = button.dataset.statSkupina;
            const porady = statistickePorady.filter(p => {
                const k = statistickaKapacita(p);
                return skupina === 'pocet' || (skupina === 'nezname' ? !k :
                    skupina === 'objednano' ? k && k.obsazeno > 0 : k && k.skupina === skupina);
            });
            vykresliDetailStatistik(karty.find(([k]) => k === skupina)[1], porady);
        }));
    }

    function vykresliDetailStatistik(nazev, porady) {
        const target = document.getElementById('stat-detail');
        const serazene = [...porady].sort((a,b) => datumNaCislo(a.datum) - datumNaCislo(b.datum) ||
            casNaMinuty(a.od) - casNaMinuty(b.od));
        target.innerHTML = '<h3>' + escapeHTML(nazev) + ' (' + porady.length + ')</h3>' +
            '<div class="stat-tabulka"><table><thead><tr><th>Datum</th><th>Čas</th><th>Pořad</th>' +
            '<th>Volno / kapacita</th><th>Zaplněnost</th></tr></thead><tbody>' + serazene.map(p => {
                const k = statistickaKapacita(p);
                return '<tr><td>' + escapeHTML(p.datum) + '</td><td>' + escapeHTML(p.od) + '–' +
                    escapeHTML(p.do) + '</td><td><a href="' + escapeHTML(p.url) + '">' +
                    escapeHTML(p.nazev) + '</a></td><td>' + (k ? p.volno + '/' + p.celkem : 'Nezjištěno') +
                    '</td><td>' + (k ? procentoStatistik(k.procent) : '—') + '</td></tr>';
            }).join('') + '</tbody></table></div>';
        target.scrollIntoView({behavior:'smooth', block:'nearest'});
    }

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
        // RESET DNŮ
        // =====================================================

        document
            .querySelectorAll(
                `#${PANEL_ID} .filtr-den`
            )
            .forEach(checkbox => {

                checkbox.checked =
                    VYCHOZI_DNY.has(
                        Number(
                            checkbox.value
                        )
                    );
            });


        // =====================================================
        // RESET ŠKOL
        // =====================================================

        document
            .querySelectorAll(
                `#${PANEL_ID} .filtr-skola-checkbox`
            )
            .forEach(checkbox => {

                checkbox.checked =
                    true;
            });


        filtrPoradu.value =
            '';


        document
            .getElementById(
                'filtr-casy'
            )
            .innerHTML =
                '<label>Načítám časy…</label>';


        aktualizujSouhrnDnu();
        aktualizujSouhrnSkoly();


        hledatButton.disabled =
            true;


        vsechnyPorady =
            [];
        vsechnySloty = [];
        obsazenePoradySlotu = [];
        zobrazeni = 'mista';
        nastavRezimFiltru();
        panel.querySelector('.hlavicka h2').textContent =
            'Školní pořady – přehled volných míst';
        aktualizujTlacitkoSlotu();

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


            vsechnySloty.sort((a, b) =>
                datumNaCislo(a.datum) - datumNaCislo(b.datum) ||
                casNaMinuty(a.od) - casNaMinuty(b.od)
            );
            aktualizujTlacitkoSlotu();

            vsechnyPorady =
                vsechnyNactene;


            const ids =
                [
                    ...new Set(
                        vsechnyPorady
                            .concat(obsazenePoradySlotu)
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
                'Zjišťuji volná místa…'
            );


            const kapacity =
                await nactiKapacityPoDavkach(
                    ids
                );


            vsechnyPorady.concat(obsazenePoradySlotu).forEach(porad => {

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
            });


            // =================================================
            // NAPLNĚNÍ FILTRŮ
            // =================================================

            naplnFiltrPoradu();

            naplnFiltrCasu();

            aktualizujSouhrnDnu();

            aktualizujSouhrnCasu();

            aktualizujSouhrnSkoly();


            if (zobrazeni === 'sloty') vykresliSloty();
            else vykresli();


            // =================================================
            // NEZAŘAZENÉ POŘADY
            // =================================================

            let nezarazene =
                [];


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


            // =================================================
            // PRVNÍ DATUM
            // =================================================

            let prvniDatum =
                null;


            if (
                vsechnyPorady.length > 0
            ) {

                prvniDatum =
                    [...vsechnyPorady]
                        .sort(
                            (a, b) =>
                                datumNaCislo(
                                    a.datum
                                ) -
                                datumNaCislo(
                                    b.datum
                                )
                        )[0]
                        .datum;
            }


            // =================================================
            // VAROVÁNÍ / HOTOVO
            // =================================================

            if (
                nezarazene.length > 0
            ) {

                console.warn(
                    'CARINA: tyto pořady nejsou v porady-skupiny.json:',
                    nezarazene
                );


                nastavStav(
                    `Prohledávání dokončeno. ` +
                    (
                        prvniDatum
                            ? `Pořady načteny od data ${prvniDatum}. `
                            : ''
                    ) +
                    `Pozor: ${nezarazene.length} ` +
                    (
                        nezarazene.length === 1
                            ? 'pořad není zařazen'
                            : 'pořadů není zařazeno'
                    ) +
                    ` do školní skupiny.`,
                    'varovani'
                );


            } else {

                if (
                    prvniDatum
                ) {

                    nastavStav(
                        `Prohledávání dokončeno. ` +
                        `Pořady načteny od data ${prvniDatum}.`
                    );

                } else {

                    nastavStav(
                        'Prohledávání dokončeno.'
                    );
                }
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

    hledatSlotyButton.addEventListener('click', prepniZobrazeni);
    document.getElementById('statistiky-button').addEventListener('click', prepniStatistiky);
    document.getElementById('stat-nacist').addEventListener('click', nactiStatistiky);
    nastavStatistickeObdobi();



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


    document
        .querySelectorAll(
            `#${PANEL_ID} .filtr-den`
        )
        .forEach(checkbox => {

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
        });


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
    // KLIKNUTÍ MIMO FILTR
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
                .forEach(detail => {

                    if (
                        !detail.contains(
                            event.target
                        )
                    ) {

                        detail.open =
                            false;
                    }
                });
        }
    );


    // =========================================================
    // VÝCHOZÍ DNY
    // =========================================================

    document
        .querySelectorAll(
            `#${PANEL_ID} .filtr-den`
        )
        .forEach(checkbox => {

            checkbox.checked =
                VYCHOZI_DNY.has(
                    Number(
                        checkbox.value
                    )
                );
        });


    aktualizujSouhrnDnu();


    // =========================================================
    // NAČTENÍ JSONU
    // =========================================================

    nastavStav(
        'Načítám zařazení pořadů…'
    );


    dataSkupinNactena =
        await nactiDataSkupin();


    naplnFiltrSkoly();


    // =========================================================
    // ÚVODNÍ HLÁŠKA
    // =========================================================

    if (
        dataSkupinNactena
    ) {

        nastavStav(
            'Připraveno k vyhledávání.'
        );

    } else {

        nastavStav(
            'Připraveno k vyhledávání, ale nepodařilo se načíst ' +
            'porady-skupiny.json. Filtr Škola nebude použit.',
            'varovani'
        );
    }


})();
