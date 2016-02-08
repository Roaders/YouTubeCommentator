/**
 * Created by Giles on 08/02/2016.
 */

module Google.Services {

    interface IAppDetails {
        "web": IClientDetails
    }

    interface IClientDetails {
        "client_id": string,
        "project_id": string,
        "auth_uri": string,
        "token_uri": string,
        "auth_provider_x509_cert_url": string,
    }

    export class GoogleAuthenticationService {

        //  Constructor

        constructor( private $http: ng.IHttpService ) {
            this.authenticate( true );
        }

        //  Private Variables

        private access_token: GoogleApiOAuth2TokenObject;

        //  Public Functions

        authenticate( immediate: boolean = false ): void {
            this.loadClientDetails()
                .do( clientDetails => {
                    console.log( `storing client details: ${clientDetails.client_id}` );
                    gapi.client.setApiKey( clientDetails.client_id )
                })
                .flatMap<GoogleApiOAuth2TokenObject>( clientDetails => this.askForAuthentication( clientDetails, immediate) )
                .subscribe(
                    token => {
                        console.log( `token received: ${token.access_token}` );
                        this.access_token = token;
                    },
                    error => {
                        console.log( `Error authorizing access: ${error}` )
                    }
            );
        }

        //  Private Functions

        private askForAuthentication( clientDetails: IClientDetails, immediate: boolean = false ): Rx.Observable<GoogleApiOAuth2TokenObject> {
            console.log( `Asking for authentication: ${clientDetails.client_id}` );

            return Rx.Observable.fromCallback( gapi.auth.authorize )(
                { client_id: clientDetails.client_id, scope: "https://www.googleapis.com/auth/youtube", immediate: immediate }
            );
        }

        private loadClientDetails(): Rx.Observable<IClientDetails> {

            return Rx.Observable.defer<ng.IHttpPromiseCallbackArg<IAppDetails>>( () => {

                return Rx.Observable.fromPromise<ng.IHttpPromiseCallbackArg<IAppDetails>>( this.$http.get( "client_id.json" ) );

                })
                .map( callback => {
                    return callback.data.web
                } )
                .retry(3);

        }

    }

}