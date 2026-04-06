# SalonX Engineering Rules

This file is the human-readable version of the project engineering rules.

## Goals

These rules are here to keep the app:
- easier to maintain
- safer to change
- more consistent visually and architecturally
- cleaner as features grow

## Rules

### 1. Keep TypeScript passing

Run:

```bash
npx tsc --noEmit
```

Do not leave red TypeScript errors behind after feature work.

### 2. Do not keep backup files inside src/

Bad examples:
- `something.backup.ts`
- `file.old.tsx`
- `copy.ts`

If you need to preserve an experiment, move it outside the compile path.

### 3. Use theme tokens before hardcoded values

Prefer:
- `src/theme/colors.ts`
- shared spacing/responsive helpers

If a new style token repeats, promote it into the theme.

### 4. Split large screens and components

If a file starts handling:
- UI
- business logic
- persistence
- animation
- gestures
- navigation

then split it into hooks/helpers/components.

### 5. Keep route files thin

Expo Router files in `app/` should mostly delegate to screen components.
Complex logic should live in `src/screens` or helpers.

### 6. Keep mode-specific calendar behavior explicit

- Day view can have drag/drop, resize, park/unpark.
- Week/month behavior should stay intentionally limited unless designed otherwise.
- Shared constants must remain aligned across drag/drop code.

### 7. Keep persistence predictable

- Be explicit when hydrating dates from storage.
- Avoid mixing mock data and persisted data in surprising ways.
- Add comments when merge rules are non-obvious.

### 8. Remove temporary debug code

Before committing, clean up:
- temporary logs
- debug colors
- throwaway styles
- unused imports
- dead components

### 9. Prefer readable code over clever code

Use the simplest implementation that stays correct and maintainable.

### 10. Update docs for non-trivial behavior changes

When a feature meaningfully changes behavior, update the relevant file in `docs/`.

## Recommended pre-commit checklist

- [ ] `npx tsc --noEmit` passes
- [ ] no dead backup files in compile path
- [ ] no stray debug code
- [ ] theme consistency preserved
- [ ] docs updated if behavior changed
