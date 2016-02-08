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
            this.loadClientDetails().subscribe( result => {
                console.log(`result: ${result.client_id}`)
            } );
        }

        //  Private Variables

        //  Public Functions

        //  Private Functions

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