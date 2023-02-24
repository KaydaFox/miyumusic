import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, GuildMember } from 'discord.js';
import formatTime from '../../lib/formatTime';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Search for some songs',
	fullCategory: ['Music'],
	usage: '>search <query>',
	examples: ['>search never gonna give you up']
})
export default class SearchCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('song').setDescription('The song to search for').setRequired(true))
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.search(interaction);
	}

	private makeButtonRow(amount: number) {
		const mainRow = new ActionRowBuilder<ButtonBuilder>();
		const secondRow = new ActionRowBuilder<ButtonBuilder>();

		for (let i = 0; i < amount; i++) {
			if (i < 5) {
				mainRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`search-${i}`)
						.setLabel(`${i + 1}`)
						.setStyle(ButtonStyle.Primary)
				);
			} else {
				secondRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`search-${i}`)
						.setLabel(`${i + 1}`)
						.setStyle(ButtonStyle.Primary)
				);
			}
		}

		if (amount > 5) return [mainRow, secondRow];
		else return [mainRow];
	}

	private async search(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const song = interaction.options.getString('song');
		if (!song) return interaction.editReply({ content: 'Please provide a query' });

		const voiceChannel = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;
		if (!voiceChannel) return interaction.editReply({ content: 'You need to be in a voice channel to search for songs' });

		const { kazagumo } = this.container;

		let result = await kazagumo.search(song, { requester: interaction.user });
		if (!result || !result.tracks.length) return interaction.editReply({ content: 'No results found' });

		const guildSettings = await this.container.db.guild.findUnique({
			where: { guildId: interaction.guildId as string }
		});

		const embed = new EmbedBuilder().setTitle('Search results').setTimestamp().setColor(this.container.embedColor);

		result.tracks.forEach((track, index) => {
			embed.addFields({
				name: `${index + 1}`,
				value: `[${track.title} by ${track.author}](${track.uri})\n${formatTime(track.length ?? 0)} on ${track.sourceName}`
			});
		});

		const buttonRows = this.makeButtonRow(result.tracks.length);

		const initialMessage = await interaction.editReply({
			embeds: [embed],
			components: buttonRows
		});

		const listener = initialMessage.createMessageComponentCollector({
			time: 60000
		});

		listener.on('collect', async (ButtonInteraction: ButtonInteraction) => {
			// if (ButtonInteraction.user.id !== interaction.user.id) return ButtonInteraction.reply({ content: 'You can\'t use this button', ephemeral: true });
			const songIndex = parseInt(ButtonInteraction.customId.split('-')[1]);

			const track = result.tracks[songIndex];

			let player =
				kazagumo.players.get(interaction.guildId as string) ||
				(await kazagumo.createPlayer({
					guildId: interaction.guildId as string,
					voiceId: voiceChannel.id,
					textId: guildSettings?.bindToVC ? voiceChannel.id : (interaction.channelId as string),
					volume: guildSettings?.volume ?? 100,
					deaf: true
				}));

			player.queue.add(track);
			if (!player.playing && !player.paused) player.play();

			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Added to queue')
						.setDescription(
							`[${track.title} by ${track.author}](${track.uri})\n${formatTime(track.length ?? 0)} from ${track.sourceName}`
						)
						.setTimestamp()
						.setThumbnail(track.thumbnail || null)
						.setColor(this.container.embedColor)
				]
			});

			await interaction.followUp({ content: `Added ${track.title} to the queue`, ephemeral: true });

			return listener.stop();
		});

		return listener.on('end', () => {
			initialMessage.edit({ components: [] });
		});
	}
}
