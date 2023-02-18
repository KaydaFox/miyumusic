import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Remove a song from the queue',
	fullCategory: ['Music'],
	usage: '+remove <song number>',
	examples: ['+remove 1'],
	preconditions: ['GuildOnly']
})
export class RemoveCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) => option.setName('song').setDescription('The song number to remove from the queue').setRequired(true));
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.remove(interaction);
	}

	private async remove(interaction: Command.ChatInputCommandInteraction) {
		const player = (await this.container.kazagumo.players.get(interaction.guildId!)) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this guild' });
		if (!player.queue.current) return interaction.reply({ content: 'There is no song playing' });

		let member = (await interaction.guild?.members.fetch(interaction.user.id)) || null;

		if (!member || member.voice.channelId !== player.voiceId) {
			return interaction.reply({ content: 'You are not in the same voice channel as the player' });
		}

		const songNumber = interaction.options.getInteger('song', true);

		if (player.queue.length === 0) return interaction.reply({ content: 'There are no songs to remove from the queue' });

		if (songNumber < 0 || songNumber > player.queue.length) {
			return interaction.reply({ content: 'Invalid song number' });
		}

		player.queue.remove(songNumber - 1);

		return interaction.reply({ content: `Removed song number **${songNumber}** from the queue` });
	}
}
