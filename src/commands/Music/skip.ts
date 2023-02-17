import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Skip the current song',
	fullCategory: ['Music'],
	usage: '+skip',
	examples: ['+skip'],
	preconditions: ['GuildOnly']
})
export class SkipCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description);
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
			.setColor(process.env.EMBED_COLOUR);

		return interaction.reply({ embeds: [embed] });
	}
}
