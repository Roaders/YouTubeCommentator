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

	// TODO: figure out refresh
    export class GoogleAuthenticationService {

        //  Statics

        static cookie_Key: string = "userToken";

		static $inject = ["$http","$rootScope","$location","$cookies","authorizationScopes"];

        //  Constructor

        constructor(
            private $http:ng.IHttpService,
            private $rootScope:ng.IScope,
            private $location: ng.ILocationService,
            private $cookies : angular.cookies.ICookiesService,
			private authorizationScopes: string
        ) {
            if( this.$cookies.get( GoogleAuthenticationService.cookie_Key ) ) {
                this.token = JSON.parse( this.$cookies.get( GoogleAuthenticationService.cookie_Key ) );
                console.log( "setting api token from cookie: " + this.token.access_token );
                gapi.auth.setToken(this.token);

				$location.path( "/comments" );
            }
        }

        //  Private Variables

        private clientDetails: IClientDetails;
        private clientDetailsStream: Rx.Observable<IClientDetails>;
        private token: GoogleApiOAuth2TokenObject;
		private refreshToken: Rx.Observable<any>;

        //  Public Functions

        logOut(): void {
            console.log("destroying token");
            gapi.auth.signOut();

            this.$cookies.put( GoogleAuthenticationService.cookie_Key, undefined );

            this.$location.path( "/login" );
        }

        authenticate():Rx.Observable<GoogleApiOAuth2TokenObject> {
            console.log( `authenticate scopes: ${this.authorizationScopes}` );

            return this.loadClientDetails()
                .flatMap<GoogleApiOAuth2TokenObject>(clientDetails => {
                    return this.askForAuthentication(clientDetails, this.authorizationScopes)
                })
                .safeApply(
                    this.$rootScope,
                    token => {
                        console.log(`token received: ${token.access_token}`);
                        this.$location.path( "/comments" );
                        this.token = token;
                    },
                    error => {
                        console.log(`Error authorizing access: ${error}`);
						alert( `There was a problem with authorisation: ${error}` );
                    });
        }

		request<T>(args:{ path: string, params?: any, method?: string, body?: any }):Rx.Observable<T> {
		    //console.log( `make request for: ${args.path}` );

		    if( !this.token ) {
		        console.log( "no token, returning to login screen")
		        this.$location.path( "/login" );
		        return Rx.Observable.throw<T>( "no token specified" );
		    }

		    return this.loadClientDetails()
		        .flatMap<T>( clientDetails => {
		            const request:HttpRequest<T> = gapi.client.request(args);
		            return Rx.Observable.fromPromise<IHasResult<T>>( <any>request)
		                .map( result => { return result.result } );
		            }
		        )
				.retryWhen( errors => {

					return errors.flatMap( currentError => {

						console.log( `Error status: ${currentError.result.error.code}` );

						if(currentError.result.error.code == 401) {
					 		console.log( `not authorized, attempting auth for ${args.path}` );
							if( !this.refreshToken ) {
								console.log( `creating refresh token for ${args.path}` );
								this.refreshToken = this.askForAuthentication( this.clientDetails,this.authorizationScopes, true)
									.do( _ => {
										console.log( `refresh token complete ${args.path}` );
										this.refreshToken = null;
									} ).shareReplay(1);
							} else {
								console.log( `returning existing refresh token for ${args.path}` );
							}

							return this.refreshToken;
						}

						return Rx.Observable.throw( currentError );
					} )
					.do(
						_ => {console.log(`flatmap onNext for ${args.path}`)},
						_ => {console.log(`flatmap error for ${args.path}`)},
						() => {console.log(`flatmap complete for ${args.path}`)}
				);
				} )
		        .do(
		          _ => {
					  //console.log(`result returned for path: ${args.path}`)
				  },
		          error => { console.log( `error returned for path: ${args.path} Error: ${error}` ) }
		        );
		}

        //  Private Functions

        private getPath( args:{ path: string, params?: any } ): string {
            var urlParams: string = "";

            args.params = args.params || {};

            args.params.access_token = this.token.access_token;

            for( var paramName in args.params ) {
                urlParams += urlParams === "" ? "?" : "&";
                urlParams += paramName + "=";
                urlParams += encodeURIComponent( args.params[paramName] );
            }

            return args.path + urlParams;
        }

        private askForAuthentication(clientDetails:IClientDetails, scope:string, immediate: boolean = false):Rx.Observable<GoogleApiOAuth2TokenObject> {
            console.log( `Asking for authentication: ${clientDetails.client_id}` );

            return Rx.Observable.fromCallback(gapi.auth.authorize)(
                {client_id: clientDetails.client_id, scope: scope, immediate: immediate, authuser: immediate ? 1 : -1}
            )
			.map( token => {
				const newToken: GoogleApiOAuth2TokenObject = {
					access_token: token.access_token,
					error: token.error,
					expires_in: token.expires_in,
					state: token.state
				};
				this.$cookies.put( GoogleAuthenticationService.cookie_Key, JSON.stringify(newToken) );
				return newToken;
			} ).do( authorization => {
				console.log( "authorisation granted" )
			} );
        }

        private loadClientDetails():Rx.Observable<IClientDetails> {

            if( this.clientDetails ) {
                return Rx.Observable.return<IClientDetails>(this.clientDetails);
            }

            if( !this.clientDetailsStream ) {

                this.clientDetailsStream = Rx.Observable.return<string>( "client_id.json" )
                    .flatMap<ng.IHttpPromiseCallbackArg<IAppDetails>>( url => {
                        console.log( "loading client details from url: " + url);
                        return Rx.Observable.fromPromise<ng.IHttpPromiseCallbackArg<IAppDetails>>( this.$http.get( url ) );
                    } )
                    .retry(3)
                    .map(callback => {
                        return callback.data.web;
                    })
                    .do(clientDetails => {
                        console.log( `client details loaded: ${clientDetails.client_id}` );
                        gapi.client.setApiKey(clientDetails.client_id);
                        this.clientDetails = clientDetails;
                    })
                    .share();
            }

            return this.clientDetailsStream;

        }
    }
}
