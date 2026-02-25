# VitePress Dynamic Sidebar

## Install

```bash
npm install -D vitepress-dynamic-sidebar
```

## Usage

```js
import { defineConfig } from "vitepress";
import { withDynamicSidebar } from ".vitepress-dynamic-sidebar";

const IGNORE_FOLDERS = [
  ".git",
  ".vitepress",
  "node_modules",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "coverage",
];

export default defineConfig(
  withDynamicSidebar({
    title: "Example Project",
    srcDir: "./src",
    ignore: IGNORE_FOLDERS,
  }),
);
```

## Structure

```
/
  package.json
  .vitepress
    config.js
  src
    main.js
    index.md
      example-a
        index.ts
        example-a.md
        example-a.js
      example-b
        index.ts
        example-b.md
        example-b.js
```

## Files

```md
<!-- example-a.md -->

---
title: Modules/Example A
---

# Example A

This is documentation for Example A.
``` 

```md
<!-- example-b.md -->

---
title: Modules/Example B
---

# Example B

This is documentation for Example B.
``` 

```md
<!-- index.md -->

# Overview

- [Example A](/modules/example-a)
- [Example B](/modules/example-b)
``` 
