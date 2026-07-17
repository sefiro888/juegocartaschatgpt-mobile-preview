import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/juegocartaschatgpt/';
const cdpPort = process.env.CDP_PORT ?? '9223';
const screenshotPath = path.resolve(
  process.argv[3] ?? 'docs/screenshots/floating-sanctuary-qa-current.png',
);

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const target = targets.find((candidate) => candidate.type === 'page');

if (!target) throw new Error('Chrome did not expose a page target.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
const events = [];
const requestUrls = new Map();

socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const operation = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) operation.reject(new Error(message.error.message));
    else operation.resolve(message.result);
    return;
  }

  if (message.method === 'Network.requestWillBeSent') {
    requestUrls.set(message.params.requestId, message.params.request.url);
  }
  events.push(message);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await Promise.all([
  send('Runtime.enable'),
  send('Log.enable'),
  send('Page.enable'),
  send('Network.enable'),
]);

await send('Page.navigate', { url });
await sleep(900);
await evaluate(`
  [...document.querySelectorAll('button')]
    .find((element) => element.textContent.includes('Jugar contra la IA'))
    ?.click()
`);
await sleep(700);
await evaluate(`
  (() => {
    const title = [...document.querySelectorAll('h4')]
      .find((element) => element.textContent.includes('Mazo Clásico'));
    (title?.closest('.deck-choice-item, button, [role="button"]') ?? title)?.click();
  })()
`);
await sleep(4200);

await evaluate(`
  (() => {
    const store = window.__NEXO_GAME_STORE__?.getState();
    if (!store?.gameState) throw new Error('The game store was not initialized.');
    const commander = Object.values(store.gameState.board)
      .find((entity) => entity.id === 'commander-player');
    store.selectEntity(commander ?? null);
  })()
`);
await sleep(250);
const validMoveCount = Number(await evaluate(`
  document.querySelector('[data-testid="floating-sanctuary-board"]')
    ?.getAttribute('data-valid-moves') ?? '-1'
`));

await evaluate(`
  (() => {
    const store = window.__NEXO_GAME_STORE__?.getState();
    if (!store) throw new Error('The development game store is unavailable.');
    store.move({ x: 5, y: 0 }, { x: 5, y: 1 });
  })()
`);
await sleep(1100);
const movementState = JSON.parse(await evaluate(`
  JSON.stringify({
    canvasStatus: document.querySelector('[data-testid="floating-sanctuary-board"]')
      ?.getAttribute('data-canvas-status'),
    commanderPosition: document.querySelector('[data-entity-id="commander-player"]')
      ?.getAttribute('data-logical-position'),
  })
`));

const pageState = JSON.parse(await evaluate(`
  JSON.stringify({
    bodyText: document.body.innerText.slice(0, 500),
    canvases: [...document.querySelectorAll('canvas')].map((canvas) => {
      const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      const pixel = new Uint8Array(4);
      if (context) {
        context.readPixels(
          Math.floor(canvas.width / 2),
          Math.floor(canvas.height / 2),
          1,
          1,
          context.RGBA,
          context.UNSIGNED_BYTE,
          pixel,
        );
      }
      return {
        width: canvas.width,
        height: canvas.height,
        cssWidth: getComputedStyle(canvas).width,
        cssHeight: getComputedStyle(canvas).height,
        contextLost: context?.isContextLost() ?? null,
        centerPixel: [...pixel],
      };
    }),
  })
`));

const screenshot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
});
await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));

const diagnostics = events.flatMap((event) => {
  if (event.method === 'Runtime.exceptionThrown') {
    const details = event.params.exceptionDetails;
    return [{
      type: 'exception',
      text: details.exception?.description ?? details.text,
    }];
  }
  if (event.method === 'Runtime.consoleAPICalled') {
    return [{
      type: `console.${event.params.type}`,
      text: event.params.args
        .map((argument) => argument.value ?? argument.description ?? '')
        .join(' '),
    }];
  }
  if (event.method === 'Log.entryAdded') {
    return [{ type: `log.${event.params.entry.level}`, text: event.params.entry.text }];
  }
  if (event.method === 'Network.loadingFailed') {
    return [{
      type: 'network-failed',
      text: `${requestUrls.get(event.params.requestId) ?? event.params.requestId}: ${event.params.errorText}`,
    }];
  }
  if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) {
    return [{
      type: 'network-status',
      text: `${event.params.response.status} ${event.params.response.url}`,
    }];
  }
  return [];
});

console.log(JSON.stringify({
  pageState,
  interaction: { validMoveCount, ...movementState },
  diagnostics,
  screenshotPath,
}, null, 2));
socket.close();
