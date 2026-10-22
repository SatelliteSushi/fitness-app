# Fitness PWA

A futuristic, minimalist fitness tracking PWA with JARVIS-inspired HUD design.

## Features

- 🎨 **Dark, minimalist UI** with cyan accents and subtle glows
- 📱 **Mobile-first design** with iPhone safe area support
- 🔄 **Auto-updating PWA** with service worker
- 📊 **Tab-based navigation** (Diet, Workouts, Schedule)
- ⚙️ **Options panel** with slide-up sheet
- 🖥️ **Responsive design** for desktop and mobile

## Design System

Built with reusable design tokens:
- **Colors**: Dark gradients, cyan accents
- **Typography**: SF Pro Display, clean spacing
- **Components**: Card system, tab bar, panels

## Development

### Local Development

Simply open `index.html` in a browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

### Preview Deployments

Every pull request automatically gets its own preview deployment:

- **Preview URL format**: `https://satellitesushi.github.io/fitness-app/preview/pr-<number>/`
- **Auto-updates**: New commits to the PR automatically update the preview
- **Auto-cleanup**: Preview is removed when the PR is closed/merged

#### How PR Previews Work

1. **Trigger**: When a PR is opened or updated
2. **Deploy**: GitHub Actions deploys the branch to `gh-pages/preview/pr-<number>/`
3. **Comment**: Bot comments on the PR with the preview URL
4. **Cleanup**: When PR closes, the preview directory is automatically removed

#### Manual Preview Testing

To test preview functionality locally before pushing:

```bash
# Create a test branch
git checkout -b test/preview-feature

# Make changes, commit, push
git push -u origin test/preview-feature

# Open a PR on GitHub
# Preview will be available at: https://satellitesushi.github.io/fitness-app/preview/pr-<number>/
```

### Production Deployment

Pushes to `main` automatically deploy to production:

- **Live URL**: `https://satellitesushi.github.io/fitness-app/`
- **Workflow**: `.github/workflows/deploy.yml`
- **Auto-updates**: Service worker checks for updates on load and visibility change

## Workflows

### Main Deployment (`.github/workflows/deploy.yml`)
- Triggers on push to `main`
- Deploys to root of `gh-pages` branch
- Updates build timestamp in HTML

### PR Preview (`.github/workflows/deploy-preview.yml`)
- Triggers on PR open/update to `main`
- Deploys to `gh-pages/preview/pr-<number>/`
- Comments preview URL on PR
- Updates existing comment on subsequent pushes

### Preview Cleanup (`.github/workflows/cleanup-preview.yml`)
- Triggers when PR is closed
- Removes preview directory from `gh-pages`
- Comments cleanup confirmation on PR

## Architecture

- **Client-side routing**: Hash-based routing (`#diet`, `#workouts`, `#schedule`)
- **No build step**: Pure HTML/CSS/JS
- **Service Worker**: Network-first strategy with auto-reload on update
- **PWA Manifest**: Configured for iOS and Android installation

## Design Language

**Inspiration**: JARVIS/Iron Man HUD, kept minimalist and restrained

- **Background**: Near-black to deep navy gradient
- **Cards**: Translucent with thin cyan borders and subtle glow
- **Typography**: Clean, generous spacing, subtle accents only
- **Icons**: HUD-style with targeting reticles
- **Status bar**: Dark translucent on iOS
