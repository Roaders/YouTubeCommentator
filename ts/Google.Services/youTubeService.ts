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

    export interface ICommentThread {
        id: string;
    }

    export interface IChannel {
        id: string;
        etag: string;
    }

    export class YouTubeService {

        static userInfo: string = "https://www.googleapis.com/oauth2/v2/userinfo";
        static channels: string = "https://www.googleapis.com/youtube/v3/channels";
        static commentThreads: string = "https://www.googleapis.com/youtube/v3/commentThreads";

        //  Constructor

        constructor( private googleAuthenticationService: GoogleAuthenticationService ) {

        }

        //  Functions

        getUserInfo(): Rx.Observable<IUserInfo> {

            console.log( "YouTubeService loading user info" );

            return this.googleAuthenticationService.request<IUserInfo>( { path: YouTubeService.userInfo } );

        }

        getChannelList(): Rx.Observable<IChannel[]> {
            console.log( "YouTubeService loading channel list" );

            return this.googleAuthenticationService.request<any>( {
                    path: YouTubeService.channels,
                    params: { part: "id", mine: "true", maxResults: "50" }
                })
                .map<IChannel[]>( result => { return result.items } );
        }

        getCommentThreads(): Rx.Observable<ICommentThread[]> {
            console.log( "YouTubeService loading comment threads" );

            return this.getChannelList()
                .flatMap<IChannel>(  channelList => Rx.Observable.from(channelList)  )
                .flatMap<any>( channel => {
                    return this.googleAuthenticationService.request<any>( {
                        path: YouTubeService.commentThreads,
                        params: { part: "id,snippet,replies", allThreadsRelatedToChannelId: channel.id, maxResults: "100" }
                    })}
                )
                .map( commentThreadList => commentThreadList.items );
        }

    }

}