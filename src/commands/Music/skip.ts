import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Skip the current song',
	fullCategory: ['Music'],
	usage: '+skip',
	examples: ['+skip'],
	preconditions: ['GuildOnly']
})
export class SkipCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description).setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.doSkip(interaction);
	}

	private async doSkip(interaction: Command.ChatInputCommandInteraction) {
		const player = (await this.container.kazagumo.players.get(interaction.guildId!)) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this guild', ephemeral: true });

		const track = player.queue.current;
		if (!track) return interaction.reply({ content: 'There is no song playing', ephemeral: true });

		const member = (await interaction.guild?.members.fetch(interaction.user.id)) ?? null;
		if (!member || member.voice.channelId !== player.voiceId)
			return interaction.reply({ content: 'Please join my voice channel first', ephemeral: true });

		player.skip();

		const embed = new EmbedBuilder()
			.setTitle('Skip')
			.setDescription(`Skipped ${track.title} by ${track.author}`)
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
			.setColor(this.container.embedColor);

		return interaction.reply({ embeds: [embed] });
	}
}
