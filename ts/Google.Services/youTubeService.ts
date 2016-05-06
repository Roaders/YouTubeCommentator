/**
 * Created by Giles on 08/02/2016.
 */


/// <reference path="./googleAuthenticationService.ts"/>

module Google.Services {

    import HttpRequest = gapi.client.HttpRequest;

	export enum LoadingStatus{
		notStarted, loading, loaded, error
	}

    export interface IUserInfo {
        email: string,
        family_name: string,
        gender: string,
        given_name: string,
        id: string,
        link: string,
        name: string,
        picture: string,
        verified_email: string
    }

    export interface IComment {
        id: string;
        snippet: {
            parentId: string;
            publishedAt: Date;
            textDisplay?: string;
            authorDisplayName?: string;
            authorProfileImageUrl?: string;
            authorChannelUrl?: string;
        };
    }

	export interface IVideo{
		id: string,
		snippet: {
			title: string;
		}
	}

	export interface IVideoList{
		items: IVideo[];
	}

	export interface ICommentThreadList {
		items: ICommentThread[];
		nextPageToken: string;
	}

	export interface ICommentList {
		items: IComment[];
		nextPageToken: string;
	}

    export interface ICommentThread {
        id: string;
        snippet: {
          videoId: string;
	  	  videoTitle: string;
          topLevelComment: IComment;
          canReply: boolean;
          totalReplyCount: number;
	  	};
        replies?: { comments: IComment[] };
		replyLoadingStatus?: LoadingStatus;
		fullSnippetLoadingStatus?: LoadingStatus;
    }

    export interface IChannel {
        id: string;
        etag: string;
    }

    export class YouTubeService {

        static userInfo: string = "https://www.googleapis.com/oauth2/v2/userinfo";
        static channels: string = "https://www.googleapis.com/youtube/v3/channels";
        static commentThreads: string = "https://www.googleapis.com/youtube/v3/commentThreads";
        static comments: string = "https://www.googleapis.com/youtube/v3/comments";
        static videos: string = "https://www.googleapis.com/youtube/v3/videos";

        //  Constructor

        constructor( private googleAuthenticationService: GoogleAuthenticationService ) {
        }

		//  Private Variables

		private _videoTitleLookup: {[id: string]: string};

        //  Functions

        getUserInfo(): Rx.Observable<IUserInfo> {
            console.log( "loading user info" );

            return this.googleAuthenticationService.request<IUserInfo>( { path: YouTubeService.userInfo } );
        }

        getChannelList(): Rx.Observable<IChannel[]> {
            console.log( "loading channel list" );

            return this.googleAuthenticationService.request<any>( {
                    path: YouTubeService.channels,
                    params: { part: "id", mine: "true", maxResults: "50" }
                })
                .map<IChannel[]>( result => {
					console.log( "channel list loaded: " + result.items.map( item => item.id ) );
					return result.items
				} );
        }

        getCommentThreadsForChannel(lightweight: boolean = false): Rx.Observable<ICommentThread> {
            //console.log(`loading comment threads lightweight: ${lightweight}`);

			this._videoTitleLookup = {};

            return this.getChannelList()
                .flatMap<IChannel>(  channelList => Rx.Observable.from(channelList)  )
                .flatMap( channel => this.loadCommentThreads( channel, lightweight ) )
				.flatMap<ICommentThread>( threads => {
					var allReplyStreams: Rx.Observable<ICommentThread[]>[] = [];

					threads.forEach(thread => {
						this.parseComment( thread.snippet.topLevelComment );
						allReplyStreams.push( this.loadMissingRepliesForThread(thread).toArray() );
					});

					return Rx.Observable.combineLatest<ICommentThread[],ICommentThread[]>( allReplyStreams, (...values) => {
						return [].concat.apply([],values);
					} )
						.flatMap<ICommentThread>( threads => Rx.Observable.from(threads) );
				});
        }

		loadTopComments( ids: string[] ): Rx.Observable<IComment[]> {

			return Rx.Observable.defer<ICommentList>( () => {
				return this.googleAuthenticationService.request<ICommentList>( {
					path: YouTubeService.comments,
					params: {
					  part: "id,snippet",
					  fields: "items(id,snippet)",
					  textFormat: "plainText",
					  id: ids.toString()
					}
				})
			} )
			.retry(3)
			.map( commentList => {
				commentList.items.forEach(comment => this.parseComment(comment));
				return commentList.items;
			} );
		}

		loadReplies( thread: ICommentThread, pageToken?: string ): Rx.Observable<IComment> {

			return Rx.Observable.defer<ICommentList>( () => {
				return this.googleAuthenticationService.request<ICommentList>( {
					path: YouTubeService.comments,
					params: {
					  part: "id,snippet",
					  fields: "items(id,snippet),nextPageToken",
					  textFormat: "html",
					  parentId: thread.id,
					  pageToken: pageToken,
					  maxResults: 100
					}
				})
			} )
			.retry(3)
			.flatMap( commentList => {

				commentList.items.forEach( reply => {
					this.parseComment( reply );
				} );

				const comments = Rx.Observable.from<IComment>(commentList.items)

				if( commentList.nextPageToken ) {
					return comments.concat( this.loadReplies( thread, commentList.nextPageToken ) );
				}

				return comments;
			});
		}

