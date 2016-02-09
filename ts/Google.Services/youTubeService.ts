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

    export class YouTubeService {

        static userInfo: string = "https://www.googleapis.com/oauth2/v2/userinfo";

        //  Constructor

        constructor( private googleAuthenticationService: GoogleAuthenticationService ) {

        }

        //  Functions

        getUserInfo(): Rx.Observable<IUserInfo> {

            console.log( "YouTubeService loading user info" );

            return this.googleAuthenticationService.request<IUserInfo>( { path: YouTubeService.userInfo } );

        }

    }

}