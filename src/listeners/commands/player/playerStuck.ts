import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import type { TextChannel, VoiceChannel } from 'discord.js';
import { Events, KazagumoPlayer } from 'kazagumo';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerStuck
})
export class PlayerStuckListener extends Listener<typeof Events.PlayerStuck> {
	public async run(player: KazagumoPlayer, data: any) {
		const textChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;
		if (!textChannel) return;

		console.log(data); // temporary, atleast until i know some things that `data` could be

		return textChannel.send("I'm sorry, but it seems like this song is stuck. Please try playing it again");
	}
}
