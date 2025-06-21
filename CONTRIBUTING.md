# Contributing

We welcome pull requests that improve or expand the project. Please follow the guidelines below when submitting changes.

## Working with Agent UI & API Conflicts

### Routing priorities in `main.jsx`
Routing for the Agent UI is handled in [`frontend/src/main.jsx`](frontend/src/main.jsx). The component checks the current path in this order:
1. If the path starts with `/demo`, it renders `DemoPage`.
2. Next it checks for `/gallery` to load `AgentsGallery`.
3. Then it checks for `/use-cases` to show `UseCaseSelector`.
4. Any other path falls back to the landing view with the DevTools panel.

This priority ensures demo and gallery routes load before the default landing page.

### Registering Express routes
New API endpoints live in [`functions/index.js`](functions/index.js). To register a route:
```js
app.get('/my-route', (req, res) => {
  res.json({ ok: true });
});
```
Static assets can be served with:
```js
app.use('/assets', express.static(path.join(__dirname, '..', 'public')));
```
Group similar routes together to keep the file organized.

### Resolving merge conflicts with GitHub CLI
1. Check out the pull request branch:
   ```bash
   gh pr checkout <number>
   ```
2. Update it with the latest main branch:
   ```bash
   git fetch origin
   git merge origin/main
   ```
3. Edit files containing `<<<<<<<` and `>>>>>>>` markers and keep the correct changes.
4. Mark them resolved:
   ```bash
   git add <files>
   git commit -m "Resolve conflicts"
   ```
5. Push the fixes and enable auto merge:
   ```bash
   git push
   gh pr merge --auto
   ```

### CI helpers
- **Conflict detector workflow:** [`.github/workflows/detect-pr-conflicts.yml`](.github/workflows/detect-pr-conflicts.yml)
- **Auto‑merge workflow:** [`.github/workflows/guardian-check.yml`](.github/workflows/guardian-check.yml)
