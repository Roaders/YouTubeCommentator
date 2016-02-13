

module Pricklythistle.Controller {

	import IComment = Google.Services.IComment;
	import DateUtil = Util.DateUtil;

	export class ReplyController {

		// Constructor

		constructor( comment: IComment ) {
			this._comment = comment;
		}

		// Private Variables

		private _comment: IComment;
		private _initialReplyText: string;

		// Properties

		replyText: string;

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

		deSelect(): void {
			this._isSelected = false;
			this._initialReplyText = this.replyText = "";
		}

		toggleSelection(): void {
			this._isSelected = !this._isSelected;

			if( this._isSelected ) {
				this._initialReplyText = this.replyText = "+" + this.authorDisplayName + " ";
			} else {
				this.deSelect();
			}
		}

	}

}
