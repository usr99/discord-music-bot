import { ColorResolvable, Embed, EmbedBuilder } from "discord.js";
import { Metadata, SpotifyAlbum } from "./types";

const EmbedColor: ColorResolvable = [45, 125, 70]; // medium green

const formatArtistNames = (array: { name: string, id?: string }[]) => {
    return array.map(artist => {
        return artist.name;
    }).join(' & ');
}

class MyEmbeds {
	private inner: EmbedBuilder;
    
    constructor(options: any) {
		this.inner = EmbedBuilder.from(options);
        this.inner.setColor(EmbedColor);
	}

    toMessage = () => {
        return { embeds: [this.inner.data] };
    }
}

class AddMusicEmbed extends MyEmbeds {
    constructor(music: Metadata) {
        super({
            title: 'Adding to queue...',
            thumbnail: { url: music.thumbnail || "none" },
            fields: [
                { name: 'Title', value: music.title || "unknown", inline: true },
                { name: 'Artist', value: music.artist || "unknown", inline: true },
            ],
        });
    }
}

class AddAlbumEmbed extends MyEmbeds {
    constructor(album: SpotifyAlbum) {
        super({
            title: 'Adding to queue...',
            thumbnail: { url: album.images[0].url },
            fields: [
                { name: 'Album', value: album.name, inline: true },
                { name: 'Artist', value: formatArtistNames(album.artists), inline: true },
            ],
        });
    }
}

class NowPlayingEmbed extends MyEmbeds {
    constructor(info: {
        music: Metadata,
        queue: number
    }) {

        let secondsLeft = (info.music.duration || 0) / 1000 ; // we got duration as ms
        let durationMessage = '';
        let isFirstValue = true;
        let timeFactor: [number, string][] = [
            [3600, 'hour'],
            [60, 'minute'],
            [1, 'second']
        ];

        // build the string to represent the music duration
        for (let time of timeFactor) {
            const duration = Math.floor(secondsLeft / time[0]);
            secondsLeft = secondsLeft % time[0];

            if (duration) { // do not show null values

                // add grammatical sugar
                if (!isFirstValue) {
                    if (!secondsLeft) {
                        durationMessage += ' and ';
                    } else {
                        durationMessage += ', ';
                    }
                }

                // concatenate current value to the old message
                durationMessage += `${duration} ${time[1]}${duration > 1 ? 's' : ''}`;
                isFirstValue = false;
            }
        }

        super({
            title: 'Now playing...',
            thumbnail: { url: info.music.thumbnail || "none" },
            description: `Enjoy the next ${durationMessage} listening to...`,
            fields: [
                { name: 'Title', value: info.music.title, inline: true },
                { name: 'Artist', value: info.music.artist || "unknown", inline: true },
                { name: 'Queue size', value: `${info.queue}`, inline: true },
            ]
        });
    }
}

class ErrorEmbed {
	private inner: EmbedBuilder;
    
	constructor(message: string) {
		this.inner = EmbedBuilder.from({
            title: 'Something went wrong...',
            description: message
		});
        this.inner.setColor('DarkRed');
    }

    toMessage = () => {
        return { embeds: [this.inner.data] };
    }	
}

export { AddMusicEmbed, AddAlbumEmbed, NowPlayingEmbed, ErrorEmbed };
