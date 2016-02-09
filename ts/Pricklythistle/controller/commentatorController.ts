/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
    import YouTubeService = Google.Services.YouTubeService;
    import IUserInfo = Google.Services.IUserInfo;

    export class CommentatorController {

        //  Constructor

        constructor(
            private youTubeService: YouTubeService,
            private $rootScope: ng.IScope
        ) {
        }

    }

}