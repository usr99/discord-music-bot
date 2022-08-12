import { Video } from "youtube-sr"

interface SpotifyResponse {
	id: string,
	name: string,
	external_urls: {
		spotify: string
	},
	artists: {
		name: string	
	}[]
}

export interface SpotifyTrack extends SpotifyResponse {
	duration_ms: number
}

export interface SpotifyAlbum extends SpotifyResponse {
	tracks: SpotifyTrack[]
}

export class Metadata {
	private constructor(
		public url: string,
		public title?: string,
		public artist?: string,
		public thumbnail?: string,
		public duration?: number
	) {}

	static from(youtube: Video, spotify?: SpotifyTrack) {
		if (spotify) {
			return new Metadata(
				youtube.url,
				spotify.name,
				spotify.artists.map(artist => { return artist.name; }).join(' & '),
				youtube.thumbnail?.url,
				youtube.duration
			);
		} else {
			return new Metadata(
				youtube.url,
				youtube.title,
				youtube.channel?.name,
				youtube.thumbnail?.url,
				youtube.duration
			);
		}
	}
}
