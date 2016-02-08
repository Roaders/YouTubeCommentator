/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="Pricklythistle/Controller/commentatorController.ts"/>
///<reference path="Google.Services/googleAuthenticationService.ts"/>

import CommentatorController = Pricklythistle.Controller.CommentatorController;
import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;

const app: ng.IModule = angular.module( "youTubeCommentator", [] );

app.controller( "commentatorController", CommentatorController );
app.service( "googleAuthenticationService", GoogleAuthenticationService );

function initiateApp() {
    console.log( "initiate app");
    angular.bootstrap( document, ["youTubeCommentator"] );
}