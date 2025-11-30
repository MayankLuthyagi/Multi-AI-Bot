# **Omni**

Omni is a versatile AI chatbot platform that connects you with multiple AI providers through a clean, modular interface. Built with **Next.js** and **TypeScript**, it offers a seamless experience for managing AI interactions, tracking costs, and analyzing usage statistics.

## **Features**

* **Multi-provider support** – Connect with OpenAI, Anthropic, Google, and more
* **Persistent chat sessions** – Your conversation history stays intact
* **Cost tracking** – Monitor token usage and provider expenses
* **Provider analytics** – View detailed statistics about your AI usage
* **Coin price data** – Access cryptocurrency market information
* **Modular architecture** – Easily extend with new features or providers

## **Tech Stack**

* **Frontend**: Next.js (App Router), TypeScript, React
* **Styling**: PostCSS
* **Database**: MongoDB
* **Tooling**: ESLint

## **Project Structure**

```
src/
├─ app/
│   ├─ api/
│   ├─ dashboard/
│   ├─ profile/
│   └─ stats/
├─ components/
├─ lib/
└─ public/
```

## **Getting Started**

### **Prerequisites**

* Node.js 18+
* npm

### **Installation**

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## **Configuration**

Create a `.env` file based on `.env.example`:

```env
MONGODB_URI=your_mongodb_connection_string
TRAVILY_API_KEY=your_travily_api_key
# Add other provider API keys as needed
```

## **How to Start**

1. **Create your `.env` file**
   Add `MONGODB_URI` and all required provider API keys (OpenAI, Anthropic, Travily, etc.).

2. **Set up the database**
   Ensure a database named `chatbot` exists. MongoDB will auto-create it when data is inserted.

3. **Seed an admin user (optional)**

   ```bash
   MONGODB_URI='your-uri' node scripts/seed-user.js --name "Mayank" --email "mayank@example.com" --password "secret" --db chatbot
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit `http://localhost:3000`.

## **Managing Providers**

1. Go to `/profile`
2. Select a provider
3. Enter the API key and optional credit
4. Save the provider

## **Screenshots**

* **Profile Page**
  ![Profile UI](public/page/profile.png)

* **Dashboard**
  ![Dashboard UI](public/page/dashboard.png)

* **Side Menu**
  ![Side Menu UI](public/page/sidemenu.png)

* **Statistics**
  ![Stats UI](public/page/stats.png)

## **Database Setup**

### **Manual User Creation**

```javascript
db.users.insertOne({
  _id: ObjectId("6908d55037739d6419b388bb"),
  name: "Mayank",
  email: "email@gmail.com",
  username: "email@gmail.com",
  password: "<bcrypt-hash>"
})
```

### **Seeding an Admin User**

#### macOS / Linux / Git Bash

```bash
MONGODB_URI='your-uri' node scripts/seed-user.js --name "Mayank" --email "mayank@example.com" --password "secret" --db chatbot
```

#### PowerShell (Windows)

```powershell
$env:MONGODB_URI = 'your-uri'; node .\scripts\seed-user.js --name "Mayank" --email "mayank@example.com" --password "secret" --db chatbot
```

## **Development Notes**

* API routes are inside `src/app/api/`
* Pages follow Next.js App Router structure
* Provider integrations are modular
* Core logic lives in `lib/`

## **Deployment**

1. Set required environment variables
2. Configure MongoDB
3. Add all provider API keys

## **Removing Test Credentials From Frontend**

If you used test credentials during development, you can remove the visible block before deployment.

1. Open `src/app/page.tsx`.
2. Find the test credentials block:

```tsx
{/* Test credentials + quick-fill */}
<div className="mt-3 text-sm text-gray-400 text-center sm:text-left">
   <div className="mb-2">Test credentials for quick sign in:</div>
   <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 justify-center sm:justify-start">
      <div className="text-xs text-gray-300">Email: <span className="font-mono text-white">admin@example.com</span></div>
      <div className="text-xs text-gray-300">Password: <span className="font-mono text-white">password</span></div>
      <button
         type="button"
         onClick={() => { setEmail("admin@example.com"); setPassword("password"); }}
         className="mt-1 sm:mt-0 px-3 py-2 bg-white text-black rounded-lg font-semibold shadow-sm hover:opacity-90"
      >
         Fill test credentials
      </button>
   </div>
</div>
```

3. Remove or comment out this entire block.

This ensures test credentials are not included in production builds.

Thank you!
