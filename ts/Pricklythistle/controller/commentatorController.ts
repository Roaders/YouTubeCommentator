/**
 * Created by Giles on 08/02/2016.
 */

///<reference path="../../Google.Services/googleAuthenticationService.ts"/>

module Pricklythistle.Controller {
    import GoogleAuthenticationService = Google.Services.GoogleAuthenticationService;

    export class CommentatorController {

        constructor( private googleAuthenticationService: GoogleAuthenticationService) {

        }

        message: string = "Hello Controller";

    }

}