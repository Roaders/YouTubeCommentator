
/**
 * Created by Giles on 08/02/2016.
 */

module Google.Services {

    export class GoogleAuthenticationService {

        //  Statics

        static $inject = ["$rootScope", "$location", "authorizationScopes"];


        //  Constructor

        constructor(
            private $rootScope: ng.IScope,
            private $location: ng.ILocationService,
            private authorizationScopes: string
        ) {
            console.log(`GoogleAuthenticationService`);

            this.navigateIfAuthenticated();
        }

        //  Public Functions

        logOut(): void {
            console.log("destroying token");
            gapi.auth2.getAuthInstance().disconnect();

            this.$location.path("/login");
        }

        authenticate() {
            console.log(`authenticate`);
            return Rx.Observable.fromPromise(gapi.auth2.getAuthInstance().signIn())
            .safeApply(
                this.$rootScope,
                () => {
                    this.navigateIfAuthenticated();
                });
        }

        request<T>(args: { path: string, params?: any, method?: string, body?: any }) {
            console.log(`make request for: ${args.path}`);

            const request = gapi.client.request(args);

            return Rx.Observable.create<T>(observer => {
                request.then(success => {
                    observer.onNext(success.result);
                    observer.onCompleted();
                }, error => {
                    observer.onError(error);
                    observer.onCompleted();
                });
            })
            .safeApply(
                this.$rootScope,
                undefined,
                error => {
                    if(error.status === 401){
                        this.$location.path("/login");
                    }
                });
        }

        private navigateIfAuthenticated(){
            console.log(`navigateIfAuthenticated`);

            var user = gapi.auth2.getAuthInstance().currentUser.get();

            if (user.hasGrantedScopes(this.authorizationScopes)) {
                console.log(`scopes are granted`);
                
                this.$location.path("/comments");
            } else {
                console.log(`not granted scopes`);
                
                this.$location.path("/login");
            }
        }

    }
}
