/**
 * Created by Giles on 08/02/2016.
 */

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
            this.loadCommentThreads();
        }

        //  Properties

        //  Private Functions

        private loadCommentThreads(): void {

            this.youTubeService.getCommentThreads()
                .safeApply(
                    this.$rootScope,
                    channels => {
                        console.log( `Comments Loaded` );
                    }
                )
                .subscribe();
        }

    }

}
