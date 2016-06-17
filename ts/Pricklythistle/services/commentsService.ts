
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

		updateReplies( thread: ICommentThread ): Rx.Observable<ICommentThread> {

			if( thread.replyLoadingStatus == LoadingStatus.loaded ||
				thread.replyLoadingStatus == LoadingStatus.loading
			){
				return Rx.Observable.return(thread);
			}

			return Rx.Observable
				.just( thread )
				.flatMap<IComment[]>( thread => {

					//console.log( `Loading replies for ${controller.thread.id}` );
					thread.replyLoadingStatus = LoadingStatus.loading;
					return this.youTubeService.loadRepliesForThread( thread )
						.toArray();
				} )
				.flatMap( replies => {

					const existingIds = thread.replies.comments.map( comment => comment.id );

					replies.forEach( reply => {
						if( existingIds.indexOf(reply.id) < 0 ){
							thread.replies.comments.push(reply);
						}
					} );

					const blankReplies = thread.replies.comments.filter( reply => reply.snippet.textDisplay === "" );

					if( blankReplies.length > 0 ){
						return this.youTubeService.loadReplyList( blankReplies.map( reply => reply.id ) )
							.toArray()
							.do( replies => {

								const existingIds = thread.replies.comments.map( comment => comment.id );

								replies.forEach( reply => {
									thread.replies.comments[existingIds.indexOf(reply.id)] = reply;
								});

								thread.replyLoadingStatus = LoadingStatus.loaded;
							});
					}

					thread.replyLoadingStatus = LoadingStatus.loaded;

					return Rx.Observable.return(replies)
				})
				.map(_ => thread)
		}
	}


}
