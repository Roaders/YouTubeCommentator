

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

		// Properties

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

	}

}
