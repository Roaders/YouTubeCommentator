/**
 * Created by Giles on 08/02/2016.
 */

/// <reference path="../node_modules/rx/ts/rx.all.d.ts"/>
/// <reference path="../node_modules/rx-angular/ts/rx.angular.d.ts"/>
/// <reference path="../typings/browser.d.ts"/>
/// <reference path="Google.Services/youTubeService.ts"/>
/// <reference path="Google.Services/googleAuthenticationService.ts"/>
/// <reference path="Pricklythistle/services/commentsService.ts"/>
/// <reference path="Pricklythistle/controller/commentatorController.ts"/>
/// <reference path="Pricklythistle/controller/loginController.ts"/>
/// <reference path="Pricklythistle/controller/headerController.ts"/>

const scopes: string = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.force-ssl";

const app: ng.IModule = angular.module( "youTubeCommentator", [ "ngRoute", "ngCookies", "ngSanitize", "infinite-scroll", "monospaced.elastic" ] );

app.controller( "commentatorController", Pricklythistle.Controller.CommentatorController )
	.controller( "loginController", Pricklythistle.Controller.LoginController )
	.controller( "headerController", Pricklythistle.Controller.HeaderController );

app.service( "googleAuthenticationService", Google.Services.GoogleAuthenticationService )
	.service( "youTubeService", Google.Services.YouTubeService )
	.service( "commentService", Pricklythistle.Services.CommentService );

app.config( ( $routeProvider: angular.route.IRouteProvider ) => {
    $routeProvider
        .when( "/login", { templateUrl:"templates/login.html?v=1.3.3", controller: "loginController as controller" } )
        .when( "/comments", { templateUrl:"templates/comments.html?v=1.3.3", controller: "commentatorController as commentsController" } )
        .otherwise( { redirectTo: "/login" } );
} );

angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500);

app.value( "authorizationScopes", scopes);

function initiateApp() {
    angular.bootstrap( document, ["youTubeCommentator"] );
}
