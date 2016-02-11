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

		//  Properties

		displayLimit: number;
		loadingCount: string;
		message: string;

		private _threads: ThreadController[];

		get threads(): ThreadController[] {
			return this._threads;
		}

		// Public Functions

		displayMore() : void {
			this.displayLimit += 20;
		}

		//  Private Functions

		private loadCommentThreads(): void {

			console.time( "loading all comment threads" );
			this._threads = [];
			this.loadingCount = "";
			this.displayLimit = 10;

			this.youTubeService.getCommentThreadsForChannel()
				.bufferWithTime(100)
				.safeApply(
					this.$rootScope,
					threadList => {
						threadList.forEach( thread => {
							this._threads.push( new ThreadController( thread, this.$filter ) )
						});

						this.loadingCount = this._threads.length > 0 ? this._threads.length.toString() : "";

						this._threads = this.$filter( 'orderBy' )(this._threads, 'latestReply', true);
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
