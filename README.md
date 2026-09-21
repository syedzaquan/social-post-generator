# StudioPost — Mobile-First Social Post Generator

A sleek, mobile-first creative studio website to design high-impact social media posts with Google's **Fraunces** variable typography, custom gradients, brand logos, touch handles, and crystal-clear PNG export.

Designed to be hosted for free on **GitHub Pages** with zero build configuration!

---

## ✨ Features

- 📱 **Mobile-First & Touch-Friendly**: Designed for thumbs first, with full desktop/tablet responsive layout.
- 📐 **Multiple Formats**:
  - `1:1` Square (Instagram Post)
  - `9:16` Story / Reel / TikTok
  - `4:5` Portrait (High-engagement IG Feed)
  - `16:9` Banner (Twitter/X, LinkedIn, YouTube Thumbnail)
- ✍️ **Fraunces Google Font**:
  - Variable font with optical size (`opsz`) and weights from 200 (Light) to 900 (Black).
  - Resizable via direct-on-canvas touch corner handles or precision font size slider.
  - Multi-line text wrapping, alignment (left/center/right), line height, italic toggle, text glow/shadow, and badge pill highlights.
  - Add multiple text layers.
- 🏷️ **Brand Logo Layer**:
  - Upload custom PNG/SVG logo with transparency.
  - Touch-drag to position, drag corner handles to resize, or adjust size, corner roundness, and opacity sliders.
  - Quick-align corner presets (Top-Left, Top-Right, Bottom-Left, Bottom-Right).
- 🌈 **Gradient Overlay Layer**:
  - Readability presets (Bottom Shadow, Sunset Glow, Cyber Neon, Emerald Luxury, Warm Noir, Vignette).
  - Angle slider (0°–360°), opacity slider, and blend mode toggles (`normal`, `soft-light`, `multiply`, `overlay`, `screen`).
  - Custom color & alpha pickers.
- 🖼️ **Background Image**:
  - Upload your own image or choose from curated vector themes.
  - Live adjustment controls for brightness, contrast, and atmospheric blur.
- 💾 **High-Resolution PNG Export**:
  - Native Retina / 2x rendering pipeline with pre-verified font rasterization (`document.fonts.ready`) to ensure zero font shift on export.

---

## 🚀 How to Host on GitHub Pages (100% Free)

Because StudioPost is built with modern, native HTML5, CSS3, and JavaScript ES modules, **no build step or Node.js server is required**. You can publish it directly from your GitHub repository:

1. **Push this code to your GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: StudioPost mobile social post generator"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click on **Settings** (tab at the top).
   - In the left sidebar, click on **Pages**.
   - Under **Build and deployment** → **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`.
   - Click **Save**.

3. **Done!**
   - GitHub will provide you with a live URL (e.g. `https://your-username.github.io/your-repository/`) in ~1 minute.

---

## 🛠️ Local Testing

To test locally on your computer:

```bash
# Using Python:
python3 -m http.server 3000

# Or using Node:
npx serve .
```

Open `http://localhost:3000` in your mobile browser or desktop browser (toggle Device Mode in DevTools for the mobile phone experience).
