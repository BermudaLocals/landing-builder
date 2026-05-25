# LaunchPad - Superior Landing Page Builder

A landing page builder that's **better than landingsite.ai** with more features and capabilities.

## 🚀 Features

✅ **Better than landingsite.ai:**
- Full drag-and-drop builder (landingsite.ai has basic editing)
- Component library with 7+ component types
- Template gallery with professional designs
- Real-time preview and editing
- One-click publishing to live URLs
- Custom domain support (landingsite.ai only gives subdomains)
- Code export (HTML/CSS/JS)
- SEO optimization built-in

✅ **Additional Superior Features:**
- Authentication with Clerk (Google SSO + email/password)
- Database persistence with Prisma
- Component properties panel
- Style customization (colors, padding, etc.)
- Responsive design preview
- Publishing to multiple platforms
- Export clean, production-ready code

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **UI:** Tailwind CSS, Radix UI
- **Auth:** Clerk (better than landingsite.ai's basic auth)
- **Database:** PostgreSQL with Prisma
- **Drag & Drop:** react-dnd
- **Deployment:** Vercel (or any platform)

## 🚀 Quick Start

1. Clone and install:
```bash
git clone <repo>
cd landing-builder
npm install
```

2. Set up environment:
```bash
cp .env.example .env.local
# Add your Clerk keys and database URL
```

3. Set up database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Option 1: Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Option 2: Railway
```bash
# Connect GitHub repo to Railway
# Add environment variables
# Deploy automatically
```

## 🎯 Comparison with landingsite.ai

| Feature | LaunchPad (Ours) | landingsite.ai |
|---------|------------------|----------------|
| Drag & Drop | ✅ Full visual builder | ⚠️ Basic editing |
| Templates | ✅ Professional gallery | ❌ Limited |
| Code Export | ✅ Clean HTML/CSS/JS | ❌ Locked platform |
| Publishing | ✅ One-click live URLs | ✅ Basic publishing |
| Custom Domains | ✅ Full support | ❌ Subdomains only |
| Authentication | ✅ Clerk (Google SSO) | ✅ Basic auth |
| Database | ✅ PostgreSQL | ❌ Basic storage |
| Component Library | ✅ 7+ types | ⚠️ Limited |
| Style Customization | ✅ Full control | ⚠️ Basic |
| Responsive Preview | ✅ Mobile/Desktop | ❌ Not shown |
| Export Code | ✅ Download files | ❌ Not available |

## 📈 How It's Better

1. **Superior UX:** Full drag-and-drop vs basic text editing
2. **More Templates:** Professional designs vs limited options
3. **Code Ownership:** Export vs locked platform
4. **Better Deployment:** Multiple platforms vs single vendor
5. **Modern Stack:** Next.js 14 vs older tech
6. **Extensible:** Open source vs closed platform

## 🔧 API Routes

- `POST /api/publish` - Publish landing page
- Returns: `{ url: "https://slug.launchpad-demo.com" }`

## 📄 License

MIT - Free to use and modify

## 💬 Support

Open an issue on GitHub or contact for commercial support.
