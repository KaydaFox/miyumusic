import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Find lyrics for the current song or a song you specify',
	fullCategory: ['Music'],
	usage: '+lyrics [song name]',
	examples: ['+lyrics', '+lyrics the legend of the black shawarma'],
	preconditions: ['GuildOnly']
})
export class LyricsCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('song').setDescription('The song to find lyrics for').setRequired(false))
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		return this.lyrics(interaction);
	}

	private async lyrics(interaction: Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;
		const player = (await kazagumo.players.get(interaction.guildId!)) ?? null;
		const song = interaction.options.getString('song', false) || player?.queue.current?.title + ' ' + player?.queue.current?.author || null;
		if (!song || song === 'undefined undefined') return interaction.editReply({ content: 'Please specify a song to find lyrics for' });

		try {
			const results = await this.container.lyrics.songs.search(song);
			if (!results || !results.length) return interaction.editReply({ content: 'No results found' });

			const firstResult = results[0];
			const lyrics = await firstResult.lyrics();

			const embed = new EmbedBuilder()
				.setTitle(`Lyrics for ${firstResult.title} by ${firstResult.artist.name}`)
				.setURL(firstResult.url)
				.setDescription(lyrics)
				.setThumbnail(firstResult.thumbnail)
				.setFooter({ text: `Powered by Genius. Please note: not all lyrics or searches are accurate.` })
				.setColor(this.container.embedColor)
				.setTimestamp();

			return interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			return interaction.editReply({ content: 'An error occurred while trying to find lyrics' });
		}
	}
}
