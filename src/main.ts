export default class XernerxExtensionBuilder {
    public readonly name: string;
    public readonly options;

    constructor(name: string, options?: Record<string, unknown>) {
        this.name = name;

        this.options = options || {};
    }

    public async main(client: unknown) {}

    public async defer(client: unknown) {}
}
