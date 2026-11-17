# Működési leírás

Az alkalmazás HTML, CSS és natív JavaScript-modulok alapján működik. A böngésző tölti le a fájlokat és számolja az órákat. Saját szerveroldali program és adatbázis nem szükséges.

## Időalap

Induláskor a rendszeridőből indulunk, és az aktív munkamenetben performance.now() alapján számoljuk az eltelt időt. Egy közös másodperces időzítő frissíti a látható órákat. Háttérben a kijelzés frissítését kihagyjuk.

A TimeAPI UTC-végpontja induláskor, 15 percenként, visszatéréskor és kapcsolat-helyreálláskor kérdezhető le. Két próbálkozás között legalább 60 másodperc telik el. A 8 másodperces időtúllépés megszakítja a kérést. A 4 másodpercnél nagyobb válaszidőt elutasítjuk. A válasz időpontjához a mért oda-vissza út felét adjuk; ez szimmetrikus hálózatot feltételező becslés. A pontosságra nincs garancia.

A sikeres szinkronizálás időalapja legfeljebb egy óráig marad érvényes. Rendszeridő és monotón idő közötti két másodpercnél nagyobb eltérésnél visszaállunk rendszeridőre. Ez kezeli a megálló monotón órát és a készülékórán végzett változtatásokat is. A következő szinkronizálási esemény javíthatja az időalapot. Újraindítás után nincs tartósan tárolt szinkronidő. Az offline, becsült idő és rendszeridő állapota látható.

Külső szolgáltatás:
https://timeapi.io/api/time/current/zone?timeZone=UTC

2026-11-16-án HTTPS GET és Origin fejléc mellett HTTP 200, JSON-válasz és Access-Control-Allow-Origin: * volt ellenőrizhető. Böngészőben is sikerült szinkronizálni, újratöltéskor hibaág is előfordult. A szolgáltatásnak nincs a projektben garantált SLA-ja vagy igazolt tartós rendelkezésre állása. A publikus használati korlátok teljes ellenőrzése még szükséges a nyilvános indulás előtt.

## Városadatok és óraátállítás

34 216 bejegyzés a GeoNames cities15000 adatállományból, népesség szerint sorba rendezve, helyi JSON-fájlként. GeoNames ID, városnév, alternatív nevek, országkód, adminisztratív régiókód és IANA-zóna szerepel benne. A forrás főként 15 000 főnél nagyobb településeket és fővárosokat tartalmaz; nem teljes világtelepülés-lista.

Forrás és licenc:
https://download.geonames.org/export/dump/cities15000.zip
https://download.geonames.org/export/dump/readme.txt
https://creativecommons.org/licenses/by/4.0/

Átalakítás történt: mezők kiválasztása, népesség szerinti rendezés, JSON-kódolás. Letöltés dátuma 2026-11-16. GeoNames, CC BY 4.0, az adatok pontosságára nincs garancia.

Az Intl.DateTimeFormat számítja ki a város adott UTC-pillanathoz tartozó helyi idejét. Így a tavaszi kihagyott órák és őszi ismétlődő órák a böngésző időzóna-adatbázisából következnek. Lord Howe félórás átállítása is támogatott. Külön nyári/normál státuszcímkét nem alkalmazunk, az aktuális eltolás mindig látható. Elavult böngésző időzóna-adatbázisa eltérhet a friss jogszabályoktól.

## Tárolás és PWA

A localStorage tárolja a sorrendet, GeoNames ID-ket, kézi eltolásokat, témát és formátumot. Sérült JSON esetén alapértékek indulnak. Elérhetetlen tárolónál állapotüzenet jelenik meg. Más böngésző vagy más domain külön tárhelyet jelent.

A manifest relatív ./ start_url és scope értékei gyökérdomaint és projekt-alútvonalat is támogatnak. A Service Worker ugyanott van, mint az index.html. Az összes szükséges helyi fájlt telepítéskor egy verziózott cache-be tölti. Az API-válaszokat nem cache-eli. A telepítés meghiúsul, ha bármelyik szükséges fájl hiányzik.

Az új Service Worker várakozik. A felhasználó az új verzió gombjával aktiválja, az oldal újratölt. Verzió kiadásakor a sw.js CACHE-végződését módosítani kell. A felhasználói localStorage megmarad. Több egyidejű lap frissítési viselkedése további integrációs tesztet igényel. A gyorsítótárat az operációs rendszer vagy böngésző törölheti.

iPhone-on Safari megosztási menüjéből lehet a főképernyőhöz adni. A telepített PWA standalone megjelenítést kér; ennek támogatása platformfüggő. Android és asztali böngészők saját telepítési menüt biztosíthatnak. Valódi eszközön ez még ellenőrzendő.
