import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import type { TextChannel, VoiceChannel } from 'discord.js';
import { Events, KazagumoPlayer } from 'kazagumo';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerException
})
export class PlayerExceptionListener extends Listener<typeof Events.PlayerException> {
	public async run(player: KazagumoPlayer, data: any) {
		const textChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;
		if (!textChannel) return;

		console.log(data); //temporary, atleast until i know some things that `data` could be

		return textChannel.send('An error occurred while playing this song');
	}
}
