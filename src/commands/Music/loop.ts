import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ColorResolvable, EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Set the players loop mode',
	fullCategory: ['Music'],
	usage: '+loop <mode>',
	examples: ['+loop', '+loop track'],
	preconditions: ['GuildOnly']
})
export class LoopCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('loop').setDescription('The loop mode to set the player to').addChoices(
						{
							name: 'Off',
							value: 'none'
						},
						{
							name: 'Track',
							value: 'track'
						},
						{
							name: 'Queue',
							value: 'queue'
						}
					)
				)
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.setLoop(interaction);
	}

	private async setLoop(interaction: Command.ChatInputCommandInteraction) {
		const player = (await this.container.kazagumo.players.get(interaction.guildId!)) ?? null;
		if (!player) return interaction.reply({ content: 'There is no player in this guild', ephemeral: true });

		let embed: EmbedBuilder;

		const loopChoice = interaction.options.getString('loop') ?? null;
		if (!loopChoice) {
			embed = new EmbedBuilder()
				.setTitle('Loop')
				.setDescription(`The current loop mode is set to ${player.loop ?? 'none'}`)
				.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
				.setColor(process.env.EMBED_COLOUR as ColorResolvable);
		} else {
			player.setLoop(loopChoice as 'none' | 'track' | 'queue');
			embed = new EmbedBuilder()
				.setTitle('Loop')
				.setDescription(`Set the loop mode to ${player.loop}`)
				.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() ?? undefined })
				.setColor(process.env.EMBED_COLOUR as ColorResolvable);
		}

		return interaction.reply({ embeds: [embed] });
	}
}
