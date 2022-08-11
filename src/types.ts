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
		public title: string,
		public artist: string,
		public url: string,
		public thumbnail: string,
		public duration: number
	) {}

	static from(youtube: Video, spotify: SpotifyTrack) {
		return new Metadata(
			spotify.name,
			spotify.artists.map(artist => { return artist.name; }).join(' & '),
			youtube.url,
			youtube.thumbnail?.url || 'undefined',
			youtube.duration
		);
	}
}
