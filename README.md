# Google Maps SERP Tracker

A powerful, local-hosted tool for tracking Google Maps rankings using a grid-based system. This application mimics real user behavior to provide accurate, location-specific ranking data for local SEO optimization.

![GMB Serp Tracker Dashboard](https://github.com/danishfareed/Google-Maps-SERP/assets/placeholder-image)

## 🌟 Features

*   **📍 Grid-Based Tracking**: Visualizes rankings on a map grid (e.g., 3x3, 5x5, 7x7) to show how your business ranks in different specific locations around your city.
*   **🕵️ Real User Mimicry**: Uses advanced browser automation (Playwright) to "spoof" your location and behave like a real human searching on Google Maps. This ensures the data you see is exactly what a local customer sees.
*   **🌍 Geolocation Spoofing**: Automatically sets the browser's GPS coordinates for each point on the grid to get hyper-local results.
*   **📊 Interactive Dashboard**: A clean, modern interface to view your past scans, see average rankings, and track progress over time.
*   **🏠 Local & Private**: All data is stored locally on your machine in a SQLite database. No monthly fees, no data leaks.
*   **🚀 Fast & Modern**: Built with Next.js and Tailwind CSS for a snappy, responsive experience.

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your computer:

1.  **Node.js** (Version 18 or higher): [Download here](https://nodejs.org/)
2.  **Git**: [Download here](https://git-scm.com/)

## 🚀 Installation & Setup

1.  **Clone the Repository** (or download the code):
    ```bash
    git clone https://github.com/danishfareed/Google-Maps-SERP.git
    cd Google-Maps-SERP
    ```

2.  **Install Dependencies**:
    Open your terminal (Command Prompt/Terminal) in the project folder and run:
    ```bash
    npm install
    ```

3.  **Install Browser Engines**:
    This step installs the browsers needed for the automation to work.
    ```bash
    npx playwright install
    ```

4.  **Initialize Database**:
    Set up the local database to store your scan results.
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```

## 📖 How to Use

1.  **Start the Application**:
    Run the following command in your terminal:
    ```bash
    npm run dev
    ```
    Once started, open your web browser and go to: `http://localhost:3000`

2.  **Create a New Scan**:
    *   Click on **"New Scan"** or the **"+"** button on the dashboard.
    *   **Target Keyword**: Enter the search term you want to track (e.g., "coffee shop", "plumber near me").
    *   **Center Location**: Enter the central address or city you want to scan around (e.g., "Chicago, IL").
    *   **Radius**: Choose how far out you want to scan (e.g., 5 km).
    *   **Grid Size**: Select the density of the grid (e.g., 3x3 for a quick scan, 7x7 for detailed coverage).
    *   Click **"Start Grid Scan"**.

3.  **View Results**:
    *   The app will start processing each point on the grid.
    *   As it finishes, you'll see the results populate in real-time.
    *   Click on any completed scan in the dashboard to view the full grid map and ranking details.

## ❓ FAQ

**Q: Why does it take time to complete a scan?**
A: To mimic a real user and avoid getting blocked by Google, the tool intentionally adds small delays between searches and interacts with the page (scrolling, etc.). This ensures the data is accurate and safe to collect.

**Q: Where is my data stored?**
A: Everything is stored in a file named `dev.db` inside the project folder. You own your data completely.

**Q: Can I run this on a server?**
A: Yes, but it requires a graphical environment or configuring Playwright to run in "headless" mode (which is the default) with proper proxy support if running many scans.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
