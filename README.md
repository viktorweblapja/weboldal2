# Világóra 2.0

Az eredeti Világóra továbbfejlesztett, statikus változata. A korábbi HTML felülete és CSS-stílusa megmaradt, a működés külön JavaScript-modulokra vált. A forrás a korábbi projekt acf13962e05116b224d85ec027926ed2494a5a22 állapotából származik.

## Kipróbálás saját gépen

1. Bontsd ki a ZIP-et egy mappába.
2. Telepített Python 3 mellett ebben a mappában futtasd:
   `python -m http.server 8000 --directory dist`
3. Nyisd meg a http://localhost:8000 címet.
4. Várd meg az „Offline fájlok előkészítve” jelzést, majd töltsd újra.
5. Az offline teszthez a böngésző fejlesztői eszközeiben kapcsold ki a hálózatot és töltsd újra.

A fájlra történő dupla kattintás nem elegendő a JavaScript-modulokhoz, városadatokhoz és a Service Workerhez. A localhost helyi fejlesztéshez használható; telefonos telepítéshez HTTPS kell.

Nincs build és nincs telepítendő npm-függőség. A dist mappa maga a szerkeszthető és publikálható webalkalmazás. Node.js 22 vagy újabb mellett az automatizált teszt parancsa:
`npm test`

## Használat

Keress legalább két karakterrel városra, majd válassz a találatok közül. A találatok ország- és régiókódot, valamint IANA-azonosítót mutatnak. A legnépesebb találatok kerülnek előre, legfeljebb 30 találat jelenik meg. A ↑ és ↓ gombok módosítják az órák sorrendjét, a × eltávolít. Legfeljebb 100 óra használható. A fejlécben válthatsz témát és formátumot. Az UTC-választó 15 perces lépésekben működik.

A városórák automatikus időzónát használnak. A kézi eltolások egész évben rögzítettek. Az AM délelőttöt, a PM délutánt jelent. A beállítások a böngésző helyi tárhelyén maradnak, a korábbi v1 beállításokat az alkalmazás átveszi.

## Fájlok

| Fájl | Feladat |
| --- | --- |
| dist/index.html | Az eredeti felület kibővítve |
| dist/style.css | Eredeti témák és reszponzív stílus |
| dist/app.js | Városkeresés, felület, tárolás, szinkronizálás |
| dist/core.js | Időformázás, UTC-eltolás, monotón időalap |
| dist/cities.json | Helyi GeoNames városadatok |
| dist/manifest.webmanifest | PWA neve, ikonja, scope-ja |
| dist/sw.js | Offline fájlok és verzióváltás |
| dist/icons | 192, 512, maskable és Apple ikonok |
| tests/clock.test.js | Futtatható időkezelési tesztek |
| docs | Működés, publikálás, tesztelési és biztonsági jelentés |

Részletek a docs mappában. Ez az átadás helyi felülvizsgálatra készült. Közzétételi művelet nem történt.
