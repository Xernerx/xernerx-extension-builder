interface Options {
	client: object;
}

export default class XernerxExtensionBuilder {
	name: string;
	options?: Options;

	constructor(name: string, options?: Options) {
		this.name = name;

		this.options = (options as Options) || {};
	}
}
