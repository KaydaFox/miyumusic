import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Show and change the volume of the player',
	aliases: ['vol'],
	fullCategory: ['Music'],
	usage: '>volule [number]',
	examples: ['>volume', '>volume 50'],
	preconditions: ['GuildOnly']
})
export class VolumeCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) =>
					option.setName('volume').setDescription('The volume to set the player to').setMaxValue(100).setMinValue(0)
				)
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'This command can only be used in a server', ephemeral: true });
		const volume = interaction.options.getInteger('volume') ?? null;
		if (!volume) {
			return this.sendVolume(interaction);
		}
		return this.setVolume(interaction, volume);
	}

	private async sendVolume(interaction: Command.ChatInputCommandInteraction) {
		const kazagumo = this.container.kazagumo;
		const player = await kazagumo.players.get(interaction.guildId!);
		if (!player) return interaction.reply({ content: 'There is no player in this guild', ephemeral: true });

		const embed = new EmbedBuilder()
			.setTitle('Volume')
			.setDescription(`The current volume is ${player.volume * 100}%`)
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
			.setColor(this.container.embedColor);

		return interaction.reply({ embeds: [embed] });
	}

	private async setVolume(interaction: Command.ChatInputCommandInteraction, volume: number) {
		const kazagumo = this.container.kazagumo;
		const player = await kazagumo.players.get(interaction.guildId!);
		if (!player) return interaction.reply({ content: 'There is no player in this guild', ephemeral: true });

		const member = (await interaction.guild?.members.fetch(interaction.user.id)) ?? null;
		if (!member || member.voice.channelId !== player.voiceId)
			return interaction.reply({ content: 'Please join my voice channel first', ephemeral: true });

		player.setVolume(volume);

		const embed = new EmbedBuilder()
			.setTitle('Volume')
			.setDescription(`The current volume is ${player.volume * 100}%`)
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
			.setColor(this.container.embedColor);

		return interaction.reply({ embeds: [embed] });
	}
}
