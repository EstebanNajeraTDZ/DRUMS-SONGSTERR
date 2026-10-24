# 🥁 Donner DED-300X Drum Practice Studio & Songsterr Downloader

Una aplicación completa diseñada específicamente para tu batería electrónica **Donner DED-300X**, combinando:
1. **Detección MIDI plug-and-play con latencia cero** y sintetizador de percusión acústica.
2. **Descarga gratuita de partituras y pistas de batería desde Songsterr** (con exportación a MIDI y Guitar Pro 5 `.gp5`).
3. **Practicador visual interactivo** idéntico a tus capturas (notación pentagrama + matriz secuenciador con sticking `R` / `L` / `K` y subdivisiones).
4. **Metrónomo profesional** inspirado en tus capturas (orbes luminosos, display gigante, botones `[-1]`, `[+1]`, `[-5]`, `[+5]`, slider, términos italianos y tap tempo).
5. **Modo "Pedazo por Pedazo" (Chunking)** para practicar compás por compás, 2 compases, 4 compases o flujo continuo con bucles por secciones.

---

## 🚀 Inicio Rápido

1. Conecta tu **Donner DED-300X** a tu PC mediante el cable USB (puerto USB tipo B del módulo de la batería).
2. Haz doble clic en el archivo [`run.bat`](file:///e:/Proyectos%20Software/Python/songster-drums-practice/run.bat) o ejecuta en tu terminal:
   ```bash
   python server.py
   ```
3. Se abrirá automáticamente en tu navegador preferido (Chrome, Edge, Brave u Opera) en:
   **[http://localhost:5000](http://localhost:5000)**

---

## 🥁 1. Detección MIDI de tu Donner DED-300X

- **Cero drivers o configuración requerida:** La app utiliza la **Web MIDI API** nativa de tu navegador. Detecta automáticamente tu Donner DED-300X al conectarla por USB.
- **Audio de latencia ultrabaja (<3ms):** Motor Web Audio con síntesis analógica y muestras de batería real:
  - **Bombo (Kick):** Nota MIDI 35 / 36 (Golpe sub-grave con envolvente de pitch).
  - **Tarola (Snare):** Nota MIDI 38 / 40 / 37 (Cuerpo afinado + bordona de ruido blanco filtrado).
  - **Hi-Hat:** Nota MIDI 42 (Cerrado), 46 (Abierto) y 44 (Pedal Chick). Incluye corte automático (*choke group*): al pisar o golpear el hi-hat cerrado, silencia el abierto instantáneamente.
  - **Toms 1, 2 y 3:** Notas MIDI 48, 45 y 43/41 con resonancia de parche de malla.
  - **Crash y Ride:** Notas MIDI 49/57 y 51/53 con decaimiento metálico extendido.
- **Visualizador interactivo de pads:** La batería en pantalla se ilumina y vibra con la fuerza de tu golpe.
- **Evaluación de precisión:** Al tocar junto a una canción, el sistema compara tus golpes con el tiempo exacto de la partitura y te califica:
  - 🟢 **¡PERFECTO!** (±40 ms)
  - 🟡 **BUENO** (±80 ms)
  - 🔴 **OFF-BEAT**

---

## 🎼 2. Descarga de Partituras de Songsterr (Gratis)

Songsterr almacena internamente las pistas de notas en formato JSON en su CDN CloudFront. Esta herramienta incluye el motor extractor que:
- **Busca cualquier canción** directamente escribiendo el artista o nombre (ej: *"Hoobastank The Reason"*, *"Smells Like Teen Spirit"*, *"Back in Black"*).
- **Acepta enlaces directos de Songsterr** (ej: `https://www.songsterr.com/a/wsa/hoobastank-the-reason-drum-tab-s9374`).
- **Descarga y parsea la pista de batería** automáticamente: notas, compases, tiempos, secciones (*Intro, Verso, Estribillo, Solo, Outro*) y cambios de tempo automáticos.
- **Exportación gratuita:**
  - Botón **⬇ MIDI**: Descarga la pista completa de batería en archivo `.mid` estándar (canal 10 General MIDI) para abrirla en Reaper, Ableton, FL Studio, Cubase, etc.
  - Botón **⬇ GP5**: Reconstruye y descarga el archivo original de Guitar Pro 5 (`.gp5`) para TuxGuitar o Guitar Pro.

---

## 🎯 3. Practicador Visual (Como en la Imagen 1)

### A. Drum Notation (Partitura Superior)
- Pentagrama clásico de 5 líneas con clave de percusión y compás (4/4, etc.).
- Notas coloreadas según el elemento de la batería (Verde: Tom 2, Morado: Tom 3, Naranja: Bombo, Rojo: Tarola, Amarillo: Hi-Hat, etc.).
- Agrupaciones de tresillos y sextillos con indicador numérico (`6`, `3`).
- **Fila de Sticking debajo del pentagrama:** Indica exactamente con qué mano o pie tocar cada golpe:
  - **R**: Mano Derecha (*Right Hand*)
  - **L**: Mano Izquierda (*Left Hand*)
  - **K**: Bombo (*Kick Pedal*)
  - **F**: Pedal de Hi-Hat (*Foot*)
- Acentos musicales marcados con `>` (ej: remates en la tarola).

### B. Matriz / Step Sequencer Roll (Matriz Inferior)
- 8 pistas completas:
  - `HI HAT` (amarillo)
  - `CRASH` (gris)
  - `RIDE` (rosa)
  - `TOM 1` (azul)
  - `TOM 2` (verde)
  - `TOM 3` (morado)
  - `SNARE` (rojo)
  - `KICK` (naranja)
- Botón **[M]** individual por pista para silenciar cualquier elemento (ej: silenciar el bombo para tocarlo tú solo).
- Encabezado con subdivisiones rítmicas:
  - Para compases con sextillos: `1 trip let + trip let  2 trip let + trip let  3 trip let + trip let  4 trip let + trip let` (idéntico a tu Imagen 1).
  - Para compases estándar: `1 e + a  2 e + a  3 e + a  4 e + a`.
- Cursor playhead animado que avanza suavemente al tempo de la canción.

---

## ⏱️ 4. Metrónomo Profesional (Como en las Imágenes 2 y 3)

- **4 Orbes de pulso:** El orbe 1 parpadea con acento naranja brillante y los orbes 2, 3 y 4 con amarillo intenso.
- **Display gigante de BPM:** Indicación clara del tempo y su término en italiano (*Andante, Moderato, Allegro, Prestissimo*).
- **Ajustes rápidos:** Botones `[-1]`, `[+1]`, `[-5]`, `[+5]` y slider continuo de 30 a 300 BPM.
- **Botón "Reset a BPM Original":** Restaura inmediatamente el tempo oficial de Songsterr.
- **Tap Tempo:** Pulsa rítmicamente el botón o la tecla **T** para fijar el tempo deseado al instante.
- **Sonido de Click activable/desactivable.**
- **Botón gigante naranja "INICIAR PRÁCTICA"** (también puedes usar la **Barra Espaciadora**).

---

## 🧩 5. Modo "Pedazo por Pedazo" & Opciones

- **Selector de tamaño de bloque:**
  - `1 Compás`: Práctica concentrada en un solo compás en bucle.
  - `2 Compases` o `4 Compases`: Práctica de frases completas y fills.
  - `Continuo`: Avanza compás tras compás por toda la canción.
- **Auto-Avanzar:** Cambia al siguiente compás tras dominar el actual.
- **Selector de Secciones:** Salta de golpe a *Intro*, *Estrofa 1*, *Coro*, *Puente*, etc.
- **Selector de Mano Guía:** Diestro (*R-Lead*) o Zurdo (*L-Lead*) para adaptar el sticking.
- **Pista Batería (ON/OFF):** Si la desactivas, escucharás solo el metrónomo y tu propia batería Donner DED-300X, ideal para tocar encima sin que la grabación original tape tus golpes.

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| --- | --- |
| **Espacio** | Iniciar / Pausar Práctica |
| **Flecha Izquierda (←)** | Compás Anterior |
| **Flecha Derecha (→)** | Compás Siguiente |
| **T** | Tap Tempo |
