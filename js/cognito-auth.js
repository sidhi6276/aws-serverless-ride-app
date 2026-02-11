/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

var WildRydes = window.WildRydes || {};

(function scopeWrapper($) {

    var signinUrl = '/signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    // ✅ Logout
    WildRydes.signOut = function signOut() {
        var currentUser = userPool.getCurrentUser();
        if (currentUser) {
            currentUser.signOut();
        }
    };

    // ✅ Get auth token
    WildRydes.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    /*
     * Username converter (important for Cognito)
     */
    function toUsername(email) {
        return email.replace('@', '-at-');
    }

    /*
     * Cognito functions
     */

    function register(email, password, onSuccess, onFailure) {
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        });

        userPool.signUp(toUsername(email), password, [attributeEmail], null,
            function signUpCallback(err, result) {
                if (!err) onSuccess(result);
                else onFailure(err);
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: toUsername(email),
            Password: password
        });

        var cognitoUser = createCognitoUser(email);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true,
            function confirmCallback(err, result) {
                if (!err) onSuccess(result);
                else onFailure(err);
            }
        );
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: toUsername(email),
            Pool: userPool
        });
    }

    /*
     * Event handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
    });

    function handleSignin(event) {
        event.preventDefault();

        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();

        signin(email, password,
            function signinSuccess() {
                console.log('Login success');
                window.location.href = 'ride.html';
            },
            function signinError(err) {
                alert(err.message || err);
            }
        );
    }

    function handleRegister(event) {
        event.preventDefault();

        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();

        if (password !== password2) {
            alert('Passwords do not match');
            return;
        }

        register(email, password,
            function registerSuccess(result) {
                console.log('Registered:', result.user.getUsername());
                window.location.href = 'verify.html';
            },
            function registerFailure(err) {
                alert(err.message || err);
            }
        );
    }

    function handleVerify(event) {
        event.preventDefault();

        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();

        verify(email, code,
            function verifySuccess(result) {
                console.log('Verified:', result);
                alert('Verification successful!');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err.message || err);
            }
        );
    }

}(jQuery));
