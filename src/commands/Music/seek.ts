import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Duration } from '@sapphire/time-utilities';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Seek through the song',
	fullCategory: ['Music'],
	usage: '>seek <time>',
	examples: ['>seek 1m30s']
})
export default class SeekCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('time').setDescription('The time to seek to').setRequired(true));
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.seek(interaction);
	}

	private async seek(interaction: Command.ChatInputCommandInteraction) {
		const time: string = interaction.options.getString('time') as string;

		const { kazagumo } = this.container;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;

		if (!player) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const queue = player.queue;
		const track = queue.current;

		if (!queue || !track) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		if (!track.isSeekable) return interaction.reply({ content: 'This song is not seekable!', ephemeral: true });

		const timeToSeek = new Duration(time);
		if (timeToSeek.offset > track.length!) return interaction.reply({ content: 'That time is longer than the song!', ephemeral: true });
		if (timeToSeek.offset < 0 || isNaN(timeToSeek.offset)) return interaction.reply({ content: 'Invalid time provided', ephemeral: true });

		await player.seek(timeToSeek.offset);

		return interaction.reply({ content: `Seeked to ${time}` });
	}
}
