# Windows Server 2003 Desktop Implementation

## Oversikt
Har implementert en Windows Server 2003-inspirert desktop interface med følgende funksjoner:

## Struktur og Komponenter

### 1. **Mappestruktur**
- Flyttet alle bilder fra `src/pictures/` til `src/assets/images/` (følger prosjektstrukturen)
- Opprettet types i `src/types/desktop.ts`
- Komponenter plassert i `src/components/`

### 2. **Komponenter**

#### Desktop.vue (`src/components/Desktop.vue`)
- Hovedkomponent som inneholder hele desktop-interfacet
- Bakgrunnsfarge: `#1c458a` (Windows Server 2003 blå)
- Viser wallpaper-bildet i midten
- Håndterer alle desktop-ikoner med forhåndsdefinerte posisjoner
- Håndterer åpne vinduer med state management
- Fokushåndtering (z-index)
- Minimize/maximize funksjonalitet
- Forhindrer dupliserte vinduer

#### DesktopIcon.vue (`src/components/DesktopIcon.vue`)
- Gjenbrukbar komponent for desktop-ikoner
- **Draggable**: Ikoner kan dras rundt på skrivebordet
- **Dobbeltklikk**: Åpner vinduer når du dobbeltklikker
- Bruker bildene fra `assets/images/`:
  - Members.png
  - MailUs.png
  - Documentation.png
  - Bin.png

#### Window.vue (`src/components/Window.vue`)
- Fullstendig Windows Server 2003-stil vindu
- **Draggable**: Dra vinduer rundt ved å holde i tittellinjen
- **Resizable**: Endre størrelse ved å dra i hjørnet
- **Maximize/Restore**: Forstørr til fullskjerm eller gjenopprett
- **Minimize**: Minimer til taskbar
- **Close**: Lukk vindu med X-knapp
- Autentisk Windows XP/Server 2003 styling:
  - Blå tittellinje med gradient
  - Grå/hvit vindusramme
  - Standard minimize/maximize/close knapper

#### Taskbar.vue (`src/components/Taskbar.vue`)
- **GRÅ DESIGN**: Autentisk Windows Server 2003 grå taskbar
- **Vindushåndtering**: Viser alle åpne vinduer som knapper
- **Klikk for å fokusere**: Klikk på taskbar-knapp for å fokusere vindu
- **Klikk for å gjenopprette**: Minimerte vinduer gjenopprettes ved klikk
- **Høyreklikk for å lukke**: Lukk vindu ved å høyreklikke på taskbar-knappen
- Grønn "Start"-knapp med start.png-ikon
- Klokke i system tray (oppdateres hvert sekund)
- 30px høyde med riktige grå farger og skygger

### 3. **TypeScript Types** (`src/types/desktop.ts`)
- `DesktopIcon`: Interface for desktop-ikoner
- `Position`: Interface for posisjonering
- `Window`: Interface for vinduer med state (minimized, maximized, z-index)
- God typing for all funksjonalitet

### 4. **Styling**
- Globale stiler i `src/style.css` oppdatert med Windows-tema
- Tahoma font (standard Windows-font)
- Bakgrunnsfarge `#1c458a`
- Full viewport uten scrolling

## Funksjoner

### Implementert
1. **Windows Server 2003 Desktop**:
   - Blå bakgrunn (#1c458a)
   - Wallpaper-bilde sentralt plassert
   - Autentisk utseende

2. **Draggable Icons**:
   - 4 ikoner med relevante navn
   - Kan dras fritt rundt på skrivebordet
   - Smooth hover-effekter
   - Åpner vinduer ved dobbeltklikk

3. **Vinduer (Windows)**:
   - Draggable: Dra vinduer ved å holde i tittellinjen
   - Resizable: Endre størrelse ved å dra i hjørnet
   - Minimize: Minimer til taskbar
   - Maximize/Restore: Forstørr til fullskjerm eller gjenopprett
   - Close: Lukk med X-knapp i hjørnet
   - Focus: Klikk for å bringe vindu til front
   - Flere vinduer kan være åpne samtidig
   - Forhindrer dupliserte vinduer

4. **Taskbar**:
   - **GRÅ Windows Server 2003-stil** (ikke blå lenger)
   - Grå/hvit gradient bakgrunn
   - Grønn Start-knapp med ikon
   - Fungerende klokke
   - **Viser alle åpne vinduer som knapper**
   - **Klikk på taskbar-knapp for å fokusere/gjenopprette vindu**
   - **Høyreklikk på taskbar-knapp for å lukke vindu**
   - Visuell indikasjon på minimerte vinduer

5. **God Kodestruktur**:
   - Følger STRUCTURE.md
   - Separasjon av concerns
   - TypeScript for type-sikkerhet
   - Gjenbrukbare komponenter
   - God kohesjon og lav kobling
   - Event-driven arkitektur

## Ikonplasseringer (forhåndsdefinert)
- Members: (20, 20)
- Mail Us: (20, 120)
- Documentation: (20, 220)
- Bin: (20, 320)

## Brukerinstruksjoner

### Hvordan bruke:
1. **Åpne vinduer**: Dobbeltklikk på desktop-ikoner
2. **Dra vinduer**: Klikk og hold i tittellinjen, dra til ønsket posisjon
3. **Endre størrelse**: Dra i nedre høyre hjørne av vinduet
4. **Minimize**: Klikk på "_" knappen i vinduets øvre høyre hjørne
5. **Maximize**: Klikk på "□" knappen for å forstørre til fullskjerm
6. **Restore**: Klikk på "❐" knappen for å gjenopprette normal størrelse
7. **Lukk vindu**: 
   - Klikk på "✕" knappen i vinduets øvre høyre hjørne, ELLER
   - Høyreklikk på vinduets knapp i taskbaren
8. **Fokuser vindu**: Klikk på vinduets knapp i taskbaren
9. **Gjenopprett minimert vindu**: Klikk på vinduets knapp i taskbaren

## Fremtidig Utvidelse
Vinduer kan utvides til å inneholde:
- Faktisk innhold (forms, lister, etc.)
- Router-integrasjon for navigasjon
- Persistert tilstand (localStorage)
- Start-meny funksjonalitet
- Kontekstmenyer (høyreklikk)

## Kjør Prosjektet
```bash
npm run dev
```