/**
 * Created by Giles on 08/02/2016.
 */

module Pricklythistle.Controller {
	import CommentService = Pricklythistle.Services.CommentService;
	import IUserInfo = Google.Services.IUserInfo;
	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	// TODO: dispose of observable when logout
	export class CommentatorController {

		//  Constructor

		constructor(
			private commentService: CommentService,
			private $rootScope: ng.IScope,
			private $filter: ng.IFilterService
		) {
			this.loadCommentThreads();
		}

		// Private Variables

		private _allThreads: ThreadController[];
		private _displayCount: number;
		private

		//  Properties

		loadingCount: string;
		message: string;
		loadingDisplay: boolean

		private _threads: ThreadController[];

		get threads(): ThreadController[] {
			return this._threads;
		}

		// Public Functions

		displayMore() : void {
			this._displayCount += 20;
			this.updateDisplayedThreads();
		}

		//  Private Functions

		private loadCommentThreads(): void {

			console.time( "loading all comment threads" );
			this._allThreads = [];
			this.loadingCount = "";
			this._displayCount = 10;

			this.commentService.getCommentThreadsForChannel()
				.map( thread => {
					this._allThreads.push( this.createThreadController( thread ) );

					this.loadingCount = this._allThreads.length > 0 ? this._allThreads.length.toString() : "";
				} )
				.bufferWithTime(100)
				.safeApply(
					this.$rootScope,
					threadList => {
						if(threadList.length > 0){
							this._allThreads = this.$filter( 'orderBy' )(this._allThreads, 'latestReply', true);
							this.updateDisplayedThreads();
						}
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

		private updateDisplayedThreads(): void {
			this.loadingDisplay = true;

			const threadsToDisplay = this._allThreads.slice(0, this._displayCount );

			this.commentService.updateThreads( threadsToDisplay )
				.safeApply( this.$rootScope,
					loadedThreads => {
						loadedThreads = this.$filter( 'orderBy' )(loadedThreads, 'latestReply', true);
						this._threads = loadedThreads;
					},
					_ => {},
					() => {
						this.loadingDisplay = false;
				})
				.subscribe();
		}

		private createThreadController( thread: ICommentThread ): ThreadController {
			return new ThreadController( thread, this.$filter );
		}
	}
}
