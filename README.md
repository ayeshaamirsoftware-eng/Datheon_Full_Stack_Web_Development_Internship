# Ayesha Amir - Developer Portfolio

A responsive personal portfolio with a warm ivory and burgundy identity, a burgundy-and-champagne dark-mode hero, and interactive previews of LifeOS, StudyCore, and Dialex.

**Portfolio address:** https://ayesha-portfolio-3d.vercel.app/  
The files in this package must be deployed to update that address; this README does not certify which version is currently live.

## Features

- About, technical expertise, featured projects, contact links, and downloadable resume.
- Light/dark themes saved in the browser; the original light appearance is the default.
- Mobile navigation with keyboard support, Escape dismissal, and visible navigation when JavaScript is unavailable.
- Skippable animated introduction, motion toggle, and operating-system reduced-motion support.
- Three.js skills sculpture and a phone viewer with keyboard rotation and zoom.
- LifeOS preview: session-only journaling, goal tracking, and a weighted decision example.
- StudyCore preview: source-linked sample answers, eight flashcards, and a five-question quiz from bundled notes.
- Dialex preview: phone finishes, storage selection, shipping, and coupon calculations using a bundled catalogue.
- Lazy-loaded case studies, recoverable loading errors, optimized WebP images, and social sharing metadata.

## Stack

Semantic HTML5, CSS Grid/Flexbox and media queries, JavaScript ES modules, and locally bundled Three.js r186. No framework, backend, package installation, API key, or build step is required for this portfolio.

Technology labels inside the case studies describe the separate applications. Their backend services are not included in this repository.

## Run locally

Use a local web server because module imports and bundled-note requests will not work reliably from a file:// URL.

With Python 3 installed, open a terminal in the folder containing index.html:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/. On Windows, `py -m http.server 8000 --bind 127.0.0.1` is an alternative if Python is installed through the Python launcher. VS Code Live Server is also suitable. Stop the server with Ctrl+C.

## Project structure

```text
index.html                 Page content, metadata, navigation and dialogs
studio.css                 Core portfolio layout and component styles
case-studies.css           Case-study and demo styles
refinements.css            Existing presentation refinements
handwritten-opening.css    Introduction and original visual accents
theme.css / theme.js        Saved light/dark themes and palette overrides
enhancements.css           Mobile menu, loading messages and overflow containment
navigation.js              Accessible mobile navigation
studio.js                  Motion, reveals, project dialogs and loading recovery
handwritten-intro.js        Skippable introduction
scene.js                   Three.js skills sculpture
experience.js              Case-study examples and lazy phone initialization
demo-workspaces.js         Tabs, journaling, goals, flashcards and quizzes
assets/
  ayesha-cv.pdf             Current resume
  ayesha-soft-smile.webp    Optimized displayed portrait
  social-preview.jpg       Sharing image
  fonts/                   Self-hosted fonts and licenses
  dialex/                  Catalogue, price calculator, phone artwork and viewer
    vendor/                Three.js modules, rounded geometry and license
  motion-and-forces.md      Original bundled StudyCore sample
```

## Privacy and demo limits

- Journal entries, goals and quiz answers stay in memory and reset when the page reloads.
- Theme and motion preferences use localStorage when the browser permits it. The site still works if storage is blocked.
- StudyCore's portfolio preview uses deterministic local text rules; it does not call an AI model or the separate live service.
- Dialex is fictional. Preview pricing runs locally, makes no purchase, and is not a production checkout.
- Contact opens the visitor's email app. This portfolio does not send contact messages to a backend.
- External live demos and source links open separate sites with their own availability and privacy policies.

## Updating content

Replace assets/ayesha-cv.pdf to update the resume without changing its links. Keep filenames case-correct. Edit index.html for project descriptions and links. Keep third-party license files with the bundled assets.

The PNG originals remain in assets for reference; the portfolio loads the smaller WebP versions. Font files retain their existing names and have font-display: swap.

## Deployment

Serve this folder as a static site. Keep all paths and assets together.

For the existing Vercel project, upload/push these files through its connected source repository or the Vercel deployment workflow. For a new import, use a static/Other framework preset with no build command and the directory containing index.html as the output root. Confirm settings against the current Vercel interface before publishing.

For GitHub Pages, publish the branch root if these files are at the repository root. If the portfolio is in a task subfolder, use an appropriate Pages workflow or a dedicated static-hosting project pointed at that subfolder. Do not assume Pages can select an arbitrary task folder through its simple branch settings.

Before hosting at a different domain or subpath, update the canonical URL, og:url, og:image and twitter:image in index.html, plus robots.txt and sitemap.xml.

References: [Vercel deployment documentation](https://vercel.com/docs/deployments) and [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Datheon Task 1

Includes the required portfolio content, responsive Grid/Flexbox layouts, a dark/light toggle, smooth scrolling with reduced-motion exceptions, project dialogs, mobile menu and this README.

Final submission still requires a public source repository and a verified live deployment. Datheon requests the submission repository name Datheon_Full_Stack_Web_Development_Internship and multiple completed internship tasks; this repository content covers the portfolio task only.

## Credits

- Portfolio and original demonstration content: Ayesha Amir.
- Three.js: MIT license; see assets/dialex/vendor/LICENSE-three.txt. RoundedBoxGeometry retains its upstream header.
- Barlow Condensed, DM Sans and Playfair Display: license texts are included in assets/fonts/.
- Retain attribution for every font or library redistributed with the project. The bundled greeting-script font has no separate license file in this archive; verify its original license before redistributing it in a public repository.

No repository-wide open-source license is asserted for Ayesha's original content, photographs or resume.
