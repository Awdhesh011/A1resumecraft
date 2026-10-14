# ResumeCraft

A responsive resume builder with:
- Live preview as you type
- Modern, Classic, and Minimal templates
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
- Add or remove education, experience, and project entries.
- Click Download PDF. In the browser print dialog, select **Save as PDF** and paper size **A4**. Enable background graphics if you want the accent styling included.

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
