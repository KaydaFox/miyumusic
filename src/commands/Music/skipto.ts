import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Skips to a specific song in the queue',
	fullCategory: ['Music'],
	usage: '>skipto <song number>',
	examples: ['>skipto 2']
})
export default class SkipToCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) => option.setName('song').setDescription('The song number to skip to').setRequired(true))
				.addBooleanOption((option) => option.setName('keep-skipped').setDescription('Keep the skipped songs in the queue?'))
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.skipTo(interaction);
	}

	private async skipTo(interaction: Command.ChatInputCommandInteraction) {
		const song: number = interaction.options.getInteger('song') as number;
		const keepSkipped = interaction.options.getBoolean('keep-skipped') || false;

		const { kazagumo } = this.container;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;

		if (!player) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const queue = player.queue;
		if (!queue || !queue.length) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });
		if (song! > queue.length) return interaction.reply({ content: 'That song is not in the queue!', ephemeral: true });
		if (keepSkipped) {
			queue.unshift(queue[song! - 1]);
			queue.remove(song!);
			player.skip();
			// ^ will skip to the song,
		} else {
			for (let i = 1; i < song!; i++) {
				queue.remove(0);
			}
			player.skip();
			// bit of an inefficient way of doing it, but it works
		}

		return interaction.reply({ content: `Skipped to song ${song}` });
	}
}
