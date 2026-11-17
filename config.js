/* =========================================================
   OPERATIE GRENSLAND – INSTELLINGEN
   Pas dit bestand aan voor het spel. Je hoeft niets anders
   te veranderen. Zie README.md voor uitleg.
   ========================================================= */
window.GRENSLAND = {

  // --- Contact ---------------------------------------------------
  // WhatsApp-groep waar de bendes hun bewijs posten.
  whatsappGroep: "https://chat.whatsapp.com/BUVKn5gK0qPKxXlNUAzPfb",
  // Noodknop: groepsleider.
  noodNaam: "Flore",
  noodTel: "+32468577043",

  // Pincode om de app te resetten (alleen voor de leiding).
  leidingPin: "1234",

  // --- Uren (24u-notatie, vandaag) --------------------------------
  tijden: {
    start: "19:40",       // spel begint
    nachtValt: "20:35",   // smokkelhuis dicht, Elias krijgt versterking
    eindsignaal: "20:55", // controles stoppen, iedereen naar het depot
    einde: "21:05"        // verzamelen aan het depot
  },

  // --- Kaart -----------------------------------------------------
  // Coördinaten overgenomen van de spelkaart (Westouter / Boeschepe).
  // Wil je een plek verschuiven? In Google Maps: vinger op de plek houden
  // (gsm) of rechtsklik (computer) en de twee getallen kopiëren.
  kaart: { centrum: [50.8047, 2.7237], zoom: 16 },

  plekken: [
    { id: "N",     naam: "Overgang N",   type: "post",   ll: [50.80809, 2.72506] },
    { id: "H",     naam: "Hoofdpost H (Sint-Pietersstraat)", type: "post", ll: [50.80315, 2.72246] },
    { id: "Z",     naam: "Overgang Z",   type: "post",   ll: [50.79901, 2.72274] },
    { id: "huis",  naam: "Smokkelhuis (Rue des Sept Mesures / Rue Duyen Drève)", type: "huis", ll: [50.80596, 2.71751] },
    { id: "depot", naam: "Depot (Verbrandhofstraat)", type: "depot", ll: [50.80340, 2.73192] }
  ],

  // --- Bendes ----------------------------------------------------
  // "straat" = een woord uit de straatnaam van hun dropplaats (opdracht 0).
  bendes: {
    rood:  { naam: "Bende Rood",  kleur: "#e8412c", info: "nummers 1–11",  straat: ["sept mesures"] },
    blauw: { naam: "Bende Blauw", kleur: "#3a8cf2", info: "nummers 21–30", straat: ["duyen"] },
    geel:  { naam: "Bende Geel",  kleur: "#e0b520", info: "nummers 41–50", straat: ["reninghelst"] }
  },

  // --- Objecten --------------------------------------------------
  objecten: [
    { e: "🥄", naam: "Lepel",          punten: 5 },
    { e: "🧴", naam: "Fles water",     punten: 10 },
    { e: "⚽", naam: "Voetbal",        punten: 20 },
    { e: "🪣", naam: "Emmer",          punten: 30 },
    { e: "🔶", naam: "Verkeerskegel",  punten: 50 },
    { e: "📦", naam: "Lege bierbak (2 dragers)", punten: 80 }
  ],

  // --- Power-ups -------------------------------------------------
  powerups: {
    vrijgeleide:   { e: "📜", naam: "Vrijgeleide",    uitleg: "Je groep passeert één keer een douanepost zonder controle. Niet tegen Elias." },
    snelpas:       { e: "⚡", naam: "Snelpas",        uitleg: "Je volgende controle aan een post duurt maar 5 seconden. Niet tegen Elias." },
    valsepapieren: { e: "🪪", naam: "Valse papieren", uitleg: "Betrapt aan een post? Je mag je object één keer houden. Niet tegen Elias." },
    dubbel:        { e: "✖️", naam: "Dubbel",         uitleg: "Je volgende object aan het depot telt dubbel." },
    verklikker:    { e: "🔦", naam: "Verklikker",     uitleg: "Elias moet 3 minuten stilstaan. De spelleider belt hem.", timer: 180, meld: true }
  },

  // --- Challenges ------------------------------------------------
  // Elke challenge verschijnt vanzelf op het juiste uur.
  // De spelleider stuurt de winnende bende de CODE (zie codes-leiding.txt).
  // Hier staat alleen een versleutelde versie (hash), zodat leden de codes niet kunnen vinden.
  // Nieuwe codes maken? Zie README.md.
  challenges: [
    { tijd: "19:50", naam: "Het smokkellied",      opdracht: "Verzin een smokkelaarslied van minstens 4 regels over jullie bende. Stuur een video, fluisterend gezongen.", powerup: "snelpas",       codeHash: "511f83ce59dfc945fbad873b9f43cefe92a0885e63a788497aaffeec66d48834" },
    { tijd: "20:00", naam: "Camouflage",           opdracht: "Maak met wat je in de berm vindt een camouflagepak voor één lid. Stuur een foto.", powerup: "vrijgeleide",   codeHash: "9f2dbaa0ce20c2328f95a48470dee9db545a23c65d1f49281a04f365096bf25c" },
    { tijd: "20:10", naam: "Eén voet in elk land", opdracht: "Groepsfoto met minstens 4 leden op de grens: één voet in Frankrijk, één in België.", powerup: "dubbel",        codeHash: "eb1eea16934accf9230a12a3aa9ef9b0f380bdbea601809cfdc1abde81dbb3a8" },
    { tijd: "20:20", naam: "Spionnenfoto",         opdracht: "Maak een foto waarop een douanier herkenbaar staat, zonder betrapt te worden.", powerup: "verklikker",    codeHash: "48341c0e4bc31fead9ef7fea370d70d2df7be77fe01d38e2894da91759fb079a" },
    { tijd: "20:30", naam: "Smokkelaarsnamen",     opdracht: "Verzin voor elk lid een smokkelaarsnaam. Film hoe iedereen zich fluisterend voorstelt.", powerup: "valsepapieren", codeHash: "be7fd5b0902e29ff313ad55089823fe455d68ccced7e489188579a5651c116ef" },
    { tijd: "20:40", naam: "Menselijke letters",   opdracht: "Vorm met jullie lichamen de letters K-S-A. Stuur een foto.", powerup: "verklikker",    codeHash: "125d97e08dcda42be7c1138aa1174459b0700ff7a960039440017e1406b7c0af" }
  ]
};
