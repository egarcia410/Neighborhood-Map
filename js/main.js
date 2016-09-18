var map;
var infoWindow;

//Initialize Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 32.7871, lng: -96.7996},
        zoom: 14,
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });

    infoWindow = new google.maps.InfoWindow();
}

//Userless request
//https://developer.foursquare.com/overview/auth#userless
//Example:
//'''https://api.foursquare.com/v2/venues/search?ll=40.7,
//-74&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&v=YYYYMMDD'''
//Returns a list of recommended venues near the current location
//https://developer.foursquare.com/docs/venues/explore

//Foursquare API keys
var clientId = 'AXTTI412XNBGHCQEFSLADZPXEITHOCTS30JUCTPS3ANK5YZ2';
var clientSecret = 'SLWNR3IV31KIPVBBLM3F0MHZRQ13SZ3LMR01OXCHMBJJVXKN';
var v = '20160915';

var foursquareURL = "https://api.foursquare.com/v2/venues/explore/?near=75201&venuePhotos=1&section=drinks&client_id=" + clientId + "&client_secret=" + clientSecret + "&v=" + v;
//Object constructor function
var Venue = function(data){

    var lat = data.venue.location.lat
    var lng = data.venue.location.lng
    //Create position for each venue
    //https://developers.google.com/maps/documentation/javascript/3.exp/reference#LatLng
    this.position = new google.maps.LatLng(lat, lng);
    this.id = ko.observable(data.venue.id)
    this.name = ko.observable(data.venue.name);
    this.category = ko.observable(data.venue.categories[0].name);
    this.url = ko.observable(data.venue.url);
    this.address = ko.observable(data.venue.location.address);
    this.city = ko.observable(data.venue.location.city);
    this.state = ko.observable(data.venue.location.state);
    //To assemble a resolvable photo URL, take prefix + size + suffix,
    //https://developer.foursquare.com/docs/responses/photo
    this.prefix = ko.observable(data.venue.photos.groups[0].items[0].prefix)
    this.suffix = ko.observable(data.venue.photos.groups[0].items[0].suffix)

    this.marker = new google.maps.Marker ({
        position: this.position,
        map: map,
        animation: google.maps.Animation.DROP,
    });
}

function stopAnimation(marker) {
    setTimeout(function () {
        marker.setAnimation(null);
    }, 1000);
}
Venue.prototype.infoWindow = function() {
    var contentString = '<div id="infoWindow">'
                            + '<h4>'
                                + '<a target="_blank" href="http://foursquare.com/v/' + this.id() + '">'
                                + this.name()
                                + '</a>'
                            + '</h4>'
                            + '<h5>'
                                + 'Category: '
                                + this.category()
                            + '</h5>'
                            + '<img class="image" src="' + this.prefix() + '100x100' + this.suffix() + '" alt="Venue Photo">'
                            + '<h5>'
                                + 'Address:'
                            + '</h5>'
                            + '<h5>'
                                + this.address() + ', ' + this.city() + ', ' + this.state()
                            + '</h5>'
                        + '</div>';
    infoWindow.setContent(contentString);
    infoWindow.open(map, this.marker);
    this.marker.setAnimation(google.maps.Animation.BOUNCE);
    stopAnimation(this.marker);
};

var viewModel = function(){
    var self = this;
    self.venues = ko.observableArray([]);
    self.query = ko.observable('');
    self.items = ko.observableArray([]);

    //Returns information from foursquare about recommended
    //and popular venues for drinks near 75201
    $.getJSON(foursquareURL).done(function(data){
        self.items(data.response.groups[0].items)

        //Create many objects of Venue
        for (var i = 0; i < self.items().length; i++){
            var venue = new Venue(self.items()[i]);
            self.venues.push(venue)
        }
    //http://api.jquery.com/jQuery.ajax/
    }).fail(function(){
        alert('Foursquare Failed!')
    });

    self.filterPins = ko.computed(function() {
        return self.venues().filter(function(venue) {
            // display the venues which can match the query
            // search without worrying about capitalization
            var search = self.query().toLowerCase();
            if (venue.name().toLowerCase().indexOf(search) >= 0) {

                //set markers after search result
                venue.marker.setMap(map);
                venue.marker.addListener('click', function() {
                    // drop and set infowindow content
                    venue.infoWindow();
                });

                return true;
            } else {

                venue.marker.setMap(null);
                return false;
            }
        });
    });
}

//Return error if google maps doesn't load
//https://danlimerick.wordpress.com/2014/01/18/how-to-catch-javascript-errors-with-window-onerror-even-on-chrome-and-firefox/
window.onerror = function (errorMsg, url, lineNumber) {
    alert('Google Maps Failed To Load');
}

//Toggle venue items
$("#toggle-venue").click(function(){
    $("#venues").toggle();
});

//To activate Knockout
ko.applyBindings(new viewModel());