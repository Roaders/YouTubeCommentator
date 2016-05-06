/**
 * Created by Giles on 09/02/2016.
 */

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;
    import IUserInfo = Google.Services.IUserInfo;

    export class LoginController {

		//  Statics

		static $inject = ["googleAuthenticationService"];

        //  Constructor

        constructor(
            private googleAuthenticationService: GoogleAuthenticationService
        ) {
        }

        //  Public Functions

        authenticate(): void {
            console.log( `requesting authentication` );

            this.googleAuthenticationService.authenticate().subscribe();
        }
    }
}