		postReply(replyText: string, thread: ICommentThread): Rx.Observable<IComment[]> {

			return Rx.Observable.defer<ICommentThreadList>( () => {
				return this.googleAuthenticationService.request<ICommentThreadList>( {
					path: YouTubeService.comments,
					method: "post",
					params: {
						part: "snippet",
					},
					body: { snippet: {
								textOriginal: replyText,
								parentId: thread.id
							} }
				})
			} )
			.retry(3)
			.flatMap<IComment[]>( _ => {
				return this.loadReplies( thread ).toArray();
			});
		}

		loadVideoTitles(threads: ICommentThread[]): Rx.Observable<ICommentThread[]> {
			return Rx.Observable.from(threads)
				.map( thread => thread.snippet.videoId )
				.distinct()
				.filter( videoId => typeof this._videoTitleLookup[videoId] === 'undefined' )
				.toArray()
				.flatMap( videoIds => {

					if(videoIds.length === 0){
						console.log( `No video titles to load, returning empty array` );
						return Rx.Observable.return({items: []});
					}

					return this.googleAuthenticationService.request<IVideoList>( {
						path: YouTubeService.videos,
						params: {
						  part: "snippet",
						  fields: "items(id,snippet/title)",
						  id: videoIds.toString()
						}
					})
				} )
				.retry(3)
				.do( videos => {

					videos.items.forEach( video => {
						this._videoTitleLookup[video.id] = video.snippet.title;
					} );

					threads.forEach( thread => {
						thread.snippet.videoTitle = this._videoTitleLookup[thread.snippet.videoId];
					}
					);
				} )
				.map( _ => threads );
		}

		// Private Functions

		private parseComment( comment: IComment ): void {
			if(comment && comment.snippet && comment.snippet.publishedAt ) {
				comment.snippet.publishedAt = new Date( Date.parse( <any>comment.snippet.publishedAt ) );
			}
		}

		private loadMissingRepliesForThread(thread: ICommentThread): Rx.Observable<ICommentThread> {

			var existingReplies: number = thread.replies ? thread.replies.comments.length : 0;

			if( thread.snippet.totalReplyCount > existingReplies ) {
				//console.log( `replies require load ${thread.id}` );
				thread.replyLoadingStatus = LoadingStatus.loading;
				return this.loadReplies(thread)
					.toArray()
					.map( replies => {
						//console.log( `missing reply loaded` );
						thread.replyLoadingStatus = LoadingStatus.loaded;
						thread.replies = {comments: replies};
						return thread;
					} );
			} else {
				if( thread.replies ) {
					//console.log( `thread replies already loaded ${thread.id}` );
					thread.replyLoadingStatus = LoadingStatus.notStarted;
					thread.replies.comments.forEach( reply => {
						this.parseComment( reply );
					} );
				} else if(thread.snippet.totalReplyCount === 0) {
					//console.log( `thread has no replies ${thread.id}` );
					thread.replyLoadingStatus = LoadingStatus.loaded;
				}
				return Rx.Observable.return(thread);
			}
		}

		private loadCommentThreads( channel: IChannel, lightweight: boolean = false, pageToken?: string, maxResults?: number ): Rx.Observable<ICommentThread[]> {

				maxResults = maxResults || 10;
				maxResults = Math.min( maxResults, 100 );

				var part: string = lightweight ? "id,snippet" : "id,snippet,replies";

				const commentFields: string = `id,snippet(parentId,publishedAt,textDisplay,authorDisplayName,authorProfileImageUrl,authorChannelUrl)`;
				const fields: string =`items(id,replies(comments(${commentFields})),snippet(videoId,totalReplyCount,canReply,topLevelComment(${commentFields}))),nextPageToken`;

				return Rx.Observable.defer<ICommentThreadList>( () => {
					return this.googleAuthenticationService.request<ICommentThreadList>( {
						path: YouTubeService.commentThreads,
						params: {
						  part: part,
						  fields: fields,
						  allThreadsRelatedToChannelId: channel.id,
						  pageToken: pageToken,
						  maxResults: maxResults
						}
					})
				} )
				.retry(3)
				.flatMap<ICommentThread[]>( commentThreadList => {
					console.log( `Comment threads loaded: (${commentThreadList.items.length}, lightweight: ${lightweight})`);

					const threadList = Rx.Observable.return<ICommentThread[]>(commentThreadList.items);

					if( commentThreadList.nextPageToken ) {
						const nextObservable = this.loadCommentThreads( channel, lightweight, commentThreadList.nextPageToken, maxResults + 20 );
						return Rx.Observable.merge( threadList, nextObservable );
					}

					return threadList;
				});
		}
    }
}
