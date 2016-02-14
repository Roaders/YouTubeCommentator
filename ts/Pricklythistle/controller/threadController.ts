

module Pricklythistle.Controller {

	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	export class ThreadController extends ReplyController {

		// Constructor

		constructor(
			private _thread: ICommentThread,
			private $filter: ng.IFilterService,
			$rootScope: ng.IScope
			) {

			super( _thread.snippet.topLevelComment, $rootScope );

			this.updateReplies();
		}

		// Private Variables


		private _allReplies: ReplyController[];

		// Properties

		get buttonText() : string {
			if( this._allReplies && this._allReplies.length > 1 ){
				if( this._allRepliesShown ){
					return "Hide Replies"
				} else {
					return `Show ${this._allReplies.length - 1} additional replies`
				}
			} else {
				return undefined;
			}
		}

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
			return this._thread ? "https://www.youtube.com/watch?v=" + this._thread.snippet.videoId + "&google_comment_id=" + this._thread.id : undefined;
		}

		private _latestReply: Date;

		get latestReply(): Date {
			return this._latestReply;
		}

		private _replies: ReplyController[];

		get replies(): ReplyController[] {
			return this._replies;
		}

		private _allRepliesShown: boolean = false;

		get allRepliesShown(): boolean {
			return this._allRepliesShown;
		}

		// Public Functions

		toggleReplyDisplay(): void {
			if ( this._allReplies && this._allReplies.length > 1 ){
				this._allRepliesShown = !this._allRepliesShown;
			} else {
				this._allRepliesShown = false;
			}

			this.updateReplyDisplay();
		}

		// Private Functions

		private updateReplyDisplay(): void {
			if(this._allRepliesShown) {
				this._replies = this._allReplies;
			} else {
				this._replies = this._allReplies ? [this._allReplies[ this._allReplies.length - 1 ]] : undefined;

				if(this._allReplies) {
					this._allReplies.forEach(replyController => {
					    replyController.deSelect();
					});
				}
			}

		}

		private updateReplies() : void {
			console.log( `update replies` );
			this._latestReply = this.findLatestReply();
			this._allReplies = this._thread.replies ? this._thread.replies.comments.map( reply => new ReplyController( reply, this._rootScope ) ) : undefined;
			this._allReplies = this.$filter( 'orderBy' )(this._allReplies, 'publishedAt');

			console.log( `latest reply: ${this.latestReply}` );

			this.updateReplyDisplay();
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
