import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Pause and resume the player',
	fullCategory: ['Music'],
	usage: '+pause',
	examples: ['+pause'],
	preconditions: ['GuildOnly']
})
export class PauseCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description).setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.pause(interaction);
	}

	private async pause(interaction: Command.ChatInputCommandInteraction) {
		const player = (await this.container.kazagumo.players.get(interaction.guildId!)) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this guild' });
		if (!player.queue.current) return interaction.reply({ content: 'There is no song playing' });

		let member = (await interaction.guild?.members.fetch(interaction.user.id)) || null;

		if (!member || member.voice.channelId !== player.voiceId) {
			return interaction.reply({ content: 'You are not in the same voice channel as the player' });
		}

		if (player.paused) {
			player.pause(false);
			return interaction.reply({ content: 'Resumed the player' });
		} else {
			player.pause(true);
			return interaction.reply({ content: 'Paused the player' });
		}
	}
}
