

module Pricklythistle.Services {
	import YouTubeService = Google.Services.YouTubeService;
	import LoadingStatus = Google.Services.LoadingStatus;

	export class CommentService {

		// Constructor

		constructor(
			private youTubeService: YouTubeService,
			private $rootScope: ng.IScope,
			private $filter: ng.IFilterService
		) {
		}

		// Public FUnctions

		getCommentThreadsForChannel(): Rx.Observable<ICommentThread> {
			return this.youTubeService.getCommentThreadsForChannel();
		}

		public updateThreads(threads: ThreadController[]): Rx.Observable<ThreadController[]> {
			const repliesStream: Rx.Observable<any> = this.updateReplies( threads );
			const topCommentsStream: Rx.Observable<any> = this.updateTopComments( threads );

			return Rx.Observable.forkJoin( repliesStream, topCommentsStream )
				.flatMap( results => Rx.Observable.return(threads));
		}

		updateReplies( threads: ThreadController[] ): Rx.Observable<IComment[]> {

			return Rx.Observable
				.from<ThreadController>( threads )
				.filter( controller => this.replyLoadNotStarted( controller.thread ) )
				.flatMap<IComment[]>( controller => {

					console.log( `Loading replies for ${controller.thread.id}` );
					controller.thread.replyLoadingStatus = LoadingStatus.loading;
					return this.youTubeService.loadReplies( controller.thread )
						.toArray();
				} )
				.map( replies => {
					if( !replies[0].snippet ) {
						console.log( "no snippet for reply, returning" );
						return;
					}

					var parentThreadList: ThreadController[] = threads
						.filter( controller => controller.thread.id == replies[0].snippet.parentId );

					if( parentThreadList.length != 1 ){
						throw Error( "could not find thread to update" );
					}
					const thread: ICommentThread = parentThreadList[0].thread;

					thread.replies.comments = replies;
					thread.replyLoadingStatus = LoadingStatus.loaded;
					parentThreadList[0].thread = thread;

					return replies;
				});
		}

		public updateTopComments( threads: ThreadController[] ): Rx.Observable<IComment[]> {

			return Rx.Observable
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
				.map(
					commentList => {
						console.log(`top comment list loaded: ${commentList.length}`);
						commentList.forEach(comment => {
							var parentThreadList: ThreadController[] = threads
								.filter( controller => controller.thread.id == comment.id );

							if( parentThreadList.length != 1 ){
								throw Error( "could not find thread to update" );
							}
							const thread: ICommentThread = parentThreadList[0].thread;

							thread.snippet.topLevelComment = comment;
							thread.fullSnippetLoadingStatus = LoadingStatus.loaded;
							parentThreadList[0].thread = thread;
						});
						return commentList;
					});
		}

		// Private Functions

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
