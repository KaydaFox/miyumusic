import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import { EmbedBuilder, TextChannel, VoiceChannel } from 'discord.js';
import { Events, KazagumoPlayer, KazagumoTrack } from 'kazagumo';
import type Discord from 'discord.js';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerResolveError
})
export class PlayerResolveErrorListener extends Listener<typeof Events.PlayerResolveError> {
	public async run(player: KazagumoPlayer, track: KazagumoTrack, message: string) {
		const textChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;
		if (!textChannel) return;

		return textChannel.send({
			embeds: [
				new EmbedBuilder()
					.setDescription(`An error occurred while playing ${track.title}!`)
					.addFields({ name: 'Error', value: message || 'Unknown reason' })
					.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			]
		});
	}
}
