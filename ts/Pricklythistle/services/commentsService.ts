
/// <reference path="../../Google.Services/youTubeService.ts"/>
/// <reference path="../controller/threadController.ts"/>

module Pricklythistle.Services {
	import YouTubeService = Google.Services.YouTubeService;
	import LoadingStatus = Google.Services.LoadingStatus;
	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;
	import ThreadController = Pricklythistle.Controller.ThreadController;

	export class CommentService {

		// Statics

		static threadStorageKey: string = "channelThreads";

		static $inject = ["youTubeService", "$rootScope", "$filter"];

		// Constructor

		constructor(
			private youTubeService: YouTubeService,
			private $rootScope: ng.IScope,
			private $filter: ng.IFilterService
		) {
		}

		// Public Fnctions

		getCommentThreadsForChannel(): Rx.Observable<ICommentThread> {
			return this.youTubeService.getCommentThreadsForChannel()
				.shareReplay(1);
		}

		updateThreads(threads: ThreadController[]): Rx.Observable<ThreadController[]> {
			return this.youTubeService.loadVideoTitles(threads.map( threadController => threadController.thread ))
				.do( updatedThreads => {
					if(updatedThreads.length > 0){
						console.log( `${updatedThreads.length} threads updated` );
					}
				} )
				.flatMap( results => Rx.Observable.return(threads));
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
				.flatMap<IComment[]>( controller => {

					//console.log( `Loading replies for ${controller.thread.id}` );
					controller.thread.replyLoadingStatus = LoadingStatus.loading;
					return this.youTubeService.loadRepliesForThread( controller.thread )
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

		private replyLoadNotStarted( thread: ICommentThread ): boolean {
			return thread.replyLoadingStatus !== LoadingStatus.loaded &&
				thread.replyLoadingStatus !== LoadingStatus.loading
		}
	}


}
