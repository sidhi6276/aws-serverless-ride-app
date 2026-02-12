/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    var authToken;
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    function requestUnicorn(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        
        // Calculate estimated time (based on animation duration)
        var estimatedMinutes = 2; // 2 minutes for demo
        var estimatedSeconds = 50 * 25 / 1000; // actual animation time in seconds
        
        // Show initial message with time estimate
        displayUpdate('🦄 ' + unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
        displayUpdate('⏱️ Estimated arrival time: ' + estimatedMinutes + ' minutes (' + Math.round(estimatedSeconds) + ' seconds)');
        displayUpdate('📍 Heading to your location...');
        
        // Disable button during ride
        $('#request').prop('disabled', true);
        $('#request').text('Unicorn on the way...');
        
        // Start countdown
        var countdown = Math.round(estimatedSeconds);
        var countdownInterval = setInterval(function() {
            countdown--;
            if (countdown > 0) {
                displayUpdate('⏰ Arriving in ' + countdown + ' seconds...');
            }
        }, 1000);
        
        animateArrival(function animateCallback() {
            clearInterval(countdownInterval);
            
            // Arrival notification
            displayUpdate('✅ ' + unicorn.Name + ' has arrived! Giddy up! 🎉');
            displayUpdate('🚀 Your magical ride is ready!');
            
            // Show browser notification if allowed
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Wild Rydes - Unicorn Arrived! 🦄", {
                    body: unicorn.Name + " has arrived at your location!",
                    icon: "🦄"
                });
            }
            
            // Play arrival sound (optional)
            try {
                var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFgo+mNvyxnElBSuBzvLZiTYIGGi88OWcTgwPUKnl8LNgGgU7k9n0y3cmBSh+zPLaizsIHm7A7+OZUA0NVKzn8bBcFg==');
                audio.play();
            } catch(e) {
                console.log('Audio play failed:', e);
            }
            
            WildRydes.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Select Pickup Location →');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $('#signOut').click(function() {
            WildRydes.signOut();
            window.location.href = '/signin.html';
        });
        
        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('✅ Authenticated. Click on map to select pickup location.');
                $('.authToken').text(token);
            }
        });
        
        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
        
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    });

    function handleRequestClick(event) {
        var pickupLocation = WildRydes.map.selectedPoint;
        event.preventDefault();
        
        if (!pickupLocation) {
            alert('Please select a pickup location on the map first!');
            return;
        }
        
        displayUpdate('🔍 Searching for nearby unicorns...');
        requestUnicorn(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        var $li = $('<li>' + text + '</li>');
        $li.css({
            'animation': 'slideIn 0.3s ease',
            'margin-bottom': '0.75rem'
        });
        $('#updates').prepend($li);
    }
}(jQuery));
