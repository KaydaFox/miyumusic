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
				);
		});
	}

	public async messageRun(message: Message, args: Args) {
		const song = await args.rest('string').catch(() => '');
		const engine = 'youtube';
		return this.play(message, song, engine);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const song = interaction.options.getString('song') ?? '';
		const engine = interaction.options.getString('engine') ?? 'youtube';
		await interaction.deferReply();
		return this.play(interaction, song, engine);
	}

	private async play(interactionOrMessage: Message | Command.ChatInputCommandInteraction, song: string, engine: string) {
		const kazagumo = this.container.kazagumo;
		const voiceChannel = interactionOrMessage.member instanceof GuildMember ? interactionOrMessage.member.voice.channel : null;

		if (!song) interactionOrMessage.reply({ content: 'Please provide a song to play', ephemeral: true });

		if (!voiceChannel)
			return interactionOrMessage instanceof Message
				? interactionOrMessage.reply({ content: 'You need to be in a voice channel to play music!' })
				: interactionOrMessage.editReply({ content: 'You need to be in a voice channel to play music!' });

		if (!voiceChannel.joinable)
			return interactionOrMessage.reply({
				content: 'I cannot join your voice channel, make sure I have the proper permissions!',
				ephemeral: true
			});

		const guildSettings = await this.container.db.guild.findUnique({ where: { guildId: interactionOrMessage.guildId ?? '' } });

		let player =
			kazagumo.players.get(interactionOrMessage.guildId as string) ||
			(await kazagumo.createPlayer({
				guildId: interactionOrMessage.guildId ?? '',
				voiceId: voiceChannel.id,
				textId: guildSettings?.bindToVC ? voiceChannel.id : interactionOrMessage.channelId,
				volume: guildSettings?.volume ? guildSettings.volume : 40,
				deaf: true
			}));

		const requester = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

		let result = await kazagumo.search(song, { requester: requester, engine: engine });

		if (!result || !result.tracks.length) {
			if (interactionOrMessage instanceof Message) return interactionOrMessage.reply({ content: 'No results found' });
			else return interactionOrMessage.editReply({ content: 'No results found' });
		}

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

		if (interactionOrMessage instanceof Message) return interactionOrMessage.reply({ embeds: [embed] });
		else return interactionOrMessage.editReply({ embeds: [embed] });
	}
}
