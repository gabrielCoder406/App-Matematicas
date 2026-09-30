// Genera los iconos de la app de escritorio y de la app Android a partir del logotipo (∑).
// Uso: npm run icons   (se ejecuta con Electron para dibujar con un canvas real)
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

// Se ejecuta dentro de la página: dibuja un icono o una pantalla de inicio y devuelve un PNG (data URL).
function draw(w, h, o) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (o.background) {
    g.fillStyle = o.background;
    g.fillRect(0, 0, w, h);
  }
  const size = o.logo * Math.min(w, h);
  const x = (w - size) / 2;
  const y = (h - size) / 2;
  if (o.shape !== 'none') {
    const grad = g.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, '#5048e5');
    grad.addColorStop(1, '#a55cf0');
    g.fillStyle = grad;
    g.beginPath();
    if (o.shape === 'circle') g.arc(w / 2, h / 2, size / 2, 0, Math.PI * 2);
    else g.roundRect(x, y, size, size, size * 0.23);
    g.fill();
  }
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `${Math.round(size * o.glyph)}px Georgia, "Times New Roman", serif`;
  const m = g.measureText('∑');
  g.fillText('∑', w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  return c.toDataURL('image/png');
}

async function render(win, file, w, h, opts) {
  const url = await win.webContents.executeJavaScript(`(${draw.toString()})(${w}, ${h}, ${JSON.stringify(opts)})`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
}

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH = {
  'drawable': [480, 320],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 200, height: 200 });
  await win.loadURL('data:text/html;charset=utf-8,<html><body></body></html>');
  const icon = { shape: 'rounded', logo: 1, glyph: 0.66 };

  // Escritorio (electron-builder lo convierte a .ico)
  await render(win, path.join(ROOT, 'build', 'icon.png'), 1024, 1024, icon);

  if (fs.existsSync(RES)) {
    for (const [d, k] of Object.entries(DENSITIES)) {
      const s = Math.round(48 * k);
      await render(win, path.join(RES, `mipmap-${d}`, 'ic_launcher.png'), s, s, { ...icon, logo: 0.92 });
      await render(win, path.join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), s, s, { shape: 'circle', logo: 0.92, glyph: 0.6 });
      // Icono adaptable: solo el símbolo, dentro de la zona segura (el fondo es un degradado vectorial).
      const f = Math.round(108 * k);
      await render(win, path.join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), f, f, { shape: 'none', logo: 0.62, glyph: 0.7 });
    }
    for (const [dir, [w, h]] of Object.entries(SPLASH)) {
      await render(win, path.join(RES, dir, 'splash.png'), w, h, { background: '#0e1016', shape: 'rounded', logo: 0.3, glyph: 0.66 });
    }
  }
  console.log('Iconos generados');
  app.quit();
});
