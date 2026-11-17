# GitHub és saját domain

Jelenleg nincs automatikus publikálásra beállított workflow. A projekt build nélküli, így Actions nem szükséges.

## Feltöltés és későbbi közzététel

1. Bontsd ki a ZIP-et. A README, package.json, tests és dist közvetlenül a repository gyökerébe kerüljenek.
2. GitHubon hozz létre repositoryt, majd töltsd fel a kibontott fájlokat. A ZIP önmagában történő feltöltése nem hoz létre működő weboldalt.
3. Helyben futtasd az npm test parancsot és próbáld ki az alkalmazást.
4. Csak a közzététel jóváhagyása után másold a dist teljes tartalmát egy docs mappába egy külön publikálási branch-en, vagy a teljes tartalmat egy gh-pages branch gyökerébe. Az utóbbi ajánlott, mert a projekt dokumentációja már docs néven szerepel.
5. Settings → Pages → Deploy from a branch → gh-pages → /(root).
6. A dist tartalmát kell publikálni. A tesztek és a projektleírás nem szükségesek a futó oldalhoz.
7. Új kiadásnál növeld a sw.js verzióját, másold a teljes dist tartalmat a publikálási branch-re, és ellenőrizd a várakozó frissítést.
8. Projektcímen a /repository/ végén levő perjel legyen meg. A relatív hivatkozások ehhez igazodnak.

A forrás és a publikált branch kezeléséhez használható Git vagy GitHub Desktop. A webes feltöltésnél a rejtett .nojekyll fájlról is gondoskodj.

## Saját domain

Vásárolj domaint egy regisztrátornál, vagy használd a meglévőt. A DNS-kezelés annak a szolgáltatónak a felületén történik, amely a domain névszervereit kezeli.

Először GitHub-fiók Settings → Pages alatt ellenőrizd a domain tulajdonjogát. A GitHub által megadott egyedi TXT-rekordot pontosan másold a DNS-be, majd végezd el az ellenőrzést. Ezután a repository Settings → Pages → Custom domain mezőjébe írd a választott domaint.

clock.example.com jellegű aldomainhez CNAME rekordot használj, célja a saját FELHASZNALO.github.io címed. A célban ne szerepeljen repository-útvonal vagy https://. Gyökérdomainhez a szolgáltatód által támogatott ALIAS/ANAME vagy a GitHub dokumentációjában felsorolt aktuális A/AAAA rekordok kellenek. A konkrét címlistát a beállítás napján másold a hivatalos oldalról; ez a csomag nem rögzít változható IP-címeket.

Várd meg a DNS- és tanúsítványellenőrzést, majd kapcsold be az Enforce HTTPS beállítást. Ellenőrizd a manifest, sw.js, ikonok és városadatok HTTPS-elérését, az offline újratöltést és a telepítést. Domainváltáskor a korábbi domain localStorage-beállításai és telepített PWA-ja nem költöznek automatikusan.

Hivatalos útmutatók:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
