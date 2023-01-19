interface Options {
	client: object;
}

export default class XernerxExtensionBuilder {
	name: string;
	_options?: Options;

	constructor(name: string, _options?: Options) {
		this.name = name;

		this._options = (_options as Options) || {};
	}
}
