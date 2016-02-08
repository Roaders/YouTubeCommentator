/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="Pricklythistle/Controller/commentatorController.ts"/>

import CommentatorController = Pricklythistle.Controller.CommentatorController;

const app: ng.IModule = angular.module( "youTubeCommentator", [] );

app.controller( "commentatorController", CommentatorController );