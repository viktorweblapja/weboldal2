# Világóra 2.0

Statikus világóra-webalkalmazás városkereséssel, automatikus időzónákkal, rögzített UTC-eltolásokkal és offline támogatással.

Az eredeti Világóra továbbfejlesztett változata. A működés külön JavaScript-modulokban található. Az eredeti projekt kiinduló állapota: `acf13962e05116b224d85ec027926ed2494a5a22`.

Nincs szükség buildelésre. A webalkalmazás fájljai közvetlenül a repository gyökerében találhatók.

## Kipróbálás saját gépen

1. Töltsd le és bontsd ki a projektet.
2. Nyiss terminált abban a mappában, amelyben az `index.html` található.
3. Telepített Python 3 mellett futtasd:

   ```bash
   python -m http.server 8000
   ```

   Windows alatt, ha a `python` parancs nem érhető el:

   ```bash
   py -m http.server 8000
   ```

4. Nyisd meg a http://localhost:8000 címet.
5. Várd meg az „Offline fájlok előkészítve” jelzést.

Az `index.html` fájl dupla kattintással történő megnyitása nem megfelelő a JavaScript-modulok, a városadatok és a Service Worker használatához. Helyi próbához localhost, az interneten HTTPS szükséges.

## GitHub Pages és saját domain

Ág alapú publikálás esetén:

1. Nyisd meg a repository **Settings → Pages** oldalát.
2. A **Source** beállítás legyen **Deploy from a branch**.
3. Válaszd ki az alkalmazás fájljait tartalmazó ágat, például `main`.
4. A publikálási mappa legyen **/(root)**.
5. Mentsd el, és az **Actions** lapon ellenőrizd a publikálás eredményét.

Az `index.html`, a hozzá tartozó JavaScript- és CSS-fájlok, a városadatok, a manifest, a Service Worker és az `icons/` mappa ugyanazon publikálási gyökérben legyenek.

Saját domain használatakor őrizd meg a `CNAME` fájlt és a Pages megfelelő domainbeállítását. A PWA és az offline működés használatához HTTPS szükséges.

A `dist/` mappa nem szükséges a gyökérből történő publikáláshoz. Ha korábbi másolatként még megtalálható, eltávolítása előtt ellenőrizd, hogy nincs benne egyedi fájl, és a tesztek vagy más konfigurációk nem hivatkoznak rá.

## Használat

- Városkereséshez írj be legalább két karaktert.
- A kereső az ékezet nélküli keresést és az adatállományban szereplő alternatív városneveket is támogatja.
- Legfeljebb 30 találat jelenik meg, az adatállomány sorrendjében. További találatokhoz pontosítsd a keresést.
- A találatok az elérhető ország- és régióadatokat, valamint az IANA-időzóna azonosítóját mutatják.
- A találatra kattintva hozzáadhatod a város óráját.
- Az UTC-választóval 15 perces lépésekben adhatsz hozzá rögzített eltolást.
- A ↑ és ↓ gombok módosítják az órák sorrendjét, a × eltávolítja az órát.
- Legfeljebb 100 óra adható hozzá.
- A fejlécben világos vagy sötét téma, illetve 12 vagy 24 órás formátum választható.

A városórák a böngésző időzónaszabályait követik, beleértve a nyári időszámítást. A szabályok frissessége a böngésző és az operációs rendszer frissítéseitől függ.

A kézzel megadott UTC-eltolások egész évben változatlanok.

A 12 órás formátumban az AM az éjféltől délig tartó időszakot, a PM a déltől éjfélig tartó időszakot jelöli. Éjfél: 12:00 AM; dél: 12:00 PM.

## Beállítások tárolása

Az alkalmazás a böngésző helyi tárhelyén tárolja az órákat, a témát és az időformátumot. A korábbi v1 beállításokat is megpróbálja átvenni.

A beállítások nem szinkronizálódnak különböző eszközök vagy böngészők között. A webhelyadatok törlésekor elveszhetnek. Másik domain megnyitásakor külön helyi beállítások érvényesülnek.

A mentett városóra nem törlődik automatikusan, ha a hozzá tartozó városadat vagy időzóna nem érhető el.

## Időszinkronizálás

Az alkalmazás induláskor a készülék rendszeridejét használja, és internetkapcsolat esetén megpróbál szinkronizálni a TimeAPI szolgáltatással.

- Automatikus szinkronizálás induláskor és látható oldalon 15 percenként történik.
- Internetkapcsolat visszatérésekor és az oldalra való visszaváltáskor is történhet próbálkozás.
- Két kérés között legalább egy perc telik el az adott megnyitott alkalmazáspéldányban.
- Hiba esetén a kód növekvő várakozási időt alkalmaz.
- A HTTP 429 és 503 válaszok olvasható `Retry-After` fejlécét figyelembe veszi. A fejléc böngészőből történő elérhetősége a szolgáltató CORS-beállításaitól függ.
- A kérés időkorlátja 8 másodperc. A 4 másodpercnél nagyobb késleltetésű időadatot az alkalmazás nem fogadja el.

Sikertelen szinkronizáláskor az órák tovább működnek a korábbi szinkronizálás vagy a készülék rendszerideje alapján. Az aktuális időforrást a felület jelzi.

A hálózati késleltetés korrekciója becslés; az alkalmazás nem garantál hitelesített vagy milliszekundumos pontosságot.

Szolgáltató: https://timeapi.io/  
GYIK: https://timeapi.io/home/faqs

