<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- Mount `ThemeProvider` once in `src/routes/__root.tsx` around `<Outlet />`, never per page — any page using `ThemePanel` renders during SSR and crashes if the provider is missing.
- Keep browser-only helpers (export/download, payload builders) in plain `src/lib/*.ts` modules, not in route files or `*.functions.ts` — route files pull in server functions and `*.functions.ts` enters the server bundle, so neither can be unit-tested or imported safely.

