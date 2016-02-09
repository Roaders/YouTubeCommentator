/**
 * Created by Giles on 08/02/2016.
 */

module Google.Services {

    import HttpRequest = gapi.client.HttpRequest;

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

    interface IHasResult<T>{
        result: T
    }

    export class GoogleAuthenticationService {

        //  Constructor

        constructor(private $http:ng.IHttpService,
                    private $rootScope:ng.IScope) {
        }

        //   Properties

        token:GoogleApiOAuth2TokenObject;

        //  Public Functions

        logOut():void {
            console.log("destroying token");
            this.token = null;
            gapi.auth.signOut();
        }

        authenticate(scope:string, immediate:boolean = false):Rx.Observable<GoogleApiOAuth2TokenObject> {
            return this.loadClientDetails()
                .do(clientDetails => {
                    //console.log( `storing client details: ${clientDetails.client_id}` );
                    gapi.client.setApiKey(clientDetails.client_id)
                })
                .flatMap<GoogleApiOAuth2TokenObject>(clientDetails => this.askForAuthentication(clientDetails, scope, immediate))
                .safeApply(
                    this.$rootScope,
                    token => {
                        console.log(`token received: ${token.access_token}`);
                        this.token = token;
                    },
                    error => {
                        console.log(`Error authorizing access: ${error}`)
                    });
        }

        request<T>(args:{ path: string, params?: any }):Rx.Observable<T> {

            const request:HttpRequest<T> = gapi.client.request(args);

            return Rx.Observable.fromPromise<IHasResult<T>>( <any>request)
                .map( result => { return result.result } )
        }

        //  Private Functions

        private askForAuthentication(clientDetails:IClientDetails, scope:string, immediate:boolean = false):Rx.Observable<GoogleApiOAuth2TokenObject> {
            //console.log( `Asking for authentication: ${clientDetails.client_id}` );

            return Rx.Observable.fromCallback(gapi.auth.authorize)(
                {client_id: clientDetails.client_id, scope: scope, immediate: immediate}
            );
        }

        //TODO: Ensure that we only load this once
        private loadClientDetails():Rx.Observable<IClientDetails> {

            return Rx.Observable.defer<ng.IHttpPromiseCallbackArg<IAppDetails>>(() => {

                    return Rx.Observable.fromPromise<ng.IHttpPromiseCallbackArg<IAppDetails>>(this.$http.get("client_id.json"));

                })
                .map(callback => {
                    return callback.data.web
                })
                .retry(3);

        }
    }
}