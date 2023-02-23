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
export class LeaveCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			dmPermission: false
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.leave(interaction);
	}

	private async leave(interaction: Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this server', ephemeral: true });

		const voiceChannel = interaction.member instanceof GuildMember ? interaction.member.voice.channel : null;
		if (!voiceChannel) return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
		if (!voiceChannel.joinable)
			return interaction.reply({
				content: 'I cannot join your voice channel, make sure I have the proper permissions!',
				ephemeral: true
			});

		player.destroy();
		const requester = interaction.user;
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setDescription(`Left ${voiceChannel}!`)
					.setAuthor({ name: requester.tag, iconURL: requester.displayAvatarURL() })
					.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			]
		});
	}
}
