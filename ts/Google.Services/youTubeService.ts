/**
 * Created by Giles on 08/02/2016.
 */

module Google.Services {

    export class YouTubeService {

        static userInfo: string = "https://www.googleapis.com/oauth2/v2/userinfo";

        //  Constructor

        constructor( private googleAuthenticationService: GoogleAuthenticationService ) {

        }

        //  Functions

        getUserInfo() {

            console.log( "loading user info" );

            gapi.client.request( { path: YouTubeService.userInfo }).then( result => {
                console.log( "result received" );
            }, error => {
                console.log( "Error Received" );
            } )

        }

    }

}