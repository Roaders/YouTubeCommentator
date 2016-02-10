/**
 * Created by Giles on 09/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;
    import IUserInfo = Google.Services.IUserInfo;

    export class HeaderController {

        //  Constructor

        constructor(
            private googleAuthenticationService: GoogleAuthenticationService,
            private youTubeService: YouTubeService,
            private $rootScope: ng.IScope
        ) {
            this.loadUserInfo();
        }

        //  Properties

        userInfo: IUserInfo;

        //  Public Functions

        logOut(): void {
            this.googleAuthenticationService.logOut();
            this.userInfo = null;
        }

        //  Private Functions

        private loadUserInfo(): void {

            this.youTubeService.getUserInfo()
                .safeApply(
                    this.$rootScope,
                    userInfo => {
                        console.log( `User info loaded for ${userInfo.name}` );
                        this.userInfo = userInfo;
                    }
                )
                .subscribe();
        }
    }
}
