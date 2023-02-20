import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Skips to a specific song in the queue',
	fullCategory: ['Music'],
	usage: '>skipto <song number>',
	examples: ['>skipto 2']
})
export default class SkipToCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) => option.setName('song').setDescription('The song number to skip to').setRequired(true));
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.skipTo(interaction);
	}

	private async skipTo(interaction: Command.ChatInputCommandInteraction) {
		const song: number = interaction.options.getInteger('song') as number;

		const { kazagumo } = this.container;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;

		if (!player) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const queue = player.queue;
		if (!queue || !queue.length) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });
		if (song! > queue.length) return interaction.reply({ content: 'That song is not in the queue!', ephemeral: true });

		queue.unshift(queue[song! - 1]);

		player.skip();

		return interaction.reply({ content: `Skipped to song ${song}` });
	}
}
