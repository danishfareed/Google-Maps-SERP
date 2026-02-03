# 📍 GeoRanker - Local SEO Intelligence Grid

**GeoRanker** is an enterprise-grade, local-hosted tool for tracking Google Maps (GMB) rankings using a hyper-local grid system. It mimics real user behavior to provide 100% accurate, location-specific ranking data for SEO professionals and business owners.

![GeoRanker Dashboard](https://github.com/danishfareed/Google-Maps-SERP/blob/main/public/preview.png?raw=true)

---

## 🌟 Key Features

### 🎯 Precision Tracking
- **Grid-Based Analysis**: Map out rankings (3x3 to 13x13) to see exactly where you dominate and where you disappear.
- **Business Identity Integration**: Auto-populate your business details via search or import via Google Maps URL for pinpoint accuracy.
- **Service Area & Location Support**: Optimized for both physical storefronts and service-area businesses (SABs).

### 🌍 Global Localization
- **Coordinate-Aware Personas**: Automatically adapts browser locale and timezone (e.g., `en-AU` with `Australia/Sydney` timezone) based on the scan target.
- **Forced English Extractions**: Uses `hl=en` globally to ensure consistent data processing regardless of the country being scanned.

### 🛡️ Enterprise Robustness
- **Smart Proxy Management**: Auto-configure proxy pools with intelligent fail-overs.
- **Blacklist Logic**: Faulty proxies are automatically marked as `DEAD` and the system falls back to direct connection to finish the scan.
- **Detailed Telemetry**: Real-time system logs and diagnostic console in Settings for full transparency.

### 📊 Advanced Al-Insights
- **Threat Identification**: Automatically identifies the primary competitor stealing your market share.
- **Geo-Health Analysis**: Detailed reporting on ranking stability and geographic gaps.

---

## 📝 Latest Updates & Known Issues

### Recent Fixes
- **Unified Profile Scores**: Profile completeness now uses a standardized 0-100% scale.
- **Improved Address Fetching**: Enhanced extraction logic to capture physical addresses more reliably.
- **SAB Detection**: Refined logic to prevent storefronts from being incorrectly flagged as Service Area Businesses.
- **Strategic Analysis**: The Intelligence tab now correctly displays market dominance and competitor threats.

### Known Issues
- **Business Card Addresses**: Addresses inside the individual business cards may still not reflect properly in some views. This will be resolved in a later release. The underlying data extraction is functioning correctly.

---

## 🚀 One-Click Installation

### macOS

```bash
# Clone the repository
git clone https://github.com/danishfareed/Google-Maps-SERP.git
cd Google-Maps-SERP

# Run the installer
./install_mac.sh
```

### Windows

```powershell
# Clone the repository
git clone https://github.com/danishfareed/Google-Maps-SERP.git
cd Google-Maps-SERP

# Run the installer (double-click or run in terminal)
install_windows.bat
```

### After Installation

To start GeoRanker after installation:
- **macOS**: Run `./start.sh`
- **Windows**: Double-click `start.bat`

Then open **http://localhost:3000** in your browser.

### Prerequisites
- **Node.js v18+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)

---

## 📖 Getting Started

1.  **Launch the App**:
    ```bash
    npm run dev
    ```
2.  **Access the Dashboard**: Open `http://localhost:3000`
3.  **Run Your First Scan**:
    - Select **New Ranking Report**.
    - Switch to **My Business** mode.
    - Paste your Google Maps URL or search for your name.
    - Configure your grid and click **Run Scan**.

---

## 🛠️ Diagnostics & Logs
If you encounter issues with proxies or scan failures, visit **Settings > Telemetry** to view real-time logs and debug information.

---

## 🏠 Private & Local
GeoRanker runs entirely on your machine. All scan data, proxy settings, and logs are stored in a local SQLite database (`dev.db`). No external APIs see your keywords or rankings except for the direct extraction from Google Maps.

---

## 🤝 Contributing
Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

**Author:** [Danish Fareed](https://github.com/danishfareed)
**Powered By:** [vdesignu.com](https://vdesignu.com)
