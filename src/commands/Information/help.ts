import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Get help for commands',
	fullCategory: ['Information'],
	usage: '>help [command]',
	examples: ['>help', '>help play']
})
export class HelpCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('command').setDescription('The command to get help for').setRequired(false).setAutocomplete(true)
				);
		});
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		const search = interaction.options.getString('command');
		if (!search) return;

		const commands = this.container.stores
			.get('commands')
			.filter((command) => command.enabled && !command.fullCategory.includes('Owner') && !command.fullCategory.includes('General'));
		const commandNames = commands.map((command) => command.name);
		const filtered = commandNames.filter((command) => command.toLowerCase().includes(search.toLowerCase()));

		return interaction.respond(filtered.map((command) => ({ name: command, value: command })));
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const commandName = interaction.options.getString('command', false);
		if (!commandName) return this.sendHelp(interaction);

		return this.sendCommandHelp(interaction, commandName);
	}

	private async sendHelp(interaction: Command.ChatInputCommandInteraction) {
		const embed = new EmbedBuilder().setTitle('Help').setDescription('Get help for commands').setColor(this.container.embedColor);

		const commands = this.container.stores.get('commands').filter((command) => command.enabled && !command.fullCategory.includes('Owner'));
		for (const category of this.container.stores.get('commands').categories) {
			const categoryCommands = commands.filter((command) => command.fullCategory.includes(category));
			if (categoryCommands.size === 0) continue;

			embed.addFields({ name: category, value: categoryCommands.map((command) => `\`${command.name}\``).join(', ') });
		}

		return interaction.reply({ embeds: [embed] });
	}

	private async sendCommandHelp(interaction: Command.ChatInputCommandInteraction, commandName: string) {
		const commands = this.container.stores.get('commands').filter((command) => command.enabled && !command.fullCategory.includes('Owner'));
		const command = commands.find((command) => command.name === commandName) as MiyuCommand | undefined;
		if (!command) return interaction.reply({ content: 'Command not found', ephemeral: true });

		const embed = new EmbedBuilder()
			.setTitle(`Help for ${command.name}`)
			.setDescription(command.description || 'No description provided')
			.setColor(this.container.embedColor)
			.addFields(
				{
					name: 'Usage',
					value: command.options.usage || 'No usage provided',
					inline: true
				},
				{
					name: 'Examples',
					value: command.options.examples.join('\n') || 'None provided',
					inline: true
				}
			);

		return interaction.reply({ embeds: [embed] });
	}
}
