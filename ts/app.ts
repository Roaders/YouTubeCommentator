/**
 * Created by Giles on 08/02/2016.
 */

/// <reference path="../node_modules/rx/ts/rx.all.d.ts"/>
/// <reference path="../node_modules/rx-angular/ts/rx.angular.d.ts"/>
/// <reference path="../typings/index.d.ts"/>
/// <reference path="Google.Services/youTubeService.ts"/>
/// <reference path="Google.Services/googleAuthenticationService.ts"/>
/// <reference path="Pricklythistle/services/commentsService.ts"/>
/// <reference path="Pricklythistle/controller/commentatorController.ts"/>
/// <reference path="Pricklythistle/controller/loginController.ts"/>
/// <reference path="Pricklythistle/controller/headerController.ts"/>
/// <reference path="../node_modules/@types/gapi/index.d.ts"/>
/// <reference path="../node_modules/@types/gapi.auth2/index.d.ts"/>

interface IClientId{
    apiKey: string;
    client_id: string;
}

const scopes: string = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.force-ssl";

const app: ng.IModule = angular.module("youTubeCommentator", ["ngRoute", "ngCookies", "ngSanitize", "infinite-scroll", "monospaced.elastic"]);

app.controller("commentatorController", Pricklythistle.Controller.CommentatorController)
    .controller("loginController", Pricklythistle.Controller.LoginController)
    .controller("headerController", Pricklythistle.Controller.HeaderController);

app.service("googleAuthenticationService", Google.Services.GoogleAuthenticationService)
    .service("youTubeService", Google.Services.YouTubeService)
    .service("commentService", Pricklythistle.Services.CommentService);

app.config(['$routeProvider', ($routeProvider: angular.route.IRouteProvider) => {
    $routeProvider
        .when("/login", { templateUrl: "templates/login.html?v=__applicationVersionNumber__", controller: "loginController as controller" })
        .when("/comments", { templateUrl: "templates/comments.html?v=__applicationVersionNumber__", controller: "commentatorController as commentsController" })
        .otherwise({ redirectTo: "/login" });
}]);

angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500);

app.value("authorizationScopes", scopes);

function initiateApp() {
    gapi.load('client:auth2', loadClientID);

}

function loadClientID(){
    jQuery.getJSON("./client_id.json").then(initClient);
}

function initClient(clientId: IClientId) {

    gapi.client.init({
        apiKey: clientId.apiKey,
        clientId: clientId.client_id,
        scope: scopes
    }).then(function () {
        angular.bootstrap(document, ["youTubeCommentator"]);
    });
}
