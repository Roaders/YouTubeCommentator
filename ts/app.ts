/**
 * Created by Giles on 08/02/2016.
 */

import ICommentThread = Google.Services.ICommentThread;
import IComment = Google.Services.IComment;
import ThreadController = Pricklythistle.Controller.ThreadController;
import ReplyController = Pricklythistle.Controller.ReplyController;

const app: ng.IModule = angular.module( "youTubeCommentator", [ "ngRoute", "ngCookies", "ngSanitize" ] );

app.controller( "commentatorController", Pricklythistle.Controller.CommentatorController )
	.controller( "loginController", Pricklythistle.Controller.LoginController )
	.controller( "headerController", Pricklythistle.Controller.HeaderController );

app.service( "googleAuthenticationService", Google.Services.GoogleAuthenticationService )
	.service( "youTubeService", Google.Services.YouTubeService );

app.config( ( $routeProvider: angular.route.IRouteProvider ) => {
    $routeProvider
        .when( "/login", { templateUrl:"templates/login.html", controller: "loginController as controller" } )
        .when( "/comments", { templateUrl:"templates/comments.html", controller: "commentatorController as controller" } )
        .otherwise( { redirectTo: "/login" } );
} );

function initiateApp() {
    angular.bootstrap( document, ["youTubeCommentator"] );
}
