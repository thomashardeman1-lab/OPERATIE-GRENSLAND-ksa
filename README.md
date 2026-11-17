# Operatie Grensland – de app

De app voor het smokkelspel van de KSA-jonghernieuwers. Hij werkt in de browser van elke gsm, en je kunt hem op het beginscherm zetten zoals een gewone app.

**Wat de app doet**
- Een kaart met je eigen gps-positie, de overgangen N, H en Z, het smokkelhuis en het depot, en de afstand naar het smokkelhuis en het depot.
- Opdracht 0: de app gaat pas open als de bende de juiste straatnaam intypt.
- Een klok met de fases van het spel: start, nacht valt, eindsignaal en einde. Op elk van die momenten trilt de gsm en verschijnt er een melding.
- Challenges die vanzelf verschijnen op het juiste uur, met een knop om het bewijs via WhatsApp naar de spelleider te sturen.
- Power-ups, die je ontgrendelt met een code van de spelleider. Bij het activeren verschijnt een groot scherm met een live klok, om aan de douane te tonen.
- De regels, een noodknop om de spelleider te bellen, en een optie om het scherm aan te laten.

---

## 1. Online zetten met GitHub Pages (±10 minuten)

1. Maak op github.com een nieuwe repository aan, bijvoorbeeld `grensland`, en zet hem op **Public**. Op een gratis account werkt GitHub Pages alleen met een publieke repository.
2. Klik op **Add file → Upload files** en sleep **alle bestanden uit deze map** erin (`index.html`, `app.js`, `config.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `README.md`). Klik op **Commit changes**.
3. Ga naar **Settings → Pages**. Kies bij *Source* **Deploy from a branch**, kies de branch `main` en de map `/ (root)`, en klik op **Save**.
4. Wacht een minuutje. Je app staat dan op:
   `https://JOUW-GEBRUIKERSNAAM.github.io/grensland/`

> ⚠️ Upload het bestand **codes-leiding.txt** NIET. Daarin staan de power-up-codes, en die mogen de leden niet zien.

## 2. Instellingen aanpassen (`config.js`)

Open `config.js` op GitHub, klik op het potloodje om het te bewerken, en klik daarna op **Commit changes**.

- **`spelleiderWhatsApp`**: het gsm-nummer van de spelleider, met landcode en zonder +, spaties of eerste 0. Bijvoorbeeld 0470 12 34 56 wordt `32470123456`.
- **`spelleiderTel`**: hetzelfde nummer, voor de noodknop.
- **`tijden`**: de uren van het spel.
- **`plekken`**: ⚠️ **verplicht aan te passen.** Nu staan er geschatte coördinaten. Zo vind je de juiste:
  - Open Google Maps en houd je vinger op de plek (gsm) of klik rechts (computer).
  - Kopieer de twee getallen, bijvoorbeeld `50.80812, 2.71234`.
  - Zet ze bij de juiste plek: `ll: [50.80812, 2.71234]`.
  - Doe dit voor N, H, Z, het smokkelhuis en het depot. Zet ook `kaart.centrum` ergens in het midden van het speelveld.
- **`bendes → straat`**: een woord uit de straatnaam van elke dropplaats, voor opdracht 0.
- **`leidingPin`**: de pincode om de app te resetten.

## 3. Testen met de demomodus

Zet `?demo=30` achter het adres:
`https://JOUW-GEBRUIKERSNAAM.github.io/grensland/?demo=30`

De klok begint dan meteen bij de start van het spel en loopt 30 keer sneller. Zo zie je in een paar minuten alle challenges en fases voorbijkomen. Je kunt de codes uit `codes-leiding.txt` gebruiken om de power-ups te testen.

Daarna kun je de app op de testgsm resetten bij **Regels → App resetten** (met de pincode).

## 4. Op de avond zelf

**Voor het spel, op elke team-gsm**
1. Open de link in **Safari (iPhone)** of **Chrome (Android)**.
2. Zet de app op het beginscherm:
   - iPhone: Delen ⬆️ → *Zet op beginscherm*
   - Android: menu ⋮ → *App installeren*
3. Geef de app toestemming om je locatie te gebruiken.
4. Open de app één keer **thuis, op wifi** en scrol over het speelveld. De kaart wordt dan bewaard, zodat ze ook werkt als het bereik ter plaatse zwak is.
5. Kies **nog geen bende**. Dat doet de kapitein bij de drop.
6. Laad de gsm volledig op en geef een powerbank mee.

**Tijdens het spel**
- De challenges verschijnen vanzelf. De bende stuurt het bewijs via de WhatsApp-knop naar de spelleider.
- De spelleider beslist wie eerst was en stuurt **alleen die bende** de code van die challenge. De bende typt de code in en krijgt de power-up.
- Een power-up activeert de bende zelf in de app. Daarna verschijnt een scherm met een live klok, om aan de douanier te tonen. Bij de Verklikker meldt de bende het meteen via WhatsApp, zodat de spelleider Elias kan bellen.

## 5. Nieuwe codes maken (optioneel)

De codes staan in `config.js` alleen als hash (een versleutelde vingerafdruk), zodat niemand ze in de code kan lezen. Wil je zelf nieuwe codes kiezen:

1. Kies een code, bijvoorbeeld `KEGEL-1234`.
2. Haal de streepjes en spaties eruit en zet alles in hoofdletters: `KEGEL1234`.
3. Maak er een SHA-256-hash van. Dat kan met een "SHA-256 generator" op het internet, of op een Mac/Linux in een terminal:
   `printf KEGEL1234 | shasum -a 256`
4. Zet die hash bij `codeHash` van de juiste challenge.

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | De app zelf |
| `app.js` | De werking |
| `config.js` | **Alle instellingen: dit pas je aan** |
| `style.css` | De vormgeving |
| `sw.js` | Zorgt dat de app blijft werken bij zwak bereik |
| `manifest.webmanifest` + `icon-*.png` | Om de app op het beginscherm te zetten |

De kaart komt van © OpenStreetMap-bijdragers.
