# VaultSight Analyzer

A password strength analyzer combining a **React + TypeScript frontend** with a **Flask Python backend**. Built as a capstone cybersecurity project.

## Live Demo
> Deploy the `frontend/` folder to GitHub Pages for a live link. Visitors need nothing installed — it runs in any browser.

## Features
- **0–100 strength score** with Shannon entropy, leet detection, n-gram similarity, and dictionary checks
- **Four tabs:** Analyzer · Feedback · Education · Safety
- **Breach check** via Have I Been Pwned (k-anonymity — real password never transmitted)
- **Salted SHA-256 demo** showing raw input vs hashed output side-by-side
- **Password generator** (random 20-char or 4-word passphrase)
- **Policy checker** with toggleable requirements
- **Export report** as .txt (with or without password)
- **Zero-persistence policy** — password cleared immediately after analysis

## Security Design
- Password analyzed on local Flask server (never the internet for scoring)
- Variable set to `null` after use, input field cleared
- No `console.log` of password values anywhere
- History stores only masked versions (first 2 + last 2 chars), auto-clears after 60 seconds
- Breach check sends only 5 SHA-1 hex chars — real password stays in browser
- No localStorage, sessionStorage, cookies, or database writes

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Python 3 + Flask + flask-cors |
| Crypto | Web Crypto API (browser) |
| Breach check | Have I Been Pwned API (k-anonymity) |

## Running Locally

### Requirements
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Flask backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Flask runs on http://localhost:5000

### 2. Start the React frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

### Note for visitors
**Visitors to the live GitHub Pages link do not need to install anything.**
Node.js and Python are only needed if you want to run or modify the project locally.

## Project Structure
```
vaultsight/
  backend/
    app.py                  Flask API server
    password_analyzer.py    Core analysis logic (Python)
    requirements.txt        Flask + flask-cors
    dictionaries/
      common_passwords.txt  60+ common passwords
      names.txt             100+ culturally diverse names
      fictional_names.txt   90+ fictional characters
  frontend/
    src/
      components/
        AnalyzerTab.tsx     Main analyzer UI
        FeedbackTab.tsx     Personalized feedback
        EducationTab.tsx    Two-column education content
        SafetyTab.tsx       Privacy policy with auditable code
      lib/
        api.ts              Backend client + breach check + generators
      hooks/
        useLocalHistory.ts  Zero-persistence masked history
      App.tsx               Tab routing
      types.ts              TypeScript interfaces
    index.html
    vite.config.ts
    tailwind.config.js
    package.json
```

## Concepts Covered
Cybersecurity · Shannon entropy · Dictionary attacks · Rainbow table attacks · Salting & hashing · k-Anonymity · Zero-persistence · Leet speak normalization · N-gram similarity · Keyboard pattern detection · Shoulder surfing · Multi-factor authentication · Data breaches · Credential stuffing

## Academic Context
Built for a STEM capstone. Covers concepts from Security+, cryptography, information theory, and software engineering.

## Development Notes
This project was developed with AI assistance (GitHub Copilot and Claude) for code generation, debugging, and architecture decisions. All concepts, security design choices, and final implementation were reviewed, understood, and directed by the developers.

## Note for Visitors
Visitors to the live GitHub Pages link do not need to install anything — the frontend runs entirely in your browser. Node.js and Python are only needed if you want to run or modify the project locally.
