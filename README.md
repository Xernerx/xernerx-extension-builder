<!-- @format -->

![@xernerx/extension-builder Banner](https://docs.xernerx.com/packages/banners/extension-builder.svg)

# @xernerx/extension-builder

The official **Xernerx Framework Extension Builder** (`@xernerx/extension-builder`) providing the base [`ExtensionBuilder`](https://docs.xernerx.com/packages/@xernerx/extension-builder#class-ExtensionBuilder) class used by [`@xernerx/commands`](https://docs.xernerx.com/packages/@xernerx/commands), [`@xernerx/stats`](https://docs.xernerx.com/packages/@xernerx/stats), [`@xernerx/hooks`](https://docs.xernerx.com/packages/@xernerx/hooks), and custom [`@xernerx/framework`](https://docs.xernerx.com/packages/@xernerx/framework) extensions.

---

## Features

- **Standardized `@xernerx/framework` Contract**: Automatically sets `id`, `name`, and `filetype = 'XernerxExtension'` required by `client.modules.extensionHandler.loadExtensions(...)`.
- **Lifecycle Hooks (`main` & `defer`)**: Implement `main(client)` for immediate setup when bound to a client and `defer(client)` for post-login initialization on `clientReady`.
- **Built-in `EventEmitter` Inheritance**: Every extension extends Node's `EventEmitter`, allowing extensions to act as custom event emitters for `@xernerx/framework`'s `EventBuilder` (`emitter: '<extensionKey>'`).
- **Typed Client & Options Generics**: Full TypeScript generic support via `ExtensionBuilder<TClient, TOptions>`.
- **Zero External Runtime Dependencies**: Lightweight ESM + CommonJS package with full `.d.ts` and `.d.cts` type declarations.

---

## Install

```bash
pnpm add @xernerx/extension-builder
```

```bash
npm install @xernerx/extension-builder
```

---

## Setup & Usage

### Creating a Custom Extension

Extend `ExtensionBuilder` and override `main(client)` and/or `defer(client)`:

```ts
import { ExtensionBuilder, type ExtensionBuilderOptions } from '@xernerx/extension-builder';
import type { XernerxClient } from '@xernerx/framework';
import { Terminal } from '@xernerx/terminal';

export interface MyExtensionOptions extends ExtensionBuilderOptions<XernerxClient> {
	greeting?: string;
}

export class MyExtension extends ExtensionBuilder<XernerxClient, MyExtensionOptions> {
	private readonly logger = new Terminal({ scope: 'EXT' });

	constructor(client: XernerxClient, options: MyExtensionOptions = {}) {
		super('MyExtension', options);

		if (client) {
			this.client = client;
		}
	}

	public override async main(client: XernerxClient) {
		(client as any).myExtension = this;
		this.logger.info(`Attached ${this.id} to client.`);
	}

	public override async defer(client: XernerxClient) {
		this.logger.info(`${this.id} ready as ${client.user?.tag} (${this.options.greeting ?? 'Hello!'})`);
		this.emit('ready', client);
	}
}
```

### Registering with `@xernerx/framework`

Pass your extension instance to `this.modules.extensionHandler.loadExtensions(...)`:

```ts
import { XernerxClient } from '@xernerx/framework';
import { MyExtension } from './MyExtension.js';

export class Client extends XernerxClient {
	constructor() {
		super({
			intents: ['Guilds'],
			token: process.env.DISCORD_BOT_TOKEN!,
		});

		this.modules.extensionHandler.loadExtensions(
			new MyExtension(this, {
				greeting: 'Xernerx Ready!',
			})
		);

		this.connect();
	}
}

new Client();
```

---

## API Reference

### `ExtensionBuilder<TClient, TOptions>`

| Member          | Type                    | Description                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `id`            | `string`                | Unique extension identifier registered in `client.extensions`.                           |
| `name`          | `string`                | Human-readable extension name (defaults to `id` or `options.name`).                      |
| `filetype`      | `'XernerxExtension'`    | Discriminator literal validated by `@xernerx/framework`'s `ExtensionHandler`.            |
| `client`        | `TClient`               | Attached `@xernerx/framework` client instance (`XernerxClient` or `XernerxShardClient`). |
| `options`       | `TOptions`              | Configuration options passed to the extension constructor.                               |
| `_options`      | `TOptions`              | Legacy options alias preserved for backwards compatibility.                              |
| `main(client)`  | `Promise<void> \| void` | Lifecycle hook invoked immediately when the extension is attached to `client`.           |
| `defer(client)` | `Promise<void> \| void` | Lifecycle hook invoked once the attached Discord client emits `'clientReady'`.           |

### Exported Symbols

- **Classes**:
  - [`ExtensionBuilder`](https://docs.xernerx.com/packages/@xernerx/extension-builder#class-ExtensionBuilder) — Base class for all `@xernerx/framework` extensions.
  - `XernerxExtensionBuilder` — Alias for `ExtensionBuilder`.
  - `XernerxExtension` — Alias for `ExtensionBuilder`.
- **Interfaces & Types**:
  - [`ExtensionBuilderOptions`](https://docs.xernerx.com/packages/@xernerx/extension-builder#interface-ExtensionBuilderOptions) — Base options interface for `ExtensionBuilder`.
  - [`ExtensionFileType`](https://docs.xernerx.com/packages/@xernerx/extension-builder#type-ExtensionFileType) — Discriminator literal type (`'XernerxExtension'`).

---

## Ecosystem Links

- [Xernerx Documentation Home](https://docs.xernerx.com)
- [`@xernerx/extension-builder` Package Reference](https://docs.xernerx.com/packages/@xernerx/extension-builder)
- [All Xernerx Packages](https://docs.xernerx.com/packages)
- [`xernerx` Collection](https://docs.xernerx.com/packages/xernerx)
- [`@xernerx/framework` Documentation](https://docs.xernerx.com/packages/@xernerx/framework)
- [`@xernerx/commands` Documentation](https://docs.xernerx.com/packages/@xernerx/commands)
- [`@xernerx/stats` Documentation](https://docs.xernerx.com/packages/@xernerx/stats)
- [`@xernerx/hooks` Documentation](https://docs.xernerx.com/packages/@xernerx/hooks)
- [`@xernerx/terminal` Documentation](https://docs.xernerx.com/packages/@xernerx/terminal)
- [`@xernerx/websocket` Documentation](https://docs.xernerx.com/packages/@xernerx/websocket)
- [Release Changelog](https://info.xernerx.com/changelog#@xernerx/extension-builder)
- [Discord Support Server](https://xernerx.com/discord)
