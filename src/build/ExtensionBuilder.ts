/** @format */

import { EventEmitter } from 'node:events';

/**
 * Discriminator literal identifying a class instance as a valid `@xernerx/framework` extension.
 */
export type ExtensionFileType = 'XernerxExtension';

/**
 * Base configuration options accepted by {@link ExtensionBuilder}.
 */
export interface ExtensionBuilderOptions<TClient = any> {
	/**
	 * Optional framework client (`XernerxClient` or `XernerxShardClient`) to attach to the extension.
	 */
	client?: TClient;

	/**
	 * Optional human-readable extension name override (defaults to the extension `id`).
	 */
	name?: string;

	/**
	 * Additional extension-specific configuration properties.
	 */
	[key: string]: any;
}

/**
 * Base builder class for creating `@xernerx/framework` extensions (such as `@xernerx/commands`, `@xernerx/stats`, and `@xernerx/hooks`).
 *
 * Extends Node's `EventEmitter` so extensions can emit custom events onto the framework's `EventHandler` (`emitter: '<extensionProperty>'`)
 * and provides lifecycle hooks (`main` on client attachment, `defer` on `clientReady`).
 *
 * @typeParam TClient - Type of the attached framework client (e.g. `XernerxClient` or `XernerxShardClient`).
 * @typeParam TOptions - Configuration options object stored on `this.options`.
 *
 * @example
 * ```ts
 * import { ExtensionBuilder, type ExtensionBuilderOptions } from '@xernerx/extension-builder';
 * import type { XernerxClient } from '@xernerx/framework';
 *
 * export interface CustomExtensionOptions extends ExtensionBuilderOptions<XernerxClient> {
 * 	prefix?: string;
 * }
 *
 * export class CustomExtension extends ExtensionBuilder<XernerxClient, CustomExtensionOptions> {
 * 	constructor(client: XernerxClient, options: CustomExtensionOptions = {}) {
 * 		super('CustomExtension', options);
 *
 * 		if (client) {
 * 			this.client = client;
 * 		}
 * 	}
 *
 * 	public override async main(client: XernerxClient) {
 * 		// Executed immediately when the extension is bound to the client
 * 	}
 *
 * 	public override async defer(client: XernerxClient) {
 * 		// Executed once the Discord client emits 'clientReady'
 * 	}
 * }
 * ```
 */
export class ExtensionBuilder<TClient = any, TOptions extends Record<string, any> = ExtensionBuilderOptions<TClient>> extends EventEmitter {
	/**
	 * Unique extension identifier used as the key in `client.extensions`.
	 */
	public readonly id: string;

	/**
	 * Human-readable extension name (defaults to `this.id`).
	 */
	public readonly name: string;

	/**
	 * Framework module filetype discriminator required by `@xernerx/framework`'s `ExtensionHandler`.
	 */
	public readonly filetype: ExtensionFileType = 'XernerxExtension' as const;

	/**
	 * Configuration options passed to this extension instance.
	 */
	public readonly options: TOptions;

	/**
	 * Legacy options alias preserved for backwards compatibility with `xernerx-extension-builder`.
	 */
	public readonly _options: TOptions;

	/**
	 * Internal reference to the attached framework client instance.
	 */
	protected _client!: TClient;

	/**
	 * Tracks whether `main(client)` has already been invoked for this instance.
	 */
	protected initialized = false;

	/**
	 * Tracks whether `defer(client)` has already been scheduled or executed.
	 */
	protected deferred = false;

	/**
	 * Creates a new `ExtensionBuilder` instance.
	 *
	 * @param id - Unique identifier/name for the extension (e.g. `'XernerxCommands'`, `'XernerxStats'`, `'XernerxHooks'`).
	 * @param options - Optional extension configuration object.
	 */
	constructor(id: string, options: TOptions = {} as TOptions) {
		super();

		this.id = id;
		this.name = options && typeof options === 'object' && typeof (options as any).name === 'string' && (options as any).name ? (options as any).name : id;
		this.options = options ?? ({} as TOptions);
		this._options = this.options;

		if (options && typeof options === 'object' && 'client' in options && options.client) {
			this._client = options.client as TClient;
			queueMicrotask(() => {
				if (!this.initialized && this._client) {
					this.client = this._client;
				}
			});
		}
	}

	/**
	 * The attached `@xernerx/framework` client (`XernerxClient` or `XernerxShardClient`).
	 */
	public get client(): TClient {
		return this._client;
	}

	/**
	 * Attaches the `@xernerx/framework` client to this extension and triggers `main(client)`
	 * and `defer(client)` lifecycle hooks on first assignment.
	 *
	 * @param value - The framework client to attach.
	 */
	public set client(value: TClient) {
		this._client = value;
		if (value && !this.initialized) {
			this.initialized = true;
			void this._initialize(value);
		}
	}

	/**
	 * Internal initializer that invokes `main(client)` and schedules `defer(client)`.
	 *
	 * @param client - The attached framework client.
	 */
	private async _initialize(client: TClient): Promise<void> {
		this._scheduleDefer(client);
		await this.main(client);
	}

	/**
	 * Schedules `defer(client)` to run once the client emits `'clientReady'`
	 * (or immediately if `client.isReady()` is already `true`).
	 *
	 * @param client - The attached framework client.
	 */
	private _scheduleDefer(client: TClient): void {
		if (this.deferred || this.defer === ExtensionBuilder.prototype.defer) return;
		this.deferred = true;

		const anyClient = client as any;
		if (typeof anyClient?.isReady === 'function' && anyClient.isReady()) {
			void this.defer(client);
		} else if (typeof anyClient?.once === 'function') {
			anyClient.once('clientReady', (readyClient: TClient) => {
				void this.defer(readyClient ?? client);
			});
		} else if (typeof anyClient?.on === 'function') {
			anyClient.on('clientReady', (readyClient: TClient) => {
				void this.defer(readyClient ?? client);
			});
		}
	}

	/**
	 * Lifecycle hook executed immediately when the extension is attached to a framework client.
	 * Override this method in subclasses to register commands, listeners, or client properties.
	 *
	 * @param _client - The attached framework client.
	 */
	public main(_client: TClient): Promise<void> | void {
		// Overridden by subclasses
	}

	/**
	 * Lifecycle hook executed once the attached Discord client becomes ready (`'clientReady'`).
	 * Override this method in subclasses for logic that requires a logged-in `client.user`.
	 *
	 * @param _client - The ready framework client.
	 */
	public defer(_client: TClient): Promise<void> | void {
		// Overridden by subclasses
	}
}

/**
 * Alias for {@link ExtensionBuilder} preserved for backwards compatibility.
 */
export { ExtensionBuilder as XernerxExtensionBuilder, ExtensionBuilder as XernerxExtension };
