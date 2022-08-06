import { Readable } from "stream"

export type SpotifySearchResponse = {
	id: string,
	name: string,
	external_urls: {
		spotify: string
	},
	artists: {
		name: string	
	}[],
	duration_ms: number
}

export type YoutubeSearchResponse = {
	id: {
		videoId: string
	},
	snippet: {
		title: string,
		channelTitle: string
	}
}

export type YoutubeVideoResource = {
	contentDetails: {
		duration: string
	}
}

class Info {
	public constructor(data: SpotifySearchResponse | YoutubeSearchResponse) {
		if (typeof(data.id) === 'string') { // info is from spotify
			const info = data as SpotifySearchResponse;
			this.id = info.id;
			this.title = info.name;
			this.url = info.external_urls.spotify;
			this.artists = [];
			for (let artist of info.artists) {
				this.artists.push(artist.name);
			}
		} else { // info is from youtube
			const info = data as YoutubeSearchResponse;
			this.id = info.id.videoId;
			this.title = info.snippet.title;
			this.url = `https://www.youtube.com/watch?v=${info.id.videoId}`;
			this.artists = [info.snippet.channelTitle];
		}
	}

	public id: string;
	public title: string;
	public artists: string[];
	public url: string;
}

export class TrackInfo extends Info {
	public constructor(info: SpotifySearchResponse | YoutubeSearchResponse) {
		super(info);
		if (typeof(info.id) === 'string') { // info is from spotify
			this.duration = (info as SpotifySearchResponse).duration_ms / 1000; // convert ms to seconds
		} else { // info is from youtube
			this.duration = 0;
		}
	}

	public duration: number;
}

export class AlbumInfo extends Info {
	public constructor(info: SpotifySearchResponse) {
		super(info);
		this.tracks = [];
	}

	public tracks: TrackInfo[];
}

export type Track = {
	buffer: Readable,
	info: TrackInfo
}