# Familiens sjakkbrett: Produktretning, roadmap og backlog

## Produktmål

Bygg et digitalt sjakkbrett som får familien til å spille sammen oftere, med lav terskel for å starte, varm og motiverende UX, og nok progresjon og lek til at barn mellom 8 og 14 år får lyst til å komme tilbake.

## Primært mål nå

Første prioritet er ikke å bygge en komplett sjakkplattform. Første prioritet er å gjøre appen så enkel, inviterende og hyggelig at hele familien faktisk bruker den sammen med 10-åringen.

## Sekundært mål

Når familiebruken sitter, skal appen gradvis støtte læring og mestring gjennom oppgaver, hint, progresjon og forklaring i barnespråk.

## Produktprinsipper

- Start spill umiddelbart uten friksjon.
- Lokalt spill må føles som standardopplevelsen.
- Innlogging og skyfunksjoner skal være valgfritt til å begynne med.
- UX skal være varm, tydelig og oppmuntrende.
- Belønninger skal bygge mestring, ikke stress.
- Tap skal ikke føles som straff.
- Læringsfunksjoner skal støtte lek, ikke dominere den.
- Barn skal forstå hva appen vil at de skal gjøre uten forklaring fra en voksen.
- Appen bør fungere godt offline og kunne lagres på hjemskjerm.

## Anbefalt hovedretning

### Anbefalt nå: Lek og familie

Denne retningen prioriterer rask start, lokale familiepartier, hyggelig stemning, avatarer, enkel progresjon, utfordringer og små belønninger.

Hvorfor denne bør lede først:

- Den matcher målet om å få hele familien til å spille sammen.
- Den gir verdi før sky, kontoarbeid og avansert analyse er ferdig.
- Den reduserer friksjon og gjør appen mer sosial.
- Den gir et naturlig grunnlag for senere læringsfunksjoner.

### Sekundær retning: Lær og mestre

Denne retningen bygger videre på familieopplevelsen med oppgaver, hint, mini-leksjoner, forklaringer og progresjon.

Denne bør komme som lag 2, ikke lag 1.

### Tredje retning: Samle og eie

Denne retningen handler om avatarer, temaer, historikk, trofeer, favorittpartier, badges og sesongbaserte mål.

Denne kan flettes gradvis inn parallelt med familieopplevelsen fordi den øker motivasjon uten å gjøre kjernen mer komplisert.

## Tre produktretninger

### Retning A: Familiens sjakkstue

Tone:

- varm
- hjemlig
- sosial
- inkluderende

Kjerne:

- spill sammen på samme enhet
- raske rematcher
- familieprofiler
- familieutfordringer
- mild progresjon

Bra for:

- hverdagsbruk
- søsken og foreldre
- lav terskel

### Retning B: Sjakk-eventyr

Tone:

- fantasifull
- leken
- oppdragsdrevet

Kjerne:

- oppdrag
- baner
- figurverden
- små boss-kamper
- lås opp innhold

Bra for:

- høy motivasjon hos barn
- historiedrevet læring

Risiko:

- mer innholdsarbeid
- større design- og skrivebehov

### Retning C: Min sjakktrener

Tone:

- tydelig
- smart
- mestringsorientert

Kjerne:

- hint
- oppgaver
- analyse i enkelt språk
- progresjonskart

Bra for:

- barn som vil lære raskere
- 10-åringen spesifikt

Risiko:

- kan bli for “skolete” hvis det prioriteres for tidlig

## Anbefalt miks

Bygg produktet som:

- 60 % Familiens sjakkstue
- 25 % Samle og eie
- 15 % Min sjakktrener i første omgang

Det betyr:

- leken familieopplevelse først
- mestring som støtte, ikke hovedfokus
- tydelig progresjon uten at appen føles som lekser

## Pakkestruktur

For å unngå kaos bør backloggen bygges i “pakker” som kan leveres trinnvis.

### Pakke A: Instant Play

Mål:

- gjør landingssiden spillklar
- gjør lokalt spill til standard

Innhold:

- spillklart lokalt brett på forsiden
- automatisk lagring av lokalt spill
- nytt lokalt spill
- rematch
- bytt spiller på samme enhet
- tydelig “din tur”

