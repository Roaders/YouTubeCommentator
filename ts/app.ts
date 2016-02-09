/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="Pricklythistle/Controller/commentatorController.ts"/>
///<reference path="Pricklythistle/Controller/loginController.ts"/>
///<reference path="Pricklythistle/Controller/headerController.ts"/>

///<reference path="Google.Services/googleAuthenticationService.ts"/>
///<reference path="Google.Services/youTubeService.ts"/>

import CommentatorController = Pricklythistle.Controller.CommentatorController;
import LoginController = Pricklythistle.Controller.LoginController;
import HeaderController = Pricklythistle.Controller.HeaderController;

import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;
import YouTubeService = Google.Services.YouTubeService;

const app: ng.IModule = angular.module( "youTubeCommentator", [ "ngRoute", "ngCookies" ] );

app.controller( "commentatorController", CommentatorController );
app.controller( "loginController", LoginController );
app.controller( "headerController", HeaderController );

app.service( "googleAuthenticationService", GoogleAuthenticationService );
app.service( "youTubeService", YouTubeService );

app.config( ( $routeProvider: angular.route.IRouteProvider ) => {
    $routeProvider
        .when( "/login", { templateUrl:"templates/login.html", controller: "loginController as controller" } )
        .when( "/comments", { templateUrl:"templates/comments.html", controller: "commentatorController as controller" } )
        .otherwise( { redirectTo: "/login" } );
} );

function initiateApp() {
    angular.bootstrap( document, ["youTubeCommentator"] );
}