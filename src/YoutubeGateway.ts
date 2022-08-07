import axios, { AxiosError } from "axios";
import { parse, toSeconds } from "iso8601-duration";
import ytdl from "ytdl-core";
import config from "./config";
import { Track, TrackInfo, YoutubeSearchResponse, YoutubeVideoResource } from "./types";
import { logError } from "./utils";

export default class YoutubeGateway {
	public async downloadVideo(info: TrackInfo): Promise<Track> {
		try {
			const buffer = await ytdl(info.url, { filter: 'audioonly' });
			return { buffer, info };
		} catch(err) {
			logError(err as AxiosError);
			throw new Error(`Failed to download ${info.title}`);
		}
	}

	public async fetchVideo(query: string): Promise<TrackInfo> {
		const response = await this.search(query);
		let track = new TrackInfo(response);
		track.duration = await this.getVideoDuration(response.id.videoId);
		return track;
	}

	private async search(query: string): Promise<YoutubeSearchResponse> {
		try {
			const response = await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
				params: {
					q: query,
					part: 'snippet',
					type: 'video',
					maxResults: 1,
					key: config.YOUTUBE_API_KEY
				}
			});
			return response.data.items.at(0);
		} catch (err) {
			logError(err as AxiosError);
			throw new Error('Search request to Youtube services failed');
		}
	}

	private async getVideoDuration(videoId: string): Promise<number> {
		try {
			const response = await axios.get('https://youtube.googleapis.com/youtube/v3/videos', {
				params: {
					id: videoId,
					part: 'contentDetails',
					key: config.YOUTUBE_API_KEY
				}
			});
			const video = response.data.items.at(0) as YoutubeVideoResource;
			return toSeconds(parse(video.contentDetails.duration));
		} catch (err) {
			logError(err as AxiosError);
			throw new Error('Failed to retrieve video information');
		}
	}

	private constructor() {}
	public static getInstance(): YoutubeGateway {
		if (!YoutubeGateway.instance) {
			YoutubeGateway.instance = new YoutubeGateway();
		}
		return YoutubeGateway.instance;
	}
	private static instance: YoutubeGateway;
}
