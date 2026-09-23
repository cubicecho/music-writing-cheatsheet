// Serves the sibling cubeui repo's built registry over HTTP, for installing a change that is not
// published yet. The ordinary source is the published registry — `components.json` points at
// https://cubicecho.github.io/cubeui/r/{name}.json — so this is the escape hatch, not the route:
// point `components.json` here, install, and put it back.
//
//   npm run registry:serve      # then, in another shell:
//   npx shadcn@latest add @cubeui/card --yes
//
// The DOM half lives under /r; the React Native one is under /r/native. That way round on
// purpose: /r/{name}.json is the URL cubeui's DOM consumers already mapped before the RN half
// landed, so the merge was a merge for them rather than a migration.
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, normalize, resolve } from 'node:path';

const root = resolve(process.env.CUBEUI_PATH ?? process.env.CUBEUI_RN_PATH ?? '../cubeui', 'public');
const port = Number(process.env.PORT ?? 8731);

if (!existsSync(root)) {
  console.error(`No built registry at ${root}. Run \`npm run registry:build\` in cubeui first.`);
  process.exit(1);
}

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname));
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`cubeui registry on http://localhost:${port}/r/{name}.json`));
