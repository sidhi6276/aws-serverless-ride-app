/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    
    // Mock authentication for testing
    WildRydes.authToken = Promise.resolve('mock-token-for-testing');
    
    WildRydes.signOut = function() {
        console.log('Sign out clicked');
        alert('Sign out functionality requires AWS Cognito configuration');
    };

    function requestUnicorn(pickupLocation) {
        console.log('Requesting unicorn at:', pickupLocation);
        
        // Show loading
        $('#request').prop('disabled', true);
        $('#request').text('Finding your unicorn...');
        
        // Simulate API call
        setTimeout(function() {
            // Mock unicorn data
            var mockUnicorn = {
                Name: 'Shadowfax',
                Color: 'White',
                Gender: 'Male'
            };
            
            completeRequest({ Unicorn: mockUnicorn });
        }, 1000);
    }

    function completeRequest(result) {
        var unicorn = result.Unicorn;
        var pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
        
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' has arrived. Giddy up! 🦄');
            WildRydes.map.unsetLocation();
            $('#request').prop('disabled', true);
            $('#request').text('Select Pickup Location →');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        
        $('#signOut').click(function() {
            WildRydes.signOut();
        });
        
        // Show authenticated message
        displayUpdate('✅ Authenticated. Click on map to select location.');
        displayUpdate('⚠️ Demo mode - API not configured');
        
        // Hide API warning if present
        $('#noApiMessage').hide();
    });

    function handleRequestClick(event) {
        event.preventDefault();
        
        var pickupLocation = WildRydes.map.selectedPoint;
        
        if (!pickupLocation) {
            alert('Please select a pickup location by clicking on the map');
            return;
        }
        
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
        $('#updates').prepend($('<li>' + text + '</li>'));
    }
    
}(jQuery));
