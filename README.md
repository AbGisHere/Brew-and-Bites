# Brew & Bites Café – Interactive Landing Page

A modern, responsive café landing page built with React and Vite. It features a hero, about, menu with category filters, image gallery with lightbox, contact form, and a custom animated coffee-cup loading indicator.

## Features
- Responsive layout (mobile-first)
- Smooth scrolling navigation
- Filterable Menu (Coffee, Breakfast, Lunch, Desserts)
- Gallery with filters and lightbox modal
- Contact form with reservation fields (simulated submit)
- Custom animated Loader (coffee cup with steam)
- TailwindCSS via CDN for rapid styling

## Tech Stack
- React + Vite
- JavaScript (ESM)
- TailwindCSS (CDN)
- React Icons, React Scroll

## Project Structure
```
windsurf-project/
├─ index.html
├─ vite.config.js
├─ package.json
├─ src/
│  ├─ main.jsx
│  ├─ index.css
│  ├─ App.jsx
│  └─ components/
│     ├─ Navbar.jsx
│     ├─ Hero.jsx
│     ├─ About.jsx
│     ├─ Menu.jsx
│     ├─ Gallery.jsx
│     ├─ Contact.jsx
│     ├─ Footer.jsx
│     └─ Loader.jsx
```

## Getting Started
### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Install Dependencies
Run in the project root:
```
npm install
```

This installs:
- react, react-dom, react-icons, react-scroll
- vite, @vitejs/plugin-react

### Development
Start the dev server:
```
npm run dev
```
Then open the Local URL printed in the terminal (e.g. http://localhost:5173).

### Production Build
Create an optimized build:
```
npm run build
```
Preview the build locally:
```
npm run preview
```

## Customization Guide
- Branding: Update the site title and colors in `index.html` Tailwind config and component text.
- Images: Replace Unsplash image URLs in `Hero.jsx`, `About.jsx`, and `Gallery.jsx`.
- Menu Items: Edit the `menuItems` object in `components/Menu.jsx`.
- Contact Info: Edit details in `components/Contact.jsx` and `components/Footer.jsx`.
- Loader: Markup is in `components/Loader.jsx`; styles are appended to `src/index.css` under "Loader styles".

## Deployment
You can deploy the `dist/` folder output to any static host.

- Netlify: Drag-and-drop `dist/` or connect repo and set build command `npm run build`, publish directory `dist`.
- Vercel: Import project, framework auto-detected. Build: `npm run build`. Output: `dist`.
- Static hosting: Serve files from `dist/` via any web server (Nginx/Apache/S3+CloudFront/etc.).

## Troubleshooting
- Blank page when opening index.html directly:
  - Use the dev server. Run `npm run dev` and open the provided URL. JSX/ESM requires Vite.
- Port already in use:
  - Vite prints an alternate port. Or stop the conflicting process, or run `npm run dev -- --port 5174`.
- Module resolution errors:
  - Ensure `npm install` completed. Delete `node_modules` and reinstall if needed.
- Tailwind classes not applying:
  - Tailwind is included via CDN in `index.html`. Ensure you haven’t removed that `<script src="https://cdn.tailwindcss.com"></script>` line.

## Accessibility
- Semantic headings and labels for inputs
- Focus-visible defaults from browser
- Loader has `aria-label="Loading"`

## License
This project is provided as-is for demonstration and can be adapted for your café. Replace images and branding as needed.
