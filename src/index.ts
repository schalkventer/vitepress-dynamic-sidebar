import type { DefaultTheme, UserConfig } from "vitepress";
import { readdirSync, readFileSync } from "fs";
import { join, relative, resolve } from "path";

const resolveRootPath = (root = "."): string => resolve(process.cwd(), root);

/**
 * An object representing the location of a markdown file that has a `title`
 * value in its frontmatter (and what the `title` value is.)
 */
type FileMatch = { path: string; title: string };

/**
 * The (recursive) shape used to indicate specific item in the sidebar when
 * configuring VitePress.
 */
type SidebarNode = {
  text?: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarNode[];
};

/**
 * Reads a markdown file at a specific location and extracts the `title` from
 * its YAML frontmatter. If no `title` or frontmatter exists then `null` will be
 * returned.
 *
 * Note that this is primarily used to identify which markdown files in the
 * project to include in the documentation (and where to place them in the
 * sidebar), since only markdown files with `title` front-matter will be
 * included.
 */
const extractTitleFromPath = (filePath: string): string | null => {
  try {
    const content = readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*(.+)/);

    return titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
};

/**
 * Returns an array of all markdown files in a folder (and all nested
 * sub-folders) that have a `title` field in their frontmatter, along with the
 * value of that title.
 *
 * Note that an `ignore` array can be passed of folder names that should be
 * excluded from the search.
 *
 */
const getAllMarkdownFilesWithTitle = (
  rootPath: string,
  ignore: string[],
): FileMatch[] => {
  const result: FileMatch[] = [];

  const walk = (directory: string) => {
    const entries = readdirSync(directory, { withFileTypes: true });

    entries.forEach((entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        if (ignore.includes(entry.name)) return;
        return walk(entryPath);
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
        return;
      }

      const title = extractTitleFromPath(entryPath);
      if (!title) return;

      const inner = relative(rootPath, entryPath)
        .replace(/\\/g, "/")
        .replace(/\.md$/i, "");

      result.push({ path: `/${inner}`, title });
    });
  };

  walk(rootPath);
  return result;
};

/**
 * Converts a list of `FileMatch` objects into a hierarchical `SidebarNode`
 * structure to pass to VitePress as the `sidebar` configuration.
 *
 * Note that `title` values are split into nestable groups based on the `/`
 * character. This is similar to the way that Storybook handles `title` values
 * as well.
 */
const buildSidebarFromFiles = (
  files: FileMatch[],
): DefaultTheme.SidebarItem[] => {
  const result: SidebarNode = { items: [] };

  files.forEach(({ path, title }) => {
    const parts = title
      .split("/")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    let current = result;
    const groupParts = parts.slice(0, -1);
    const label = parts[parts.length - 1];

    groupParts.forEach((part) => {
      if (!current.items) return;

      let found = current.items.find((x) => x.text === part && !x.link);

      if (!found) {
        found = { text: part, items: [], collapsed: true };
        current.items.push(found);
      }

      current = found;
    });

    if (!current.items) {
      current.items = [];
    }

    current.items.push({
      text: label,
      link: path,
    });
  });

  return result.items || [];
};

/**
 * Applies Dynamic Sidebar logic.
 */
export const withDynamicSidebar = (
  options: UserConfig & { ignore: string[] },
): UserConfig => {
  const { ignore, ...remaining } = options || {};

  if (!remaining.srcDir) {
    throw new Error(
      "The 'srcDir' option is required when using withDynamicSidebar.",
    );
  }

  const files = getAllMarkdownFilesWithTitle(remaining.srcDir, ignore);
  const sidebar = buildSidebarFromFiles(files);

  return {
    ...remaining,
    themeConfig: {
      ...remaining.themeConfig,
      sidebar,
      outline: "deep",
    },
    vite: {
      server: {
        fs: {
          allow: [remaining.srcDir],
        },
      },
    },
  };
};
