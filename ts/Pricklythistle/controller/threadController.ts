

module Pricklythistle.Controller {

	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	export class ThreadController extends ReplyController {

		// Private Variables

		private thread: ICommentThread;

		// Properties

		get videoImageUrl(): string {
			return this.thread ? "https://i.ytimg.com/vi/" + this.thread.snippet.videoId + "/mqdefault.jpg" : undefined;
		}

		get videoUrl(): string {
			return this.thread ? "https://www.youtube.com/watch?v=" + this.thread.snippet.videoId : undefined;
		}

		private _latestReply: Date;

		get latestReply(): Date {
			return this._latestReply;
		}

		// Public Functions

		init( thread: IComment ) {
			this.thread = <any>thread;
			super.init( this.thread.snippet.topLevelComment );

			this._latestReply = this.findLatestReply();
		}

		// Private Functions

		private findLatestReply(): Date {
			var latestReply = this.publishedAt;

			latestReply = this.findLatest( latestReply, this.thread.replies.comments );

			return latestReply;
		}

		private findLatest( currentDate: Date, replies: IComment[] ): Date {

			if( !replies || replies.length == 0 ){
				return currentDate;
			}

			var firstReplyNewer: boolean = currentDate.getTime() < replies[0].snippet.publishedAt.getTime();
			currentDate = firstReplyNewer ? replies[0].snippet.publishedAt : currentDate;

			return this.findLatest( currentDate, replies.slice(1) );
		}

	}

}
