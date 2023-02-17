import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';
import { promisify } from 'node:util';
import { exec as exe } from 'node:child_process';
import { Stopwatch } from '@sapphire/stopwatch';
import Type from '@sapphire/type';
import { codeBlock } from '@sapphire/utilities';

const exec = promisify(exe);

@ApplyOptions<MiyuCommand.Options>({
	description: 'Execute a command in my shell',
	fullCategory: ['Owner'],
	usage: '>exec <command>',
	examples: ['>exec ls'],
	preconditions: ['OwnerOnly']
})
export class ExecCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const command = await args.rest('string');
		if (!command) return message.reply('Oi! you left the command at the door you muppet.');

		return this.doExec(message, command);
	}

	private async doExec(message: Message, command: string) {
		const stopwatch = new Stopwatch();
		let stdout: string = '',
			stderr: string = '';

		await exec(command, { timeout: 30000 })
			.then((res) => {
				if (res.stdout) stdout = res.stdout;
				if (res.stderr) stderr = res.stderr;
			})
			.catch((err) => {
				if (err.stdout) stdout = err.stdout;
				if (err.stderr) stderr = err.stderr;

				if (!err.stdout && !err.stderr) stderr = 'Done';
			});

		const type = new Type(stdout || stderr).toString();
		const typeFooter = `**Type: ${codeBlock('typescript', type)}**`;

		const timeTaken = stopwatch.stop().toString();
		if (stdout.length > 3000 || stderr.length > 3000) {
			return message.reply({
				content: `Output too long, sending as a file.\n${timeTaken}\n${typeFooter}`,
				files: [{ attachment: Buffer.from(stdout || stderr), name: 'output.txt' }]
			});
		}

		return message.reply({
			content: typeFooter,
			embeds: [
				new EmbedBuilder()
					.setDescription(`${codeBlock('vbs', stdout || stderr)}`)
					.setFooter({ text: `⏱️ ${timeTaken}` })
					.setColor(0xfe9fc6)
			]
		});
	}
}