Avhengigheter:

- ingen større

Prioritet:

- P0

### Pakke B: Familieprofiler

Mål:

- gi hele familien en enkel identitet uten tung auth

Innhold:

- familieprofil med navn og PIN
- avatar eller profilfarge
- rask profilvelger
- lokal tilknytning av spill til profil
- valgfri skykonto senere

Avhengigheter:

- Pakke A

Prioritet:

- P0

### Pakke C: Emosjonell UX

Mål:

- gjøre appen varm, hyggelig og motiverende

Innhold:

- bedre onboarding-tonen
- vennlige statusmeldinger
- positive post-game meldinger
- bedre tomtilstander
- små seiersanimasjoner
- tydelig og morsom feedback ved rematch, seier, tap og lagring

Avhengigheter:

- Pakke A

Prioritet:

- P0

### Pakke D: Belønning og progresjon

Mål:

- få barna til å ville komme tilbake

Innhold:

- badges
- milepæler
- enkle poeng
- familieutfordringer
- ukens mål
- historikk over fremgang

Avhengigheter:

- Pakke A
- Pakke B

Prioritet:

- P1

### Pakke E: Oppdrag og utfordringer

Mål:

- gjøre appen rikere enn bare “spill et parti”

Innhold:

- dagens oppgave
- enkle utfordringer
- matt i 1
- vinn en brikke
- spill tre partier denne uka
- fullfør et parti mot en voksen

Avhengigheter:

- Pakke D

Prioritet:

- P1

### Pakke F: Læring og mestring

Mål:

- støtte barn som vil bli bedre

Innhold:

- hint
- lovlige trekk som forklares tydelig
- hva truer motstanderen
- mini-leksjoner
- partikommentarer i barnespråk
- tren fra stilling

Avhengigheter:

- Pakke A
- Pakke D

Prioritet:

- P1

### Pakke G: Familie-meta

Mål:

- gjøre opplevelsen sosial og personlig

Innhold:

- familieliga
- rivalisering i mild tone
- månedens spiller
- hvem spiller mest
- “beste comeback”
- delte familieøyeblikk

Avhengigheter:

- Pakke B
- Pakke D

Prioritet:

- P2

### Pakke H: Sky og synk

Mål:

- støtte spill på tvers av enheter når familien ønsker det

Innhold:

- persister lokalt spill ved innlogging
- migrer lokal profil til skyprofil
- start online-spill mellom profiler
- sanntidssynk
- historikk per bruker

Avhengigheter:

- Pakke A
- Pakke B

Prioritet:

- P2

### Pakke I: PWA og offline

Mål:

- appen skal kunne lagres på hjemskjerm og fungere uten nett

Innhold:

- manifest
- service worker
- cache strategi for app shell
- offline fallback
- install prompt
- ikoner og splash assets

Avhengigheter:

- Pakke A

Prioritet:

- P1

## Prioritert roadmap

## Fase 1: Få familien inn i appen

Mål:

- gjøre appen umiddelbart spillbar og hyggelig

Må leveres:

- Instant Play
- Familieprofiler
- Emosjonell UX

Konkrete features:

- spillklart brett på forsiden
- nytt lokalt spill og rematch
- profilvelger med PIN
- avatar eller profilfarge
- lagring av lokalt spill
- varm velkomsttekst
- tydelig “din tur”
- vennlige meldinger etter parti
- bedre mobilopplevelse

Definisjon på suksess:

- et barn kan starte et spill på under 10 sekunder
- forelder og barn skjønner flyten uten forklaring
- minst én rematch skjer naturlig etter første parti

## Fase 2: Gjør appen vanedannende på en god måte

Mål:

- gi barna grunn til å komme tilbake

Må leveres:

- Belønning og progresjon
- Oppdrag og utfordringer
- PWA og offline

Konkrete features:

- badges
- milepæler
- ukens utfordring
- dagens oppgave
- enkle trofeer
- hjemskjerminstallasjon
- offline spill
- fortsett der du slapp

Definisjon på suksess:

- barn åpner appen igjen frivillig
- familien bruker appen på tvers av flere dager
- appen fungerer fint på mobil uten nett

## Fase 3: Legg inn læring uten å miste leken

