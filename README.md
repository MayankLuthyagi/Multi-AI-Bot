# Omni

Omni is a multi-provider AI chatbot platform built with **Next.js** and **TypeScript**. It offers a modular backend with API routes and a React-based frontend for interacting with multiple AI providers, managing chat sessions, tracking token usage & costs, viewing provider statistics, and fetching coin prices/history.

## ⭐ Features

* **Multi-provider chat integration** via extensible provider adapters
* **User authentication** and session management
* **Persistent chat sessions** with message history
* **Token usage** calculation and cost tracking
* **Provider statistics** and admin tooling
* **Coin price + historical data** APIs
* Clean modular architecture — easy to extend

---

## 🛠 Tech Stack

* **Next.js (App Router)**
* **TypeScript**
* **PostCSS**
* **ESLint**
* **MongoDB** (for user/sessions storage)

---

## 📁 Project Structure

```
src/
 ├─ app/                   # Next.js app routes (App Router)
 │   ├─ api/               # Backend API: chat, chat-sessions, coins, providers, stats, token-usage, modals, auth
 │   ├─ dashboard/         # Dashboard UI
 │   ├─ profile/           # User profile
 │   └─ stats/             # Provider & usage stats UI
 │
 ├─ components/            # Reusable components (LoginModal, Navbar, SideMenu, etc.)
 ├─ lib/                   # Utilities (DB helpers, models, session utils, token counter)
 └─ public/                # Static assets (logo, images)
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js 18+**
* npm

### Install & Run

```bash
npm install
npm run dev
```

Open: **[http://localhost:3000](http://localhost:3000)**

---

## 🔧 Environment Variables

After running `npm install`, create a `.env` file (optionally copy from `.env.example`) and include:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/your-db-name
TRAVILY_API_KEY=your_travily_api_key_here
# Add any other provider API keys
```

---
## 🔐 Adding API keys via the web UI (/profile)

You can add or update provider API keys directly from the running app instead of putting every provider key into your `.env`.

Steps:

1. Start the app and sign in:

```powershell
npm install
npm run dev
```

2. Open `http://localhost:3000/profile`.
3. On the **Providers** tab choose a provider from the dropdown, paste your provider API key into the **API Key** field, and optionally set an initial credit amount.
4. Click **Save Provider**. The API key is stored server-side and is not exposed to the browser.

To update an existing provider's key or model pricing, click the **Edit** button for that provider and use the **Update API Key** field in the modal (leave blank to keep the existing key).

Supported providers (available in the profile UI):

- `OpenAI`
- `Anthropic`
- `Google`
- `DeepSeek`
- `Perplexity AI`
- `xAI`
- `Zhipu AI`
- `Mistral AI`
- `Moonshot AI`

Note: Some integrations or helper services may still require environment variables (for example, `TRAVILY_API_KEY` in `.env`). Check the API route or provider docs if an env var is explicitly required.

---

## 🧠 Provider Modals (model entries)

When you save a provider from the `/profile` UI, the app will automatically create a set of "modals" (model entries) for that provider based on the provider templates defined in the code (`src/lib/models/Modal.ts`). Each modal represents a specific model offered by the provider (for example `gpt-5-mini` or `claude-opus-4.5`) and includes pricing metadata used for cost tracking.

What you can do with modals in the Profile UI:

- After adding a provider the app creates modal entries for each available model.
- Use the **Edit** button on a provider card to update model pricing or change the provider's API key.
- Use **Sync models** to refresh the modal list for a provider (calls the `/api/modals/sync` endpoint).
- Deleting a provider will also delete its modal entries.

If you need to inspect or adjust modal data directly, see the modal collection name (`modals`) and the `Modal` interface in `src/lib/models/Modal.ts`.

---

## 🖼️ Screenshots (Profile UI)

Here are example screenshots of the Profile page showing how to add providers and edit provider settings. These are placeholder images — replace them with real screenshots in `public/screenshots/` if you prefer.

![Profile — Providers tab](/screenshots/profile-1.svg)

![Profile — Edit Provider modal](/screenshots/profile-2.svg)


## 👤 Adding a Test User (Manual Seed)

The app uses **MongoDB** for user management.

1. Open **MongoDB Compass**, **mongosh**, or any MongoDB client.
2. Insert a user document with a **bcrypt hashed password**:

```js
db.users.insertOne({
  _id: ObjectId("6908d55037739d6419b388bb"),
  name: "Mayank",
  email: "email@gmail.com",
  username: "email@gmail.com",
  password: "<bcrypt-hash>"
})
```

### Generate a bcrypt hash

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('your-password-here', 10, (e,h)=>console.log(h));"
```

Copy the output into the `password` field.

> Note: If your project uses a different collection name, verify in `src/lib/models` or `src/lib/db.ts`.

---

## ⚙️ Automated seed script

There is a small helper script that creates (or updates) a user programmatically and hashes the password for you:

`scripts/seed-user.js`

Install required packages if you don't have them already:

```powershell
npm install bcryptjs mongodb dotenv
```

Run the script (PowerShell example):

```powershell
# basic
node scripts/seed-user.js --name "Mayank" --email "mayankluthyagico@gmail.com" --password "your-password-here"

# specify an _id and DB name (optional)
node scripts/seed-user.js --name "Mayank" --email "mayankluthyagico@gmail.com" --password "your-password-here" --id 6908d55037739d6419b388bb --db your-db-name
```

The script reads `MONGODB_URI` from your environment or `.env` and will insert the user into the `users` collection. If a user with the same email or username already exists the script updates the stored password instead of inserting a duplicate.

---

## 🧩 Development Notes

* Modular API routes live in: `src/app/api/`
* Frontend pages follow the app-router structure (`layout.tsx`, `page.tsx`)
* Models & helpers are in `src/lib/`
* Providers are designed to be easily extendable

---

## 🌐 Deployment

Deploy on **Vercel** or any Node.js-friendly platform.
Ensure you set required environment variables:

* MongoDB URI
* Provider API keys
* Any custom service secrets

---

## 🤝 Contributing

Contributions are welcome!
Submit issues or PRs for:

* Bug fixes
* New provider integrations
* Performance improvements
* UI/UX enhancements

Please keep PRs focused and include tests when meaningful.

---

## 📜 License

This project currently does **not** include a license.
Add a `LICENSE` file if you want to open-source it.

---