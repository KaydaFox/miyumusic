import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { ColorResolvable, EmbedBuilder } from 'discord.js';
import createChunks from '../../lib/createChunks';
import formatTime from '../../lib/formatTime';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'View the current queue',
	fullCategory: ['Music'],
	usage: '+queue',
	examples: ['+queue'],
	preconditions: ['GuildOnly']
})
export class QueueCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.viewQueue(interaction);
	}

	private async viewQueue(interaction: Command.ChatInputCommandInteraction) {
		const player = (await this.container.kazagumo.players.get(interaction.guildId!)) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this guild', ephemeral: true });

		const queue = player.queue;
		const currentTrack = queue.current;
		const previousTrack = queue.previous;

		if (!queue.length)
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Queue')
						.setDescription(
							`${previousTrack ? `**Previously played:**\n${previousTrack.title} by ${previousTrack.author}` : ''}\n
              ${currentTrack ? `**Currently playing:**\n${currentTrack.title} by ${currentTrack.author}` : 'No song is currently playing'}\n`
						)
						.setFooter({ text: `End of queue` })
						.setColor(process.env.EMBED_COLOUR as ColorResolvable)
				]
			});

		const initialReply = await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Queue')
					.setDescription('Loading...')
					.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
					.setColor(process.env.EMBED_COLOUR as ColorResolvable)
			],
			fetchReply: true
		});

		let totalLength = 0;
		queue.forEach((track) => {
			totalLength += track.length || 0;
		});

		if (queue.length < 10) {
			const embed = new EmbedBuilder()
				.setTitle('Queue')
				.setDescription(
					`${previousTrack ? `**Previously played:**\n${previousTrack.title} by ${previousTrack.author}` : ''}\n
          ${currentTrack ? `**Currently playing:**\n${currentTrack.title} by ${currentTrack.author}` : 'No song is currently playing'}\n`
				)
				.setFooter({ text: `Total length: ${formatTime(totalLength)}` })
				.setColor(process.env.EMBED_COLOUR as ColorResolvable);

			queue.forEach((track, index) => {
				embed.addFields({ name: `Track ${index + 1}`, value: track.title });
			});

			return interaction.editReply({ embeds: [embed] });
		}

		const mappedQueue = queue.map((track, index) => {
			return {
				index: index + 1,
				title: track.title,
				author: track.author,
				uri: track.uri,
				sourceName: track.sourceName,
				requester: track.requester,
				length: formatTime(track.length || 0)
			};
		});

		const chunks = createChunks(mappedQueue, 10);

		const paginatedMessage = new PaginatedMessage({
			template: new EmbedBuilder()
				.setTitle('Queue')
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() ?? undefined })
				.setThumbnail(currentTrack?.thumbnail ?? null)
				.setColor(process.env.EMBED_COLOUR as ColorResolvable)
		});

		chunks.forEach((chunk) => {
			paginatedMessage.addPageEmbed((embed: EmbedBuilder) =>
				embed
					.setDescription(
						`${previousTrack ? `**Previously played:**\n${previousTrack.title} by ${previousTrack.author}` : ''}\n
            ${currentTrack ? `**Currently playing:**\n${currentTrack.title} by ${currentTrack.author}` : 'No song is currently playing'}\n`
					)
					.addFields(
						chunk.map((track) => {
							return {
								name: `${track.index} - ${track.title} by ${track.author}`,
								value: `[link from ${track.sourceName}](${track.url})\nRequested by ${track.requester} - \`${track.length}\``
							};
						})
					)
					.setFooter({ text: `Total length: ${formatTime(totalLength)}` })
			);
		});

		return paginatedMessage.run(initialReply, interaction.user);
	}
}
