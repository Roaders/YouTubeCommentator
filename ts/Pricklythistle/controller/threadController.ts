

module Pricklythistle.Controller {

	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	export class ThreadController extends ReplyController {

		// Constructor

		constructor(
			private _thread: ICommentThread,
			private $filter: ng.IFilterService
			) {

			super( _thread.snippet.topLevelComment );

			this.updateReplies();
		}

		// Private Variables

		// Properties

		get thread(): ICommentThread {
			return this._thread;
		}

		set thread( value: ICommentThread ) {
			this._thread = value;

			this.comment = value.snippet.topLevelComment;
			this.updateReplies();
		}

		get videoImageUrl(): string {
			return this._thread ? "https://i.ytimg.com/vi/" + this._thread.snippet.videoId + "/mqdefault.jpg" : undefined;
		}

		get videoUrl(): string {
			return this._thread ? "https://www.youtube.com/watch?v=" + this._thread.snippet.videoId : undefined;
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

		private updateReplies() : void {
			this._latestReply = this.findLatestReply();
			this._replies = this._thread.replies ? this._thread.replies.comments.map( reply => new ReplyController( reply ) ) : undefined;
			this._replies = this.$filter( 'orderBy' )(this._replies, 'publishedAt');
		}

		private findLatestReply(): Date {
			var latestReply = this.publishedAt;

			latestReply = this.findLatest( latestReply, this._thread.replies ? this._thread.replies.comments : null );

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