A 2026. november 17-én ellenőrzött hivatalos GYIK ingyenes használatot jelzett. Konkrét hívási kvótát és részletes API-használati feltételeket az ellenőrzött oldalakon nem sikerült azonosítani. Az alkalmazás saját híváskorlátozása nem a szolgáltató közzétett kvótája.

## Offline működés és telepítés

Az első sikeres online betöltés után a Service Worker gyorsítótárba helyezi az alkalmazás szükséges fájljait, köztük a városadatokat.

Az „Offline fájlok előkészítve” jelzés után az alkalmazás offline is használható, amíg a böngésző megőrzi a gyorsítótárat. Új internetes időszinkronizálás offline állapotban nem lehetséges.

iPhone-on a Safari megosztási menüjében a **Főképernyőhöz adás** lehetőséggel telepíthető. Más támogatott böngészőkben a böngésző telepítési menüje használható.

### Offline ellenőrzés

1. Nyisd meg az alkalmazást online.
2. Várd meg az offline előkészítés befejezését.
3. Töltsd újra az oldalt.
4. A böngésző fejlesztői eszközeiben kapcsold be az offline hálózati módot.
5. Normál újratöltéssel ellenőrizd az oldal megnyitását.
6. Próbáld ki a városkeresést és az órák hozzáadását.
7. A próba után kapcsold vissza a hálózatot.

Az offline teszthez ne kényszerített frissítést használj, mert az megkerülheti az offline kiszolgálást.

## Frissítés

A módosított alkalmazásfájlok feltöltésekor a `sw.js` fájlban a gyorsítótár verzióját is változtasd meg.

Ha az új Service Worker települt és aktiválásra vár, megjelenik az **Új verzió betöltése** gomb. Ez aktiválja a frissítést és újratölti az oldalt. Több megnyitott lap esetén a többi lapot is töltsd újra.

Ha publikálás után régi tartalom látható:

1. Ellenőrizd az Actions lapon a sikeres Pages-publikálást.
2. Próbáld meg az „Új verzió betöltése” gombot, ha megjelent.
3. Online állapotban próbálj kényszerített frissítést vagy inkognitóablakot.

A webhelyadatok teljes törlése a mentett órákat és beállításokat is eltávolíthatja.

## Fájlok

| Fájl vagy mappa | Feladat |
| --- | --- |
| `index.html` | Felület, forrásmegjelölés és adatvédelmi tájékoztatás |
| `style.css` | Témák és reszponzív megjelenés |
| `app.js` | Városkeresés, felület, tárolás és időszinkronizálás |
| `core.js` | Időformázás, időzóna-cache, UTC-válasz ellenőrzése és időalap |
| `cities.json` | Helyi GeoNames-alapú városadatok |
| `manifest.webmanifest` | Telepítési metaadatok és ikonhivatkozások |
| `sw.js` | Offline gyorsítótár és verzióváltás |
| `icons/` | Alkalmazásikonok |
| `CNAME` | GitHub Pages saját domain |
| `README.md` | Használati és fejlesztési útmutató |
| `package.json` | A projekt Node.js- és tesztbeállításai |
| `tests/` | Automatizált tesztek |
| `docs/` | Kiegészítő dokumentáció és korábbi jelentések |
| `.gitignore` | Gitből kizárt helyi fájlok beállításai |

A korábbi dokumentációban és tesztekben még előfordulhatnak `dist/` útvonalak. Ezeket a gyökérbe helyezett alkalmazás elrendezéséhez kell igazítani.

## Tesztelési állapot

A felhasználó visszajelzése alapján a saját domainen megnyitott világóra kényszerített frissítés után működik.

A legutóbbi kódmódosítások után az automatizált tesztek és a teljes böngészős ellenőrzés a fejlesztői futtatókörnyezet elérhetetlensége miatt nem futottak le. A gyengébb mobiltelefonokon mért teljesítmény, a hálózati hibakezelés, a verzióváltás és a valódi eszközös offline működés még ellenőrzendő.

A korábbi projekt Node.js 22 vagy újabb verzió mellett az alábbi tesztparancsot adta meg:

```bash
npm test
```

Futtatás előtt ellenőrizni kell a `package.json` beállításait és a tesztek importútvonalait. A `dist/` mappában lévő régi kódra mutató tesztek nem a gyökérben publikált változatot ellenőrzik.

## Városadatok és licenc

Forrás: [GeoNames](https://www.geonames.org/)  
Adatlicenc: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)

Az alkalmazás GeoNames-adatokból származó, JSON-formátumra átalakított városadatokat használ. Betöltéskor szűri a használható rekordokat, és ékezetfüggetlen keresési mezőket készít a nevekből és az elérhető alternatív nevekből. A megjelenített városneveket megőrzi.

A GeoNames-adatok licence nem jelenti automatikusan az alkalmazás saját forráskódjának azonos licencelését.

## Adatvédelem

Az órák és a felületi beállítások a böngésző helyi tárhelyén maradnak. Az alkalmazás nem tartalmaz követőkódot.

Az időszinkronizálás a TimeAPI szolgáltatáshoz küld hálózati kérést, amely így megkapja a felhasználó IP-címét. A weboldal és fájljai letöltésekor a tárhelyszolgáltató is kezelhet hálózati adatokat.

A városkeresés a letöltött helyi adatállományban történik; a beírt keresőkifejezéseket az alkalmazás nem küldi el a GeoNames vagy a TimeAPI szolgáltatásnak.
