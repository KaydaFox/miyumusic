import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message, GuildMember, EmbedBuilder } from 'discord.js';
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
			description: this.description
		});
	}

	public async messageRun(message: Message) {
		return this.join(message);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.join(interaction);
	}

	private async join(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;

		const voiceChannel = interactionOrMessage.member instanceof GuildMember ? interactionOrMessage.member.voice.channel : null;

		if (!voiceChannel) return interactionOrMessage.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
		if (!voiceChannel.joinable)
			return interactionOrMessage.reply({
				content: 'I cannot join your voice channel, make sure I have the proper permissions!',
				ephemeral: true
			});

		const guildSettings = await this.container.db.guild.findUnique({ where: { guildId: interactionOrMessage.guildId ?? '' } });

		let player = kazagumo.players.get(interactionOrMessage.guildId as string);

		if (player) interactionOrMessage.reply({ content: 'I am already in a voice channel!', ephemeral: true });

		player = await kazagumo.createPlayer({
			guildId: interactionOrMessage.guildId ?? '',
			voiceId: voiceChannel.id,
			textId: guildSettings?.bindToVC ? voiceChannel.id : interactionOrMessage.channelId,
			volume: guildSettings?.volume ? guildSettings.volume : 40,
			deaf: true
		});
		const requester = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

		return interactionOrMessage.reply({
			embeds: [
				new EmbedBuilder()
					.setDescription(`Joined ${voiceChannel} and bound to ${guildSettings?.bindToVC ? voiceChannel : interactionOrMessage.channel}!`)
					.setAuthor({ name: requester.tag, iconURL: requester.displayAvatarURL() })
					.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			]
		});
	}
}
