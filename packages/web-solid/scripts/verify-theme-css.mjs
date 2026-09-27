import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(process.argv[2]);

const findCssFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findCssFiles(entryPath)
        : entry.name.endsWith(".css")
          ? [entryPath]
          : [];
    }),
  );
  return files.flat();
};

const cssFiles = await findCssFiles(outputDirectory);
const stylesheets = await Promise.all(
  cssFiles.map(async (file) => ({ file, css: await readFile(file, "utf8") })),
);
const surfaceTokenPattern =
  /--elmethis-color-surface-base\s*:\s*([^;}]+)/g;

const overridingStylesheet = stylesheets.find(({ css }) => {
  const declarations = [...css.matchAll(surfaceTokenPattern)];
  return declarations.at(-1)?.[1].startsWith("light-dark(");
});

if (!overridingStylesheet) {
  throw new Error(
    `${path.relative(process.cwd(), outputDirectory)} does not end its Elmethis surface declarations with a native light-dark() token`,
  );
}

const expectedPrimitives = [
  ["gold-200", "#efecea"],
  ["slate-700", "#393e46"],
];
for (const [name, value] of expectedPrimitives) {
  const pattern = new RegExp(
    `--elmethis-primitive-color-${name}\\s*:\\s*${value}(?:[;}])`,
  );
  if (!pattern.test(overridingStylesheet.css)) {
    throw new Error(
      `${path.relative(process.cwd(), overridingStylesheet.file)} does not contain the expected ${name} theme primitive (${value})`,
    );
  }
}

console.log("Built CSS preserves switchable Elmethis theme tokens.");
