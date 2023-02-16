import type { Command } from '@sapphire/framework';

export interface MiyuCommand extends Command.Options {
	fullCategory: string[];
	usage: string;
	examples: string[];
}

export namespace MiyuCommand {
	export interface Options extends Command.Options {
		fullCategory: string[];
		usage: string;
		examples: string[];
	}
}
