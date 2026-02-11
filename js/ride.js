/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {

    var authToken;

    WildRydes.authToken.then(function (token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function (error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    function requestUnicorn(pickupLocation) {

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: { Authorization: authToken },
            contentType: 'application/json',

            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),

            success: completeRequest,

            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Ride error:', textStatus, errorThrown);
                alert('Error requesting unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {

        console.log('API response:', result);

        var unicorn = result.Unicorn;
        var pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';

        displayUpdate(
            unicorn.Name +
            ', your ' +
            unicorn.Color +
            ' unicorn is on ' +
            pronoun +
            ' way.'
        );

        if (WildRydes.map.unsetLocation) {
            WildRydes.map.unsetLocation();
        }

        animateArrival(function () {

            displayUpdate(unicorn.Name + ' has arrived. Giddy up!');

            // ✅ animate unicorn to pickup location
            WildRydes.map.animate(
                WildRydes.map.center,
                {
                    latitude: WildRydes.map.selectedPoint.latitude,
                    longitude: WildRydes.map.selectedPoint.longitude
                },
                function () {
                    console.log('Unicorn arrived');
                }
            );
        });
    }

    $(function () {

        $('#request').click(handleRequestClick);

        $('#signOut').click(function () {
            WildRydes.signOut();
            alert("Signed out.");
            window.location.href = "signin.html";
        });

        $(WildRydes.map).on('pickupChange', handlePickupChanged);

        WildRydes.authToken.then(function (token) {
            if (token) {
                displayUpdate(
                    'Authenticated. View your <a href="#authTokenModal" data-toggle="modal">auth token</a>.'
                );
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var btn = $('#request');
        btn.text('Request Unicorn');
        btn.prop('disabled', false);
    }

    function handleRequestClick(event) {
        event.preventDefault();

        var pickupLocation = WildRydes.map.selectedPoint;

        if (!pickupLocation) {
            alert("Please click a pickup location first!");
            return;
        }

        requestUnicorn(pickupLocation);
    }

    function animateArrival(callback) {
        var loader = $('.loader');

        loader.show();

        setTimeout(function () {
            loader.hide();
            callback();
        }, 2000);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }

}(jQuery));
