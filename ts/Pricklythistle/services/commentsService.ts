

module Pricklythistle.Services {
	import YouTubeService = Google.Services.YouTubeService;
	import LoadingStatus = Google.Services.LoadingStatus;

	export class CommentService {

		// Statics

		static threadStorageKey: string = "channelThreads";

		// Constructor

		constructor(
			private youTubeService: YouTubeService,
			private $rootScope: ng.IScope,
			private $filter: ng.IFilterService
		) {
		}

		// Public Fnctions

		getCommentThreadsForChannel(): Rx.Observable<ICommentThread> {
			var threadStream: Rx.Observable<ICommentThread> =
				this.youTubeService.getCommentThreadsForChannel()
				.shareReplay(1);

			threadStream
	            .bufferWithCount(100)
	            .scan( ( allItems, currentItem ) => {
	                currentItem.forEach(thread => {
	                    allItems.push(thread);
	                });

	                console.log( `Save items to local storage: ${allItems.length}` )

	                return allItems;
	            }, []  );

			return threadStream;
		}

		updateThreads(threads: ThreadController[]): Rx.Observable<ThreadController[]> {
			console.log( `update ${threads.length} threads` );
			const repliesStream: Rx.Observable<any> = this.updateReplies( threads );
			const topCommentsStream: Rx.Observable<any> = this.updateTopComments( threads );
			const titlesStream: Rx.Observable<any> = this.youTubeService.loadVideoTitles(threads.map( threadController => threadController.thread ));

			return Rx.Observable.forkJoin( repliesStream, topCommentsStream, titlesStream )
				.flatMap( results => Rx.Observable.return(threads))
				.do( _ => console.log( `${threads.length} threads updated` ) );
		}

		postReply(replyText: string, threadController: ThreadController): Rx.Observable<IComment[]> {
			return this.youTubeService.postReply( replyText, threadController.thread )
				.safeApply( this.$rootScope,
					replies => {
						const thread = threadController.thread;
						thread.replies = { comments: replies };
						threadController.thread = thread;

						if( !threadController.allRepliesShown )
						{
							threadController.toggleReplyDisplay();
						}
					}
				);
		}

		// Private Functions

		private updateReplies( threads: ThreadController[] ): Rx.Observable<number> {

			return Rx.Observable
				.from<ThreadController>( threads )
				.filter( controller => this.replyLoadNotStarted( controller.thread ) )
				.do(  )
				.flatMap<IComment[]>( controller => {

					//console.log( `Loading replies for ${controller.thread.id}` );
					controller.thread.replyLoadingStatus = LoadingStatus.loading;
					return this.youTubeService.loadReplies( controller.thread )
						.toArray();
				} )
				.map( replies => {
					if( !replies || replies.length === 0 || !replies[0].snippet ) {
						console.log( "no snippets for reply, returning" );
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
				})
				.count()
				.do( ( count ) => {
					if(count > 0) {
						console.log(`${count} reply threads loaded`);
					}
				} );
		}

		private updateTopComments( threads: ThreadController[] ): Rx.Observable<IComment[]> {

			return Rx.Observable
				.from<ThreadController>( threads )
				.filter( controller => this.topCommentLoadNotStarted( controller.thread ) )
				.bufferWithCount(100)
				.flatMap<IComment[]>( threadControllers => {

					const ids: string[] = threadControllers.map( controller => {
						controller.thread.fullSnippetLoadingStatus = LoadingStatus.loading;
						return controller.thread.id
					});

					if(ids.length === 0) {
						return Rx.Observable.empty();
					}

					console.log( `Loading ${ids.length} top comments` );

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

		private createLightWeightCommentForStorage(comment: IComment) : IComment {
			return {
				id: comment.id,
				snippet: {
					parentId: comment.snippet.parentId,
					publishedAt: comment.snippet.publishedAt
				}
			};
		}
	}


}
