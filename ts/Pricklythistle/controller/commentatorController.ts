/**
 * Created by Giles on 08/02/2016.
 */

module Pricklythistle.Controller {
	import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
	import YouTubeService = Google.Services.YouTubeService;
	import IUserInfo = Google.Services.IUserInfo;
	import ICommentThread = Google.Services.ICommentThread;

	export class CommentatorController {

		//  Constructor

		constructor(
			private youTubeService: YouTubeService,
			private $rootScope: ng.IScope
		) {
			this.loadCommentThreads();
		}

		//  Properties

		loadingComments: boolean;
		threads: ICommentThread[];
		message: string;

		//  Private Functions

		private loadCommentThreads(): void {

			console.time( "loading all comment threads" );
			this.threads = [];
			this.loadingComments = true;

			this.youTubeService.getCommentThreadsForChannel()
				.take(100)
				.safeApply(
					this.$rootScope,
					thread => {
						this.threads.push( thread );
					},
					error => {
						this.loadingComments = false;
						this.message = `Error loading threads. Status: ${error.result.error.code} (${error.result.error.message})`
					},
					() => {
						console.timeEnd( "loading all comment threads" );
						this.loadingComments = false;
					}
				)
				.subscribe();
		}
	}
}
