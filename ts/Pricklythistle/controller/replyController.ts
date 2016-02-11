

module Pricklythistle.Controller {

	import IComment = Google.Services.IComment;

	export class ReplyController {

		// Private Variables

		private comment: IComment;

		// Properties

		get authorProfileImageUrl(): string {
			return this.comment ? this.comment.snippet.authorProfileImageUrl : undefined;
		}

		get authorDisplayName(): string {
			return this.comment ? this.comment.snippet.authorDisplayName : undefined;
		}

		get authorChannelUrl(): string {
			return this.comment ? this.comment.snippet.authorChannelUrl : undefined;
		}

		get publishedAt(): Date {
			return this.comment ? this.comment.snippet.publishedAt : undefined;
		}

		get textDisplay(): string {
			return this.comment ? this.comment.snippet.textDisplay : undefined;
		}

		// Public Functions

		init( comment: IComment ) {
			this.comment = comment;
		}

	}

}
