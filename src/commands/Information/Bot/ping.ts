import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { MiyuCommand } from '../../../lib/structures/Command';
import type Discord from 'discord.js';
import { codeBlock } from '@sapphire/utilities';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Displays the bot and API latency',
	fullCategory: ['Information'],
	usage: '>ping',
	examples: ['>ping']
})
export class PingCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	private async sendPing(interaction: Command.ChatInputCommandInteraction) {
		const initialEmbed = new EmbedBuilder().setDescription('Pinging...').setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable);

		const pingMessage = await interaction.reply({ embeds: [initialEmbed], fetchReply: true });

		const finalEmbed = new EmbedBuilder()
			.addFields(
				{
					name: 'Bot Latency',
					value: `${codeBlock('ini', `[ ${this.container.client.ws.ping}ms ]`)}`,
					inline: true
				},
				{
					name: 'API Latency',
					value: `${codeBlock('ini', `[ ${pingMessage.createdTimestamp - interaction.createdTimestamp}ms ]`)}`,
					inline: true
				}
			)
			.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable);

		return interaction.editReply({
			embeds: [finalEmbed]
		});
	}
}