Mål:

- støtte 10-åringens utvikling uten å miste resten av familien

Må leveres:

- Læring og mestring

Konkrete features:

- hint i flere nivåer
- forklaring av trusler
- mini-leksjoner
- oppgaveløyper
- analyse i enkelt språk

Definisjon på suksess:

- barnet opplever hjelp som nyttig, ikke belærende
- læringsfunksjonene brukes frivillig

## Fase 4: Synk og familie-meta

Mål:

- utvide opplevelsen når kjerneproduktet sitter

Må leveres:

- Sky og synk
- Familie-meta

Konkrete features:

- persister lokalt spill ved innlogging
- spill mellom to enheter
- familieliga
- månedens spiller
- delte minner og historikk

Definisjon på suksess:

- sky gir verdi uten å øke friksjon i kjernen
- familien opplever at historikken betyr noe

## Første 10 features å bygge

Dette er rekkefølgen jeg ville brukt nå.

1. Spillklart lokalt brett på forsiden
2. Familieprofil med navn + 4 til 6-sifret PIN
3. Automatisk lagring og gjenopptak av lokalt spill
4. Rematch og “start nytt lokalt spill”
5. Avatarer eller profilfarger
6. Tydelig “din tur” og vennlig parti-feedback
7. Enkle badges og milepæler
8. Dagens oppgave eller ukens familieutfordring
9. PWA installasjon og offline-støtte
10. Hint og læringsstøtte i barnespråk

## Backlog etter tema

### Tema: Rask familiebruk

- spill med én gang fra landingssiden
- rematch
- hurtigbytte spiller
- pause og fortsett senere
- større touchmål
- tydelig turindikator

### Tema: Familieidentitet

- familieprofiler
- PIN
- avatar
- profilfarge
- favorittbrikkestil per barn

### Tema: Belønning

- første parti badge
- 10 partier badge
- første matt badge
- ukens innsats
- stjerner for oppgaver
- troféhylle

### Tema: Oppdrag

- dagens oppgave
- ukens familieutfordring
- spill tre partier
- matt i 1
- vinn med rokade gjennomført
- beskytte kongen-utfordring

### Tema: Barnespråklig feedback

- “Bra trekk”
- “Pass på dronningen”
- “Sterk åpning”
- “Nesten matt”
- “Flott at du fullførte partiet”

### Tema: Læring

- hva kan denne brikken gjøre
- hint nivå 1 til 3
- trusselmarkering
- mini-leksjoner
- stillingsøvelser
- sluttspillintro

### Tema: Sosialt

- familieliga
- månedens spiller
- rivaler
- historikk mot familiemedlem
- delte høydepunkter

### Tema: Offline og PWA

- installerbar app
- appikon
- offline caching
- lagring i browser
- resume etter app restart
- hjemskjermvennlig launch

## UX-idéer som bør få høy plass

Dette er spesielt viktig for målgruppen.

- appen bør åpne med et brett, ikke et kontrollpanel
- teksten skal være varm, enkel og kort
- belønninger skal feire innsats, ikke bare seier
- barn skal aldri føle at de “gjør appen feil”
- farger, avatarer og små overraskelser øker eierskap
- læringshjelp bør komme som støtte, ikke som retting

## Risikoer vi bør styre unna

- for mye fokus på konto og sky tidlig
- for mange menyer
- for mye tekst
- for mye “voksen sjakk-app”
- for hard ranking
- for mye skolepreg i læringsdelen
- for mange features uten en tydelig hovedsløyfe

## Hovedsløyfen vi bygger rundt

Den viktigste løkken i produktet bør være:

- åpne appen
- start eller fortsett lokalt spill
- få en hyggelig reaksjon etter partiet
- få et lite mål eller en liten belønning
- få lyst til å spille igjen

## Anbefalt neste leveranse

Hvis vi følger denne planen, bør neste faktiske implementasjonspakke være:

1. fullføre og polere Instant Play
2. gjøre familieprofil + PIN visuelt og UX-messig enkel
3. legge inn avatar/profilfarger
4. bygge første runde med parti-feedback
5. starte PWA-grunnlaget

Etter det:

1. badges
2. dagens oppgave
3. offline
4. hint
