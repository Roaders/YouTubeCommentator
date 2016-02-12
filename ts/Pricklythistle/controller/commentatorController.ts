/**
 * Created by Giles on 08/02/2016.
 */

module Pricklythistle.Controller {
	import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
	import YouTubeService = Google.Services.YouTubeService;
	import IUserInfo = Google.Services.IUserInfo;
	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;
	import LoadingStatus = Google.Services.LoadingStatus;

	// TODO: dispose of observable when logout
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

		private _allThreads: ThreadController[];
		private _displayCount: number;
		private

		//  Properties

		loadingCount: string;
		message: string;

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

			this.youTubeService.getCommentThreadsForChannel()
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
			console.log( `updating displayed threads: ${this._displayCount}` )

			const threadsToDisplay = this._allThreads.slice(0, this._displayCount );

			const fullyLoadedThreads: ThreadController[] = threadsToDisplay
				.filter(controller => this.threadFullyLoaded(controller.thread) );

			this._threads = fullyLoadedThreads;

			this.updateTopComments( threadsToDisplay );
			this.updateReplies(threadsToDisplay);
		}

		private updateReplies( threads: ThreadController[] ): void {

			Rx.Observable
				.from<ThreadController>( threads )
				.filter( controller => this.replyLoadNotStarted( controller.thread ) )
				.flatMap<IComment[]>( controller => {

					console.log( `Loading replies for ${controller.thread.id}` );
					controller.thread.replyLoadingStatus = LoadingStatus.loading;
					return this.youTubeService.loadReplies( controller.thread ).toArray();
				} )
				.toArray()
				.safeApply( this.$rootScope,
				 	threadReplyList => {
						console.log(`relies loaded for ${threadReplyList.length} threads`);
						threadReplyList.forEach(replies => {
							if( !replies[0].snippet ) {
								console.log( "no snippet for reply, returning" );
								return;
							}

						    var filteredThreads: ThreadController[] = threads
								.filter( controller => controller.thread.id == replies[0].snippet.parentId );

							if( filteredThreads.length != 1 ){
								throw Error( "could not find thread to update" );
							}
							const thread: ICommentThread = filteredThreads[0].thread;

							thread.replies.comments = replies;
							thread.replyLoadingStatus = LoadingStatus.loaded;
							filteredThreads[0].thread = thread;

							if(thread.fullSnippetLoadingStatus === LoadingStatus.loaded) {
								this._threads.push(filteredThreads[0]);
							}
						});

						this._threads = this.$filter( 'orderBy' )(this._threads, 'latestReply', true);
					})
				.subscribe();
		}

		private updateTopComments( threads: ThreadController[] ): void {

			Rx.Observable
				.from<ThreadController>( threads )
				.filter( controller => this.topCommentLoadNotStarted( controller.thread ) )
				.bufferWithCount(100)
				.flatMap<IComment[]>( threadControllers => {

					const ids: string[] = threadControllers.map( controller => {
						controller.thread.fullSnippetLoadingStatus = LoadingStatus.loading;
						return controller.thread.id
					});

					console.log( `Loading ${ids.length} top comments` );

					if(ids.length === 0) {
						return Rx.Observable.empty();
					}

					return this.youTubeService.loadTopComments( ids );
				} )
				.safeApply( this.$rootScope,
				 	commentList => {
						console.log(`top comment list loaded: ${commentList.length}`);
						commentList.forEach(comment => {
						    var filteredThreads: ThreadController[] = threads
								.filter( controller => controller.thread.id == comment.id );

							if( filteredThreads.length != 1 ){
								throw Error( "could not find thread to update" );
							}
							const thread: ICommentThread = filteredThreads[0].thread;

							thread.snippet.topLevelComment = comment;
							thread.fullSnippetLoadingStatus = LoadingStatus.loaded;
							filteredThreads[0].thread = thread;

							if(thread.replyLoadingStatus === LoadingStatus.loaded) {
								this._threads.push(filteredThreads[0]);
							}
						});

						this._threads = this.$filter( 'orderBy' )(this._threads, 'latestReply', true);
					})
				.subscribe();

		}

		private createThreadController( thread: ICommentThread ): ThreadController {

			if( !thread.snippet || !thread.snippet.topLevelComment || !thread.snippet.topLevelComment.snippet.publishedAt ) {
				console.log( "published at missing");
			} else {
				if( !(thread.snippet.topLevelComment.snippet.publishedAt instanceof Date) ){
					console.log( "published at not date");
				}
			}

			if( thread.replies ){
				thread.replies.comments.forEach(reply => {
				    if( !reply.snippet || !reply.snippet.publishedAt ) {
						console.log( "publishet at missing");
					} else if( !(reply.snippet.publishedAt instanceof Date) ) {
						console.log( "published at not date" );
					}
				});
			}

			return new ThreadController( thread, this.$filter );
		}

		private replyLoadNotStarted( thread: ICommentThread ): boolean {
			return thread.replyLoadingStatus !== LoadingStatus.loaded &&
				thread.replyLoadingStatus !== LoadingStatus.loading
		}

		private topCommentLoadNotStarted( thread: ICommentThread ): boolean {
			return thread.fullSnippetLoadingStatus !== LoadingStatus.loaded &&
				thread.fullSnippetLoadingStatus !== LoadingStatus.loading
		}

		private threadFullyLoaded( thread: ICommentThread ): boolean {
			return thread.replyLoadingStatus === LoadingStatus.loaded &&
				thread.fullSnippetLoadingStatus === LoadingStatus.loaded;
		}
	}
}
