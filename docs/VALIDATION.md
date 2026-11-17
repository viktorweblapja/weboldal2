# Ellenőrzési jelentés – 2026-11-16

## Igazolt

Az npm test öt tesztcsoportja sikeresen lefutott Node környezetben. A tesztek Budapest 2026. március 29-i és október 25-i átállását, amerikai átállást, ausztrál Lord Howe félórás átállását, fél- és negyedórás eltolásokat, UTC−12/UTC+14 határokat, szökőnapot, évváltást, AM/PM-et, ékezetnormalizálást, hibás szerverválaszt és monotón időalap-visszaállást ellenőriznek.

Chrome böngészőben az alkalmazás betöltött, az online szinkronizálás sikerült. A Service Worker offline-előkészítés jelzése megjelent. Budapest keresése, hozzáadása, előrébb mozgatása és újratöltés utáni sorrendje ellenőrizve. A v1 témája és időformátuma migrálódott. Újratöltéskor szinkronizálási hiba mellett tovább működött a rendszeridő.

A ZIP integritása, kibonthatósága és a kibontott projekt tesztjei ellenőrizve.

## Még nem igazolt

Valódi iOS, Android, macOS Safari, Firefox, Windows Edge telepítés és offline indítás. Teljes hálózatkiesési és helyreállítási integrációs teszt, több böngészőlapos Service Worker verziócsere, GitHub Pagesen publikált frissítés, saját domain és HTTPS tanúsítvány. Lighthouse-mérés nem történt. A 2.0 mobilos elrendezésének teljes regressziós tesztje még szükséges. Ezek miatt az összes elfogadási feltétel még nem tekinthető lezártnak.

## Biztonsági áttekintés

A felhasználói és városadatok textContent segítségével kerülnek a DOM-ba. Nincs dinamikus HTML-beillesztés, eval, külső szkript, titkos API-kulcs, analitika vagy helymeghatározási kérés. URL-paramétereket nem dolgozunk fel. A tárolt eltolások típus- és tartományellenőrzést kapnak; a városokat a helyi adatállományhoz kötjük. Runtime npm-függőség nincs, ezért npm-függőségaudit nem alkalmazható.

A meta CSP saját szkriptekre és erőforrásokra korlátoz, kizárólag a TimeAPI engedélyezett külső connect cél. A GitHub Pages egyedi HTTP-fejléceinek korlátai miatt frame-ancestors és teljes fejléces biztonsági politika nem állítható itt be. A domain, GitHub-fiók és publikálási jogosultságok biztonsága külön feladat.

Fennmaradó kockázatok: külső időszolgáltatás hibája vagy hibás ideje, hálózati aszimmetria, elavult időzóna-adatok, böngészőtárhely törlése és első városadat-betöltés költsége. A szolgáltató használati feltételeit és korlátait publikálás előtt ellenőrizni kell. Független biztonsági audit nem történt.

## Teljesítmény

Egy közös másodperces kijelzési időzítő és egy 15 perces szinkronizálási időzítő működik. Háttérben a kijelzési munka kimarad. A formázók időzónánként cache-eltek. A városadatok egyszer töltődnek be, a keresés helyi, legfeljebb 30 találatot rajzol. A 34 ezer bejegyzés miatt az első betöltés és normalizálás gyengébb telefonon észrevehető lehet; valós eszközös profilozás szükséges.
