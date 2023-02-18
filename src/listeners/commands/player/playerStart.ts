import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ColorResolvable,
	ComponentType,
	EmbedBuilder,
	Message,
	TextChannel,
	User,
	VoiceChannel
} from 'discord.js';
import { Events, KazagumoPlayer, KazagumoTrack } from 'kazagumo';
import formatTime from '../../../lib/formatTime';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerStart
})
export class PlayerStartListener extends Listener<typeof Events.PlayerStart> {
	private makeRow(player: KazagumoPlayer) {
		const volumeDownButton = new ButtonBuilder().setCustomId('volumeDown').setEmoji('🔉').setStyle(ButtonStyle.Secondary);

		const previousButton = new ButtonBuilder().setCustomId('previous').setEmoji('⏮').setStyle(ButtonStyle.Secondary);

		const pausePlayButton = new ButtonBuilder()
			.setCustomId('pausePlay')
			.setEmoji(player.paused ? '▶' : '⏸')
			.setStyle(ButtonStyle.Secondary);

		const nextButton = new ButtonBuilder().setCustomId('next').setEmoji('⏭').setStyle(ButtonStyle.Secondary);

		const volumeUpButton = new ButtonBuilder().setCustomId('volumeUp').setEmoji('🔊').setStyle(ButtonStyle.Secondary);

		const seekBackwardsButton = new ButtonBuilder().setCustomId('seekBackwards').setEmoji('⏪').setStyle(ButtonStyle.Secondary);

		const loopButton = new ButtonBuilder()
			.setCustomId('loop')
			.setEmoji(player.loop === 'none' ? '❌' : player.loop === 'track' ? '🔂' : '🔁')
			.setStyle(player.loop === 'track' || player.loop === 'queue' ? ButtonStyle.Success : ButtonStyle.Secondary);

		const stopButton = new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Danger);

		const lyricsButton = new ButtonBuilder().setCustomId('lyrics').setEmoji('<:paper:1053367264977625089>').setStyle(ButtonStyle.Secondary);

		const seekForwardsButton = new ButtonBuilder().setCustomId('seekForwards').setEmoji('⏩').setStyle(ButtonStyle.Secondary);

		const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			volumeDownButton,
			previousButton,
			pausePlayButton,
			nextButton,
			volumeUpButton
		);

		const secondaryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			seekBackwardsButton,
			loopButton,
			stopButton,
			lyricsButton,
			seekForwardsButton
		);

		return [mainRow, secondaryRow];
	}

	public async run(player: KazagumoPlayer, track: KazagumoTrack) {
		let requester: User = track.requester as User;

		const embed = new EmbedBuilder()
			.setTitle('Now Playing')
			.setURL(track.uri)
			.setThumbnail(track.thumbnail || null)
			.setAuthor({ name: requester.username, iconURL: requester.displayAvatarURL() })
			.setDescription(`[${track.title} by ${track.author}](${track.uri}) \`[${formatTime(track.length as number)}]\``)
			.setFooter({ text: `source: ${track.sourceName}` })
			.setColor(process.env.EMBED_COLOUR as ColorResolvable);

		const textChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;

		if (!textChannel) return;

		const intialMessage = await textChannel.send({ embeds: [embed], components: this.makeRow(player) });

		player.data.set('message', intialMessage);

		const collector = intialMessage.createMessageComponentCollector({ time: track.length, componentType: ComponentType.Button });

		collector.on('collect', async (interaction) => {
			if (!interaction.member?.voice.channel) {
				await interaction.reply({ content: 'You must be in a voice channel to use this button', ephemeral: true });
				return;
			}

			if (interaction.member.voice.channel.id !== player.voiceId) {
				await interaction.reply({ content: 'You must be in the same voice channel as me to use this button', ephemeral: true });
				return;
			}

			switch (interaction.customId) {
				case 'volumeDown':
					player.volume <= 0 ? player.setVolume(0) : player.setVolume(Math.round(player.volume * 100) - 10);
					await interaction.reply({ content: `Volume set to ${Math.round(player.volume * 100)}%` });

					break;
				case 'previous':
					if (player.queue.previous) {
						player.play(player.queue.previous);
						collector.stop();
						await interaction.reply({ content: 'Playing previous track' });
					} else {
						await interaction.reply({ content: 'There is no previous track', ephemeral: true });
					}

					break;
				case 'pausePlay':
					player.pause(!player.paused);
					await interaction.message.edit({ components: this.makeRow(player) });
					await interaction.reply({ content: `${player.paused ? 'Paused' : 'Resumed'} playback` });

					break;
				case 'next':
					player.skip();
					collector.stop();
					await interaction.reply({ content: 'Skipping track' });

					break;
				case 'volumeUp':
					player.volume >= 1 ? player.setVolume(1) : player.setVolume(Math.round(player.volume * 100) + 10);
					await interaction.reply({ content: `Volume set to ${Math.round(player.volume * 100)}%` });

					break;
				case 'seekBackwards':
					const { position } = await player.seek(player.position - 10000);
					await interaction.reply({ content: `Seeked to ${formatTime(Math.round(position - 10000))}` });

					break;
				case 'loop':
					if (player.loop === 'none') await player.setLoop('track');
					else if (player.loop === 'track') await player.setLoop('queue');
					else await player.setLoop('none');

					interaction.message.edit({ components: this.makeRow(player) });
					await interaction.reply({
						content: `${player.loop === 'none' ? 'Loop disabled' : player.loop === 'track' ? 'Track loop enabled' : 'Queue loop enabled'}`
					});

					break;
				case 'stop':
					player.destroy();
					collector.stop();
					await interaction.reply({ content: 'Stopped playback' });

					break;
				case 'lyrics':
					await interaction.deferReply({ ephemeral: true });
					const results = await this.container.lyrics.songs.search(`${track.author} ${track.title}`);
					if (!results || !results.length) {
						await interaction.editReply({ content: 'No lyrics found' });
						return;
					}

					const firstResult = results[0];
					const lyrics = await firstResult.lyrics();

					const embed = new EmbedBuilder()
						.setTitle(`Lyrics for ${firstResult.title} by ${firstResult.artist.name} `)
						.setURL(firstResult.url)
						.setThumbnail(track.thumbnail || null)
						.setAuthor({ name: requester.username, iconURL: requester.displayAvatarURL() })
						.setDescription(lyrics)
						.setFooter({ text: `Powered by Genuis. Please note that not all lyrics or searches will be accurate` })
						.setColor(process.env.EMBED_COLOUR as ColorResolvable);

					await interaction.editReply({ embeds: [embed] });

					break;
				case 'seekForwards':
					const { position: newPosition } = await player.seek(player.position + 10000);
					await interaction.reply({ content: `Seeked to ${formatTime(Math.round(newPosition + 10000))}` });

					break;
			}
		});

		collector.on('end', async () => {
			const message = player.data.get('message') as Message;

			if (message) {
				await message.edit({ components: [] });
			}
		});
	}
}
