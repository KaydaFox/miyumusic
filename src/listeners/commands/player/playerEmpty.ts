import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import { EmbedBuilder, TextChannel, VoiceChannel } from 'discord.js';
import { Events, KazagumoPlayer } from 'kazagumo';
import type Discord from 'discord.js';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerEmpty
})
export class PlayerEmptyListener extends Listener<typeof Events.PlayerEmpty> {
	public async run(player: KazagumoPlayer) {
		const textChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;
		if (!textChannel) return;

		const embed = new EmbedBuilder()
			.setTitle('Queue Ended')
			.setDescription('The queue has ended')
			.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable);

		return textChannel.send({ embeds: [embed] });
	}
}
