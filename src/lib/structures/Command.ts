import { Command } from '@sapphire/framework';

interface MiyuCommandOptions extends Command.Options {
	usage: string;
	examples: string[];
}

export namespace MiyuCommand {
	export type Options = MiyuCommandOptions & {
		usage: string;
		examples: string[];
	};
}

export abstract class MiyuCommand extends Command {
	public constructor(context: Command.Context, public readonly options: MiyuCommandOptions) {
		super(context, options);
	}

	public get usage() {
		return this.options.usage;
	}

	public get examples() {
		return this.options.examples;
	}
}
