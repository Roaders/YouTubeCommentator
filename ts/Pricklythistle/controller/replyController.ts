
/// <reference path="../util/dateUtil.ts"/>

module Pricklythistle.Controller {

	import IComment = Google.Services.IComment;
	import DateUtil = Util.DateUtil;

	export class ReplyController {

		// Constructor

		constructor( private _comment: IComment, $rootScope: ng.IScope ) {
			this._rootScope = $rootScope;
		}

		// Private Variables
		private _initialReplyText: string;
		protected _rootScope: ng.IScope

		// Properties

		replyText: string;

		private _replyPostError: string;

		get replyPostError(): string {
			return this._replyPostError;
		}

		private _waitingForReplyResponse: boolean;

		get waitingForReplyResponse(): boolean {
			return this._waitingForReplyResponse;
		}

		get replyEnabled(): boolean {
			return this.replyText !== this._initialReplyText && this.replyText && this.replyText != ""
		}

		private _isSelected: boolean;

		get isSelected() : boolean {
			return this._isSelected;
		}

		get comment() : IComment {
			return this._comment;
		}

		set comment(value: IComment) {
			this._comment = value;
		}

		get authorProfileImageUrl(): string {
			return this._comment ? this._comment.snippet.authorProfileImageUrl : undefined;
		}

		get authorDisplayName(): string {
			return this._comment ? this._comment.snippet.authorDisplayName : undefined;
		}

		get authorChannelUrl(): string {
			return this._comment ? this._comment.snippet.authorChannelUrl : undefined;
		}

		get publishedAt(): Date {
			return this._comment ? this._comment.snippet.publishedAt : undefined;
		}

		get publishedAtDisplay(): string {
			const publishDate: Date = this._comment ? this._comment.snippet.publishedAt : undefined;
			return DateUtil.formatHowLongAgo(publishDate);
		}

		get textDisplay(): string {
			return this._comment ? this._comment.snippet.textDisplay : undefined;
		}

		// Public Functions

		waitForReplyResponse( responseStream: Rx.Observable<any> ): void {
			this._waitingForReplyResponse = true;
			this._replyPostError = null;

			responseStream
				.safeApply( this._rootScope,
					_ => {
						console.log( "reply posted, closing reply form" );
						this._waitingForReplyResponse = false;
						this.deSelect();
					},
					error => {
						console.log( `reply post error: ${error}` );
						this._replyPostError = "";

						error.result.error.errors.forEach(currentError => {
							if( this._replyPostError != "" ){
								this._replyPostError += "<br />";
							}
						    this._replyPostError += currentError.message + "</p>";
						});
						this._waitingForReplyResponse = false;
					}
				)
				.subscribe();
		}

		deSelect(): void {
			this._isSelected = false;
			this._initialReplyText = this.replyText = "";
		}

		toggleSelection(): void {
			this._isSelected = !this._isSelected;

			if( this._isSelected ) {
				this._initialReplyText = this.replyText = "+" + this.authorDisplayName + " ";
				this._replyPostError = null;
			} else {
				this.deSelect();
				this._replyPostError = null;
			}
		}

	}

}
