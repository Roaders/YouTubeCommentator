/**
 * Created by Giles on 08/02/2016.
 */

const app: ng.IModule = angular.module( "youTubeCommentator", [ "ngRoute", "ngCookies" ] );

app.controller( "commentatorController", Pricklythistle.Controller.CommentatorController )
	.controller( "loginController", Pricklythistle.Controller.LoginController )
	.controller( "headerController", Pricklythistle.Controller.HeaderController )
	.controller( "threadController", Pricklythistle.Controller.ThreadController )
	.controller( "replyController", Pricklythistle.Controller.ReplyController );

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
