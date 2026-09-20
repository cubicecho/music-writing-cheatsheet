// Serves the sibling cubeui-rn repo's built registry over HTTP so `shadcn add @cubeui/<item>`
// can install from it before it is published to GitHub Pages.
//
//   npm run registry:serve      # then, in another shell:
//   npx shadcn@latest add @cubeui/card --yes
//
// The DOM half lives under /web; /r is the React Native one and is not what this app wants.
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, normalize, resolve } from 'node:path';

const root = resolve(process.env.CUBEUI_RN_PATH ?? '../cubeui-rn', 'public');
const port = Number(process.env.PORT ?? 8731);

if (!existsSync(root)) {
  console.error(`No built registry at ${root}. Run \`npm run registry:build\` in cubeui-rn first.`);
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
}).listen(port, () => console.log(`cubeui-rn registry on http://localhost:${port}/web/{name}.json`));
