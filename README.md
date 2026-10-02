# Matemática

App para aprender matemática paso a paso: microlecciones, ejercicios con validación línea por línea
y diagnóstico del error, aprendizaje adaptativo con repetición espaciada, escritura a mano
(en el PC o desde el móvil) que se convierte en fórmulas y una wiki de temas para consultar en
cualquier momento.

Son dos aplicaciones con las mismas funciones —una para Windows y otra para Android— que se
sincronizan entre sí: lo que practicas en una aparece en la otra (ver
[Sincronización del progreso](#sincronización-del-progreso)).

## Descargar

| App | Qué es | Descarga |
| --- | --- | --- |
| **Matemática** (escritorio, Windows) | La app completa: temario, lecciones, práctica, pizarra, progreso. Incluye el servidor local al que se conecta el móvil y guarda el progreso de referencia. | [Matematica-Setup-0.3.0.exe](https://github.com/gabrielCoder406/App-Matematicas/releases/download/v0.3.0/Matematica-Setup-0.3.0.exe) (113 MB) |
| **Pizarra Matemática** (Android) | La misma app que la de escritorio, con el progreso sincronizado con el PC. Conectado, también sirve de pizarra del PC: lo que escribes en el teléfono aparece allí. | [PizarraMatematica-0.3.0.apk](https://github.com/gabrielCoder406/App-Matematicas/releases/download/v0.3.0/PizarraMatematica-0.3.0.apk) (4,9 MB) |

Todas las versiones, con sus novedades, están en [Releases](https://github.com/gabrielCoder406/App-Matematicas/releases).

## Instalar

### App de escritorio (Windows)

1. Descarga y ejecuta `Matematica-Setup-<versión>.exe`. Windows puede mostrar «Windows protegió su PC» porque el instalador no está firmado: elige **Más información → Ejecutar de todas formas**.
2. La primera vez que abras la app, Windows puede preguntar si permite el acceso a la red: marca **Redes privadas** y acepta. Sin ese permiso el móvil no podrá conectarse.
3. Para la inteligencia artificial, instala [Ollama](https://ollama.com/download) (gratis) y, en **Ajustes**, descarga los dos modelos (ver abajo). Sin IA, todo lo demás funciona: el motor matemático de la app corrige los pasos, da las pistas y detecta los errores por su cuenta.

Tus datos (progreso y ajustes) quedan en `%APPDATA%\Matematica`. Desinstalar la app no los borra.

### Inteligencia artificial (en tu PC)

La IA corre en el propio equipo con [Ollama](https://ollama.com), sin Internet ni costo:

| Para qué | Modelo | Descarga | Tiempo aproximado* |
| --- | --- | --- | --- |
| Leer la escritura a mano y convertirla en fórmulas | `deepseek-ocr` (DeepSeek-OCR) | 6,7 GB | ~20 s por lectura (la primera, ~1,5 min) |
| Tutor: botón **Explícame** en la Pizarra y en los ejercicios | `t1c/deepseek-math-7b-rl` (DeepSeekMath 7B) | 4,2 GB | ~1 min por explicación |

\* Medido en un portátil Ryzen 7 sin tarjeta gráfica dedicada; con una tarjeta gráfica compatible es mucho más rápido.

- En **Ajustes → Reconocimiento de escritura** eliges quién lee la escritura: **DeepSeek (en este PC)** o **Claude (en la nube)**. Claude es más rápido y preciso con letra difícil, pero necesita Internet y una clave de la API ([console.anthropic.com](https://console.anthropic.com/settings/keys)); se guarda cifrada en el equipo.
- DeepSeek Math solo entiende texto: explica lo que ya leyó la app. La corrección la hace siempre el motor matemático de la app; el tutor puede equivocarse y a veces da el resultado final.
- Ollama queda abierto en la bandeja del sistema y se inicia con Windows. Si está cerrado, la app lo avisa en Ajustes.

### App del móvil (Android)

1. Abre el enlace de descarga del APK desde el navegador del teléfono (o copia el archivo al teléfono por cable USB, Drive, correo…) y ábrelo.
2. Android pedirá permitir la instalación desde esa fuente («Instalar apps desconocidas»): permítelo para la app con la que abriste el archivo.
3. Abre **Pizarra Matemática**.

## Vincular el móvil con el PC

1. El móvil y el PC deben estar en la **misma red Wi-Fi** (no sirven las redes de invitados, que aíslan los dispositivos, ni los datos móviles).
2. En la app de escritorio toca **Conectar móvil** (en **Ajustes**, en la **Pizarra** o en un ejercicio → **A mano**).
3. En el móvil abre **Más → Sincronización** (o, la primera vez, **Vincular con el PC** en la bienvenida) y toca **Escanear código QR**, o escribe la dirección del PC, el puerto y el código de 6 dígitos que muestra el diálogo.

El código se conserva aunque cierres las apps, así que el móvil se reconecta solo cada vez que los dos están abiertos en la misma red. **Cambiar código** en el diálogo del PC desconecta a los móviles (hay que volver a escanear el QR).

## Sincronización del progreso

Desde la versión 0.3.0 la app del móvil es la misma que la de escritorio (temario, lecciones, práctica, repasos, diagnóstico, banco de errores, laboratorio, wiki, pizarra, progreso) y las dos comparten el seguimiento del aprendizaje:

- Se sincroniza todo: dominio de cada tema, desbloqueos, refuerzos, repasos programados, banco de errores, racha, tiempo de estudio, la meta diaria y tu nombre. El tema (claro u oscuro) y el teclado matemático son de cada dispositivo.
- Con los dos conectados, cada cambio aparece al instante en el otro. Sin conexión cada uno funciona igual: lo que hagas en el móvil queda guardado y se envía al PC al reconectarse (el móvil muestra **Sin enviar** y cuántos cambios esperan). El resultado es idéntico en los dos dispositivos, sin importar en cuál se hizo cada ejercicio.
- Al vincular un móvil nuevo, recibe el progreso del PC. Si el PC no tiene progreso, recibe el del móvil. Si los dos ya tienen progreso, el móvil pregunta qué hacer: **combinar** los dos (lo practicado en el móvil se suma al PC), usar el del PC o usar el del móvil.
- **Borrar todo el progreso** en cualquiera de los dos lo borra también en el otro.
- La app del PC y la del móvil deben ser de la misma versión; si no, el móvil avisa que hay que actualizar.

La IA (leer la escritura a mano y el tutor **Explícame**) corre en el PC: en el móvil está disponible mientras está conectado. Sin conexión puedes escribir las respuestas con el teclado matemático.

### El móvil como pizarra del PC

Con el móvil conectado, **Escribir en el PC** (en **Más** o en la **Pizarra**) lo convierte en la pizarra de la app de escritorio:

- Lo que dibujas en el teléfono aparece al instante en la pizarra o en el ejercicio abierto en el PC (solo viajan coordenadas, presión y velocidad; no hay video).
- **Reconocer** convierte lo escrito en fórmulas; en los ejercicios, **Comprobar** corrige la respuesta y el resultado aparece en ambos dispositivos. Al terminar, el móvil ofrece pasar al siguiente ejercicio.
- Si no hay nada abierto en el PC, el móvil ofrece abrir la pizarra o responder el ejercicio actual.
- Gestos: dos dedos = deshacer, tres = rehacer, tachar en zigzag = borrar. El puntero láser señala en el monitor del PC.
- Sin instalar el APK también funciona: escanea el QR con la cámara del teléfono y abre el enlace en el navegador (solo la pizarra, sin el resto de la app).

### Si el móvil no conecta

- Comprueba la dirección: es la que muestra el diálogo **Conectar móvil** (no `localhost`).
- Firewall de Windows: *Panel de control → Firewall de Windows Defender → Permitir una aplicación* y activa **Matemática** en redes privadas. Si la red Wi-Fi está marcada como *pública* en Windows, cámbiala a *privada*.
- Algunos routers aíslan los dispositivos (modo AP / invitados): prueba otra red o el punto de acceso del teléfono.

## Wiki de temas

Una ayuda memoria con una ficha por tema del temario: fórmulas y propiedades, definiciones, tablas,
procedimiento, un ejemplo resuelto, errores frecuentes (incorrecto → correcto), trucos para
recordar y temas relacionados. También muestra los errores que cometiste practicando ese tema.

- **Ctrl K** (o **Buscar en la wiki** en la barra lateral) la abre en un panel al costado de cualquier
  pantalla, sin salir del ejercicio ni de la lección. **Esc** la cierra y vuelves a donde estabas escribiendo.
- En los ejercicios y en las lecciones, el botón **Ficha** abre directamente la del tema; si se detecta
  un error, **Repasar en la wiki** abre la ficha del tema que lo explica.
- La página **Wiki** tiene tres vistas: **Temas**, **Formulario** (todas las fórmulas juntas) y
  **Glosario** (definiciones de la A a la Z).
- El buscador no distingue tildes ni plurales y entiende nombres propios: «bhaskara», «ruffini», «sarrus»…
- **En el móvil**: la misma wiki (la lupa de la barra superior la abre desde cualquier pantalla). Va dentro
  del APK, así que funciona sin conexión y sin el PC. El botón «atrás» de Android vuelve a la ficha anterior
  o cierra la wiki.

## Desarrollo

Requisitos: Node.js 20 o superior. Para el APK: JDK 21 y Android SDK (plataforma 36). El script
del APK los busca en `JAVA_HOME` / `ANDROID_HOME` o en `%LOCALAPPDATA%\Programs\jdk-21*` y
`%LOCALAPPDATA%\Android\Sdk`.

```bash
npm install
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Interfaz en http://localhost:5173 (Vite) + servidor local en el puerto 8787 |
| `npm run dev:companion` | App del móvil en http://localhost:5174/companion.html (para vincularla con `npm run dev`: dirección `localhost`, puerto `5173`) |
| `npm test` | Pruebas (motor matemático, ejercicios, aprendizaje, servidor) |
| `npm run desktop` | Compila y abre la app de escritorio sin instalarla |
| `npm run dist:win` | Genera el instalador `release/Matematica-Setup-<versión>.exe` |
| `npm run apk` | Genera el APK firmado `release/PizarraMatematica-<versión>.apk` |
| `npm start` | Compila la interfaz y la sirve con el servidor local en http://localhost:8787 |
| `npm run icons` | Regenera los iconos (escritorio y Android) |

`index.html` no se puede abrir directamente con doble clic: la interfaz necesita el servidor (usa
`npm run dev`, `npm start` o la app de escritorio).

Los archivos intermedios del instalador y del APK se generan en `%LOCALAPPDATA%\matematica-build`
(fuera de OneDrive, que bloquea los archivos mientras los sincroniza); en `release/` solo quedan los
instaladores finales. Esa carpeta se puede borrar cuando quieras.

La IA local necesita [Ollama](https://ollama.com) con los modelos descargados (desde **Ajustes** o con
`ollama pull deepseek-ocr` y `ollama pull t1c/deepseek-math-7b-rl`). La clave de Claude, si usas
Claude para leer la escritura, también puede ir en `.env` (`ANTHROPIC_API_KEY`, ver `.env.example`);
la que se guarda en **Ajustes** tiene prioridad.

### Firma del APK

La primera vez, `npm run apk` crea `android/matematica-release.jks` y `android/keystore.properties`
(con la contraseña). **Guarda una copia de ambos**: están fuera de git y sin ellos no se pueden
instalar actualizaciones del APK encima de la versión anterior (habría que desinstalarla).

### Estructura

- `src/` interfaz (React), la misma para el PC y el móvil: `math/` motor matemático, `content/` temario, generadores de ejercicios y fichas de la wiki (`content/wiki/`),
  `learning/` motor adaptativo, `sync/` sincronización del progreso entre el PC y el móvil, `canvas/` lienzo y emparejamiento,
  `phone/` lo propio de la app del móvil (conexión con el PC, vinculación), `companion/` pizarra remota, `pages/` pantallas.
- `server/` servidor local: API (OCR, tutor, configuración) y WebSocket de emparejamiento (retransmite la pizarra, la sincronización y los pedidos de IA del móvil).
- `electron/` app de escritorio (arranca el servidor y abre la ventana).
- `android/` proyecto Android (Capacitor) de la app del móvil.
- `scripts/` compilación de Electron, del APK e iconos.
