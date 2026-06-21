# Jeopardy! — Family Trivia Night

A fully client-side Jeopardy game. No server, no build step — just open `index.html` in a browser.

---

## Running Locally

Double-click `index.html`, or serve the folder with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Deploying to GitHub Pages

1. Create a new GitHub repository.
2. Push the three files (`index.html`, `styles.css`, `app.js`) to the `main` branch.
3. Go to **Settings → Pages → Source**: select `main` branch, root (`/`).
4. Your game will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## How to Write Questions (for the question writer)

### 1. Download the template

On the home screen, click **Download Template**. This generates `jeopardy-template.xlsx` — open it in Excel, Google Sheets, or Numbers.

### 2. Fill in the four sheets

**`Instructions`** — Read this first! A full guide is included in the file.

**`Single Jeopardy`** and **`Double Jeopardy`**

Each sheet has 30 data rows (6 categories × 5 clues). The columns are:

| Column | What to fill in |
|--------|----------------|
| Category | The category name. Write it on the **first** of each 5-row block. You may repeat it on all 5 rows or leave rows 2–5 blank — both work. |
| Value | **Pre-filled — do not change.** (Single: $200–$1,000; Double: $400–$2,000) |
| Clue | Your clue text. Keep it short; it appears in large type on the TV. |
| Answer | The correct answer. |
| Daily Double? | Type exactly `DAILY DOUBLE` on any clue you want as a Daily Double. Recommended: **1 in Single**, **2 in Double**. Leave all others blank. |

**`Final Jeopardy`**

Fill in three rows: **Category**, **Clue**, and **Answer**.

### 3. Upload

Save the file as `.xlsx`. On the game's home screen, click **Load Questions** and pick your file. Any problems with the file are described precisely (e.g., `Single Jeopardy → "Movies" $600: Clue is blank`).

---

## How to Play

1. **Home screen** — load questions (or try the built-in sample game), add player names, and click **Start Game**.
2. **Single Jeopardy** — a player nominates a category and dollar value. Click the cell; the host reads the clue aloud. Click **Reveal Answer**, then mark each player **✓** (correct) or **✗** (wrong). Marks are toggleable — click again to undo. Scores update live. Click **Close** to return to the board.
3. **Daily Double** — the overlay flashes, then asks which player found it and how much they wager. Wager constraints: minimum $5, maximum = the greater of that player's score or the round's top value.
4. **Double Jeopardy** — click **Next Round →** in the scoreboard to advance. Same rules, doubled values.
5. **Final Jeopardy** — advance again. The flow walks through: category reveal → wager collection → clue reveal → answer reveal → marking → final standings.
6. **Scoreboard adjustments** — the host can manually fix any player's score at any time using the **−  200  +** controls in the scoreboard strip.

---

## Password Gate

The site uses **PBKDF2-SHA-256** (via the browser's built-in Web Crypto API) to protect access. The password is hashed with a random salt and 200,000 iterations — it cannot be reversed from the source code, and brute-forcing it is computationally expensive.

### First-time setup

1. Deploy with `SITE_PASS_SALT` and `SITE_PASS_HASH` both empty (the default in `app.js`).
2. Visit the live site — you'll see a **Host Setup** form instead of the login screen.
3. Enter your desired password, click **Generate Hash**.
4. Copy the two output lines and paste them into `app.js`, replacing the empty strings:
   ```js
   const SITE_PASS_SALT = 'paste-here';
   const SITE_PASS_HASH = 'paste-here';
   ```
5. Push the updated `app.js` to GitHub. The password gate is now active.

### Changing the password

On the live site, click **⚙ Host: change password** (small link below the login box) to open the generator and repeat steps 3–5 above.

### Security model

- The password itself is never stored anywhere — only the PBKDF2-derived hash.
- Someone who downloads your `app.js` sees only a base64-encoded hash and salt. Cracking it requires running 200,000 PBKDF2 iterations per guess, which is deliberately slow.
- This is client-side security: a sufficiently motivated attacker with access to your source can brute-force a weak password. **Use a strong password** (12+ characters, mix of letters/numbers) and it becomes impractical to crack.
- For maximum protection, keep the GitHub repository **private** (requires a paid GitHub plan for Pages, or use Cloudflare Pages on a private repo for free).

---

## Files

```
index.html   — page structure
styles.css   — Jeopardy visual design
app.js       — all game logic (no dependencies except SheetJS via CDN)
```

Game progress and scores are saved to `localStorage` automatically. Refreshing the page offers a **Resume Game** option.
