

module Pricklythistle.Controller {

	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	export class ThreadController extends ReplyController {

		// Constructor

		constructor(
			private thread: ICommentThread,
			private $filter: ng.IFilterService
			) {
			super( thread.snippet.topLevelComment );

			this._latestReply = this.findLatestReply();
			this._replies = thread.replies.comments.map( reply => new ReplyController( reply ) );

			this._replies = this.$filter( 'orderBy' )(this._replies, 'publishedAt');
		}

		// Private Variables

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

		private _replies: ReplyController[];

		get replies(): ReplyController[] {
			return this._replies;
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
