# ResumeCraft

A responsive resume builder with:
- Live preview as you type
- Modern, Classic, Minimal, Executive, Sidebar, Two-column, Peach, Editorial, and Professional templates
- Accent color customization
- Add/remove education, experience, and project entries
- Print-to-PDF export
- Browser-local autosave
- Small Node.js + Express backend

## Requirements

- Node.js 18 or newer
- VS Code (recommended)

## Run locally

1. Extract this project folder.
2. Open the `resumecraft` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Open http://localhost:3000 in your browser.

Check the backend with http://localhost:3000/api/health. It should return JSON with `"status":"ok"`.

## Use the website

- Edit the form fields on the left; the preview updates automatically.
- Choose a template and accent color under Customize design.
- All templates use ATS-readable Arial typography: 22 pt name, 11 pt section headings, 10 pt body text, and 9 pt contact/date text. Choose **Professional** for the plain, single-column layout; multi-column designs may be less reliable with some ATS software.
- Add or remove education, experience, and project entries.
- Preview and PDF/Word exports use A4 sizing and automatically fit resume content to one page. Very long resumes show a warning to shorten content rather than shrinking text below a readable size.

## Notes

- This starter version does not include AI, accounts, or a database.
- Resume information is saved in the browser's localStorage on that device; it is not sent to the Express server.
- PDF export uses the browser's print dialog, which avoids requiring a paid PDF service.
- Google Fonts are optional; if offline, system fallback fonts will be used.
- To clear saved data, clear this site's local storage in your browser or use the browser's site data controls.

## Project structure

```text
resumecraft/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```
