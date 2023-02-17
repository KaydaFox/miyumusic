import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import formatTime from '../../lib/formatTime';
import { progressBar } from '../../lib/progressBar';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Shows the currently playing song',
	aliases: ['np'],
	fullCategory: ['Music'],
	usage: '>nowplaying',
	examples: ['>nowplaying'],
	preconditions: ['GuildOnly']
})
export class NowPlayingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.nowPlaying(interaction);
	}

	private async nowPlaying(interaction: Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;

		const player = kazagumo.players.get(interaction.guildId as string);

		if (!player) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const track = player.queue.current;

		if (!track) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const bar = progressBar(player.position, track.length || 100, 20);

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Now Playing')
					.setThumbnail(track.thumbnail || null)
					.setURL(track.uri)
					.setDescription(
						`${track.title} by ${track.author}\nRequested by ${track.requester}\n\n${formatTime(player.position)} ${bar} ${formatTime(
							track.length || 100
						)}`
					)
			]
		});
	}
}
