import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { GuildMember, EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';
import type Discord from 'discord.js';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Joins the voice channel you are in',
	fullCategory: ['Music'],
	usage: '>join',
	examples: ['>join'],
	preconditions: ['GuildOnly']
})
export class JoinCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			dmPermission: false
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.join(interaction);
	}

	private async join(interaction: Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;

		const voiceChannel = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;

		if (!voiceChannel) return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
		if (!voiceChannel.joinable)
			return interaction.reply({
				content: 'I cannot join your voice channel, make sure I have the proper permissions!',
				ephemeral: true
			});

		const guildSettings = await this.container.db.guild.findUnique({ where: { guildId: interaction.guildId ?? '' } });

		let player = kazagumo.players.get(interaction.guildId as string);

		if (player) interaction.reply({ content: 'I am already in a voice channel!', ephemeral: true });

		await interaction.deferReply();

		player = await kazagumo.createPlayer({
			guildId: interaction.guildId ?? '',
			voiceId: voiceChannel.id,
			textId: guildSettings?.bindToVC ? voiceChannel.id : interaction.channelId,
			volume: guildSettings?.volume ? guildSettings.volume : 40,
			deaf: true
		});
		const requester = interaction.user;

		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setDescription(`Joined ${voiceChannel} and bound to ${guildSettings?.bindToVC ? voiceChannel : interaction.channel}!`)
					.setAuthor({ name: requester.tag, iconURL: requester.displayAvatarURL() })
					.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			]
		});
	}
}
