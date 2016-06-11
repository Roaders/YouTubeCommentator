
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
	}


}
