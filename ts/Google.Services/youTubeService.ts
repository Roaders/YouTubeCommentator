/**
 * Created by Giles on 08/02/2016.
 */

module Google.Services {

    import HttpRequest = gapi.client.HttpRequest;

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
            channelId: string;
            videoId: string;
            textDisplay: string;
            textOriginal: string;
            parentId: string;
            authorDisplayName: string;
            authorProfileImageUrl: string;
            authorChannelUrl: string;
            authorGoogleplusProfileUrl: string;
            canRate: boolean;
            viewerRating: string;
            likeCount: number;
            publishedAt: Date;
            updatedAt: Date;
        };
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
          channelId: string;
          videoId: string;
          topLevelComment: IComment;
          canreply: boolean;
          totalReplyCount: number;
          isPublic: boolean;
        };
        replies: { comments: IComment[] };
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

        //  Constructor

        constructor( private googleAuthenticationService: GoogleAuthenticationService ) {

        }

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
                .map<IChannel[]>( result => { return result.items } );
        }

		//TODO - limit concurrency
        getCommentThreadsForChannel(): Rx.Observable<ICommentThread> {
            console.log( "loading comment threads");

            return this.getChannelList()
                .flatMap<IChannel>(  channelList => Rx.Observable.from(channelList)  )
                .flatMap( channel => this.loadCommentThreads( channel ) )
				.flatMap( thread => {
					this.parseComment( thread.snippet.topLevelComment );

					var replyStream: Rx.Observable<IComment>;

					if( thread.snippet.totalReplyCount > 0 ) {
						replyStream = this.loadReplies(thread);
					} else {
						replyStream = Rx.Observable.empty<IComment>();
					}

					var commentStream: Rx.Observable<IComment> = this.loadTopComment(thread);

					return Rx.Observable.combineLatest<IComment[],IComment,ICommentThread>(
						replyStream.toArray(), commentStream, (replies, topComment) => {
								thread.replies = {comments: replies}
								thread.snippet.topLevelComment = topComment;
								return thread;
							}
						);
				});
        }

		// Private Functions

		private parseComment( comment: IComment ): void {
			comment.snippet.publishedAt = new Date( Date.parse( <any>comment.snippet.publishedAt ) );
			comment.snippet.updatedAt = new Date( Date.parse( <any>comment.snippet.updatedAt ) );
		}

		private loadTopComment( thread: ICommentThread ): Rx.Observable<IComment> {

			return Rx.Observable.defer<ICommentList>( () => {
				return this.googleAuthenticationService.request<ICommentList>( {
					path: YouTubeService.comments,
					params: {
					  part: "id,snippet",
					  fields: "items(id,snippet)",
					  textFormat: "plainText",
					  id: thread.id
					}
				})
			} )
			.retry(3)
			.map( commentList => commentList.items[0] );
		}

		private loadReplies( thread: ICommentThread, pageToken?: string ): Rx.Observable<IComment> {

			return Rx.Observable.defer<ICommentList>( () => {
				return this.googleAuthenticationService.request<ICommentList>( {
					path: YouTubeService.comments,
					params: {
					  part: "id,snippet",
					  fields: "items(id,snippet),nextPageToken",
					  textFormat: "plainText",
					  parentId: thread.id,
					  pageToken: pageToken,
					  maxResults: 100
					}
				})
			} )
			.retry(3)
			.flatMap( commentList => {
				console.log( `Replies loaded: (${commentList.nextPageToken})`);

				const comments = Rx.Observable.from<IComment>(commentList.items)

				if( commentList.nextPageToken ) {
					return comments.concat( this.loadReplies( thread, commentList.nextPageToken ) );
				}

				return comments;
			});
		}

		private loadCommentThreads( channel: IChannel, pageToken?: string, maxResults?: number ): Rx.Observable<ICommentThread> {

				maxResults = maxResults || 20;
				maxResults = Math.min( maxResults, 100 );

				return Rx.Observable.defer<ICommentThreadList>( () => {
					return this.googleAuthenticationService.request<ICommentThreadList>( {
						path: YouTubeService.commentThreads,
						params: {
						  part: "id,snippet",
						  fields: "items(id,snippet),nextPageToken",
						  allThreadsRelatedToChannelId: channel.id,
						  pageToken: pageToken,
						  maxResults: maxResults
						}
					})
				} )
				.retry(3)
				.flatMap( commentThreadList => {
					console.log( `Comment thread loaded: (${commentThreadList.nextPageToken})`);

					const threads = Rx.Observable.from<ICommentThread>(commentThreadList.items)

					if( commentThreadList.nextPageToken ) {
						return threads.concat( this.loadCommentThreads( channel, commentThreadList.nextPageToken, maxResults + 20 ) );
					}

					return threads;
				});
		}
    }
}
