import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: "Use the VCs text channel as the bot's text channel",
	fullCategory: ['Config'],
	usage: '>bindtovc',
	examples: ['>bindtovc', '>bindtovc true'],
	preconditions: ['GuildOnly'],
	name: 'bindtovc',
	requiredUserPermissions: [PermissionFlagsBits.ManageGuild]
})
export default class BindToVcCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption((option) => option.setName('enabled').setDescription('Whether to enable or disable the feature').setRequired(false))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const setting = interaction.options.getBoolean('enabled') ?? null;
		if (setting === null) {
			return this.fetchSetting(interaction);
		} else return this.setSetting(interaction, setting);
	}

	private async fetchSetting(interaction: Command.ChatInputCommandInteraction) {
		const { guildId } = interaction;
		const guildSettings = await this.container.db.guild.findUnique({
			where: { guildId: guildId as string }
		});

		return interaction.reply({
			content: `The bind to VC setting is ${guildSettings?.bindToVC ? 'enabled' : 'disabled'}`
		});
	}

	private async setSetting(interaction: Command.ChatInputCommandInteraction, setting: boolean) {
		const { guildId } = interaction;
		const guildSettings = await this.container.db.guild.findUnique({
			where: { guildId: guildId as string }
		});

		if (!guildSettings) {
			await this.container.db.guild.create({
				data: {
					guildId: guildId as string,
					bindToVC: setting
				}
			});
		} else {
			await this.container.db.guild.update({
				where: { guildId: guildId as string },
				data: {
					bindToVC: setting
				}
			});
		}

		return interaction.reply({
			content: `The bind to VC setting is now ${setting ? 'enabled' : 'disabled'}`
		});
	}
}
