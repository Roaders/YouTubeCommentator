/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;
    import IUserInfo = Google.Services.IUserInfo;

    export class CommentatorController {

        //  Statics

        static scopes: string = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email";

        //  Constructor

        constructor(
            private googleAuthenticationService: GoogleAuthenticationService,
            private youTubeService: YouTubeService,
            private $rootScope: ng.IScope
        ) {

        }

        //  Private Variables

        private userInfo: IUserInfo;

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

            this.googleAuthenticationService.authenticate( CommentatorController.scopes)
                .flatMap( _ => {
                    console.log( "Getting user info" );

                    return this.youTubeService.getUserInfo()
                        .safeApply( this.$rootScope,
                            userInfoResult => {
                                console.log("got user info " + JSON.stringify(userInfoResult));
                                this.userInfo = userInfoResult;
                            });
                } )
                .subscribe();
        }

        logOut(): void {
            console.log( `logging out` );
            this.googleAuthenticationService.logOut();
        }

    }

}