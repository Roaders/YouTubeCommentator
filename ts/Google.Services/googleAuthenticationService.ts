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
        "auth_provider_x509_cert_url": string
    }

    interface IHasResult<T>{
        result: T
    }

    export class GoogleAuthenticationService {

        //  Statics

        static cookie_Key: string = "userToken";

        //  Constructor

        constructor(
            private $http:ng.IHttpService,
            private $rootScope:ng.IScope,
            private $location: ng.ILocationService,
            private $cookies : angular.cookies.ICookiesService
        ) {
            if( this.$cookies.get( GoogleAuthenticationService.cookie_Key ) ) {
                this.token = JSON.parse( this.$cookies.get( GoogleAuthenticationService.cookie_Key ) );
                console.log( "setting api token from cookie: " + this.token.access_token );
                gapi.auth.setToken(this.token);
            }
        }

        //  Private Variables

        private clientDetailsStream: Rx.Observable<IClientDetails>;
        private token: GoogleApiOAuth2TokenObject

        //  Public Functions

        logOut(): void {
            console.log("destroying token");
            gapi.auth.signOut();

            this.$cookies.put( GoogleAuthenticationService.cookie_Key, undefined );

            this.$location.path( "/login" );
        }

        authenticate(scope:string, immediate:boolean = false):Rx.Observable<GoogleApiOAuth2TokenObject> {

            return this.loadClientDetails()
                .flatMap<GoogleApiOAuth2TokenObject>(clientDetails => {
                    return this.askForAuthentication(clientDetails, scope)
                })
                .map( token => {
                    return {
                        access_token: token.access_token,
                        error: token.error,
                        expires_in: token.expires_in,
                        state: token.state
                    };
                } )
                .safeApply(
                    this.$rootScope,
                    token => {
                        console.log(`token received: ${token.access_token}`);
                        this.$location.path( "/comments" );
                        this.token = token;
                        this.$cookies.put( GoogleAuthenticationService.cookie_Key, JSON.stringify(token) );
                    },
                    error => {
                        console.log(`Error authorizing access: ${error}`)
                    });
        }

        request<T>(args:{ path: string, params?: any }):Rx.Observable<T> {

            if( !this.token ) {
                console.log( "no token, returning to login screen")
                this.$location.path( "/login" );
                return Rx.Observable.throw<T>( "no token specified" );
            }

            const request:HttpRequest<T> = gapi.client.request(args);

            return this.loadClientDetails()
                .flatMap<T>( _ => {

                    return Rx.Observable.fromPromise<IHasResult<T>>( <any>request)
                        .map( result => { return result.result } );

                    }
                );
        }

        //  Private Functions

        private askForAuthentication(clientDetails:IClientDetails, scope:string):Rx.Observable<GoogleApiOAuth2TokenObject> {
            //console.log( `Asking for authentication: ${clientDetails.client_id}` );

            return Rx.Observable.fromCallback(gapi.auth.authorize)(
                {client_id: clientDetails.client_id, scope: scope, immediate: false, authuser: -1}
            );
        }

        //TODO: Make sure we only do this once
        private loadClientDetails():Rx.Observable<IClientDetails> {
            console.log( "load client details" )

            if( !this.clientDetailsStream ) {
                console.log( "creating new client details stream" );

                this.clientDetailsStream = Rx.Observable.return<string>( "client_id.json" )
                    .flatMap<ng.IHttpPromiseCallbackArg<IAppDetails>>( url => {
                        console.log( "loading url: " + url);
                        return Rx.Observable.fromPromise<ng.IHttpPromiseCallbackArg<IAppDetails>>( this.$http.get( url ) );
                    } )
                    .retry(3)
                    .map(callback => {
                        console.log( "mapping client details callback" );
                        return callback.data.web;
                    })
                    .do(clientDetails => {
                        console.log( `client details loaded: ${clientDetails.client_id}` );
                        gapi.client.setApiKey(clientDetails.client_id)
                    }).publish();
            }

            return this.clientDetailsStream;

        }
    }
}
