import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember, Message } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';
import type Discord from 'discord.js';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Play a song in the voice channel you are in',
	fullCategory: ['Music'],
	usage: '>play <song>',
	examples: ['>play the legend of the black shawarma'],
	preconditions: ['GuildOnly']
})
export class PlayCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('song').setDescription('The song you want to play').setRequired(true))
				.addStringOption((option) =>
					option
						.setName('engine')
						.setDescription('The search engine to use')
						.setRequired(false)
						.addChoices(
							{ name: 'YouTube', value: 'youtube' },
							{ name: 'SoundCloud', value: 'soundcloud' },
							{ name: 'Spotify', value: 'spotify' }
						)
				)
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const song = interaction.options.getString('song') ?? '';
		const engine = interaction.options.getString('engine') ?? 'youtube';
		return this.play(interaction, song, engine);
	}

	private async play(interaction: Command.ChatInputCommandInteraction, song: string, engine: string) {
		const kazagumo = this.container.kazagumo;
		const voiceChannel = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;

		if (!song) return interaction.reply({ content: 'Please provide a song to play', ephemeral: true });

		if (!voiceChannel) return interaction.reply({ content: 'You need to be in a voice channel to play music!' });

		if (!voiceChannel.joinable)
			return interaction.reply({
				content: 'I cannot join your voice channel, make sure I have the proper permissions!',
				ephemeral: true
			});

		await interaction.deferReply();

		const guildSettings = await this.container.db.guild.findUnique({ where: { guildId: interaction.guildId ?? '' } });

		let player =
			kazagumo.players.get(interaction.guildId as string) ||
			(await kazagumo.createPlayer({
				guildId: interaction.guildId ?? '',
				voiceId: voiceChannel.id,
				textId: guildSettings?.bindToVC ? voiceChannel.id : interaction.channelId,
				volume: guildSettings?.volume ? guildSettings.volume : 40,
				deaf: true
			}));

		const requester = interaction.user;

		let result = await kazagumo.search(song, { requester: requester, engine: engine });

		if (!result || !result.tracks.length) return interaction.editReply({ content: 'No results found' });

		if (result.type === 'PLAYLIST') for (let track of result.tracks) player.queue.add(track);
		else player.queue.add(result.tracks[0]);

		if (!player.playing && !player.paused) player.play();

		const embed = new EmbedBuilder()
			.setTitle(`Queued ${result.type === 'PLAYLIST' ? 'playlist' : 'song'}`)
			.setThumbnail(result.tracks[0].thumbnail || null)
			.setDescription(
				result.type === 'PLAYLIST'
					? `${result.tracks.length} from ${result.playlistName || 'Unknown name'}`
					: `[${result.tracks[0].title} by ${result.tracks[0].author}](${result.tracks[0].uri})`
			)
			.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			.setTimestamp()
			.setFooter({ text: `Requested by ${requester.tag}`, iconURL: requester.displayAvatarURL() });

		return interaction.editReply({ embeds: [embed] });
	}
}
