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
			private $rootScope: ng.IScope,
			private $filter: ng.IFilterService
		) {
			this.loadCommentThreads();
		}

		// Private Variables

		private allThreads: ThreadController[];

		//  Properties

		loadingCount: string;
		message: string;

		private _threads: ThreadController[];

		get threads(): ThreadController[] {
			return this._threads;
		}

		//  Private Functions

		private loadCommentThreads(): void {

			console.time( "loading all comment threads" );
			this.allThreads = [];
			this.loadingCount = "";

			this.youTubeService.getCommentThreadsForChannel()
				.take(500)
				.bufferWithTime(100)
				.safeApply(
					this.$rootScope,
					threadList => {
						threadList.forEach( thread => {
							this.allThreads.push( new ThreadController( thread, this.$filter ) )
						});

						this.loadingCount = this.allThreads.length > 0 ? this.allThreads.length.toString() : "";

						this.allThreads = this.$filter( 'orderBy' )(this.allThreads, 'latestReply', true);
						this._threads = this.allThreads.slice(0, 100);
					},
					error => {
						this.loadingCount = undefined;

						if( error.result ) {
							this.message = `Error loading threads. Status: ${error.result.error.code} (${error.result.error.message})`
						} else if(error.message) {
							this.message = `Error loading threads. (${error.message})`
						} else {
							this.message = `Error loading threads.`
						}
					},
					() => {
						console.timeEnd( "loading all comment threads" );
							this.loadingCount = undefined;
					}
				)
				.subscribe();
		}
	}
}
