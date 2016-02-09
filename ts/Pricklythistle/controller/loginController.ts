/**
 * Created by Giles on 09/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;
    import IUserInfo = Google.Services.IUserInfo;

    export class LoginController {

        static scopes: string = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email";

        //  Constructor

        constructor(
            private googleAuthenticationService: GoogleAuthenticationService
        ) {
        }

        //  Public Functions

        authenticate(): void {
            console.log( `requesting authentication` );

            this.googleAuthenticationService.authenticate(LoginController.scopes)
                .subscribe();
        }
    }
}
