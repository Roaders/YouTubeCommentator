/**
 * Created by Giles on 08/02/2016.
 */

 /// <reference path="./threadController.ts"/>
 /// <reference path="./replyController.ts"/>

module Pricklythistle.Controller {
	import CommentService = Pricklythistle.Services.CommentService;
	import IUserInfo = Google.Services.IUserInfo;
	import ICommentThread = Google.Services.ICommentThread;
	import IComment = Google.Services.IComment;

	// TODO: dispose of observable when logout
	export class CommentatorController {

		//  Statics

		static $inject = ["commentService","$rootScope","$filter"];

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
		private _selectedComment: ReplyController;
		private _disposableStream: Rx.IDisposable;

		//  Properties

		loadingCount: string;
		message: string;
		loadingDisplay: boolean

		private _threads: ThreadController[];

		get threads(): ThreadController[] {
			return this._threads;
		}

		// Public Functions

		public selectComment( commentController: ReplyController ): void {
			if( this._selectedComment && this._selectedComment !== commentController ) {
				this._selectedComment.deSelect();
			}

			this._selectedComment = commentController;

			this._selectedComment.toggleSelection();
		}

		refresh(): void {
			if( this._disposableStream ) {
				this._disposableStream.dispose();
				this._disposableStream = null;
			}

			this.loadingCount = undefined;
			this._displayCount = 10;
			this._threads = null;
			this._allThreads = null;

			this.loadCommentThreads();
		}

		displayMore() : void {
			this._displayCount += 20;
			console.log( `Display more threads: ${this._displayCount}` );
			this.updateDisplayedThreads();
		}

		postReply(threadController: ThreadController, replyController?: ReplyController) : void {
			replyController = replyController || threadController;

			console.log( `post reply: ${replyController.replyText}` );

			const responseStream = this.commentService.postReply(
				replyController.replyText,
				threadController ).safeApply( this.$rootScope, _ => {
					console.log( "reply success, updating replies" );
					this.updateAllReplies();
			} );

			replyController.waitForReplyResponse( responseStream );
		}

		//  Private Functions

		private updateAllReplies(): void {
			this._allThreads = this.$filter( 'orderBy' )(this._allThreads, 'latestReply', true);
			this.updateDisplayedThreads();
		}

		private loadCommentThreads(): void {

			console.time( "loading all comment threads" );
			this._allThreads = [];
			this.loadingCount = "";
			this._displayCount = 10;

			this._disposableStream = this.commentService.getCommentThreadsForChannel()
				.map( thread => {
					var controller: ThreadController = this.createThreadController( thread );
					this._allThreads.push( this.createThreadController( thread ) );

					//console.log( `thread ${thread.id} published ${controller.publishedAt} last reply ${controller.latestReply}` );

					this.loadingCount = this._allThreads.length > 0 ? this._allThreads.length.toString() : "";
				} )
				.bufferWithTime(100)
				.safeApply(
					this.$rootScope,
					threadList => {
						if(threadList.length > 0){
							this.updateAllReplies();
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
							this._disposableStream = null;
					}
				)
				.subscribe();
		}

		private updateDisplayedThreads(): void {
			this.loadingDisplay = true;

			var threadsToDisplay = this._allThreads.slice(0, this._displayCount );

			this.commentService.updateThreads( threadsToDisplay )
				.safeApply( this.$rootScope,
					loadedThreads => {},
					_ => {},
					() => {
						threadsToDisplay = this.$filter( 'orderBy' )(threadsToDisplay, 'latestReply', true);
						this._threads = threadsToDisplay;
						this.loadingDisplay = false;
				})
				.subscribe();
		}

		private createThreadController( thread: ICommentThread ): ThreadController {
			return new ThreadController( thread, this.$filter, this.commentService, this.$rootScope );
		}
	}
}
