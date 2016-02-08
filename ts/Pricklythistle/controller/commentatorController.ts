/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;

    export class CommentatorController {

        //  Statics

        static scopes: string = "https://www.googleapis.com/auth/youtube https://googleapis.com/auth/userinfo.profile";

        //  Constructor

        constructor(
            private googleAuthenticationService: GoogleAuthenticationService,
            private youTubeService: YouTubeService
        ) {

        }

        //  Properties

        get message(): string {
            return this.googleAuthenticationService.token ? this.googleAuthenticationService.token.access_token : "not logged in";
        }

        get loggedIn(): boolean {
            return this.googleAuthenticationService.token != null;
        }

        //  Public Functions

        authenticate(): void {
            console.log( `requesting authentication` );
            this.googleAuthenticationService.authenticate( CommentatorController.scopes).subscribe(
                _ => {
                    console.log( "Getting user info" );
                    this.youTubeService.getUserInfo();
                }
            );
        }

        logOut(): void {
            console.log( `logging out` );
            this.googleAuthenticationService.logOut();
        }

    }

}