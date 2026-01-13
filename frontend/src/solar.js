var placeSearch, autocomplete, autocomplete2;
var latitude = null;
var longitude = null;
var deglat = null;
var minlat = null;
var deglong = null;
var minlong = null;
var placename = null;
var regionname = null;
var region_dist = null;
var state = null;
var country = null;
var countryname = null;
var fullplacename = null;
var latdir = null;
var longdir = null;
var tzoname = null;
var offset = null;
var offsetsign = null;
var componentForm = {
    locality: 'long_name'
};
var sGlobalHoroscope = '';

function initAutocomplete() {
    var autoCompletes = document.getElementsByClassName('place_auto_complete');
    for (var i in autoCompletes) {
        var place = autoCompletes[i];

        place.onkeyup = function () {
            alert("hello")
            var f = this.form;
            if (f) {
                //if(this.value.length >= 2 && !this.getAttribute('gp_enabled')){
                if (!this.getAttribute('gp_enabled')) {
                    var ac = new clickastro.places.Autocomplete(this, {
                        types: ['(cities)'],
                        form: f
                    });
                    ac.inputId = 'gac_' + this.id;
                    ac.addListener('place_changed', function () {
                        fillInAddressMain(this);
                    });
                    this.setAttribute('gp_enabled', true);
                }
            }
        }

    }
}
function initAutocompleteConsult() {
    var autoCompletes = document.getElementsByClassName('place_auto_complete');
    for (var i in autoCompletes) {
        var place = autoCompletes[i];
        place.onkeyup = function () {
            var f = this.form;
            if (f) {
                //if(this.value.length >= 2 && !this.getAttribute('gp_enabled')){
                if (!this.getAttribute('gp_enabled')) {
                    var ac = new clickastro.places.Autocomplete(this, {
                        types: ['(cities)'],
                        form: f
                    });
                    ac.inputId = 'gac_' + this.id;
                    ac.addListener('place_changed', function () {
                        fillInAddressMain(this);
                    });
                    this.setAttribute('gp_enabled', true);
                }
            }
        }

    }
}
function placeMainAutocomplete() {
    var autoCompletes = document.getElementsByClassName('place_auto_complete');
    for (var i in autoCompletes) {
        var place = autoCompletes[i];
        place.onkeyup = function () {
            var f = this.form;
            if (f) {
                //if(this.value.length >= 2 && !this.getAttribute('gp_enabled')){
                if (!this.getAttribute('gp_enabled')) {
                    var ac = new clickastro.places.Autocomplete(this, {
                        types: ['(cities)'],
                        form: f
                    });
                    ac.inputId = 'gac_' + this.id;
                    ac.addListener('place_changed', function () {
                        fillInAddressMain(this);
                    });
                    this.setAttribute('gp_enabled', true);
                }
            }
        }


    }
}

/*solr*/

function initPlaceAutoComplete() {
    var autoCompletes = document.getElementsByClassName('place_auto_complete');
    for (var i in autoCompletes) {
        var f = autoCompletes[i].form;
        if (f) {
            var ac = new ca.place.Autocomplete(autoCompletes[i], {
                types: ['(cities)'],
                form: f
            }, 'gac_' + autoCompletes[i].id);

            ac.addListener('place_changed', function () {
                fillInAddressSolr(this);
            });
        }
    }
}

function fillInAddressSolr(el) {
    var place;
    //console.log(el.getPlace());
    if (el.inputId == "gac_birth_place") {// user birth place
        resetPlace(0, el.options.form);
        place = el.getPlace();
    } else if (el.inputId == "gac_location_place") {// user location place
        resetPlace(1, el.options.form);
        place = el.getPlace();
    } else if (el.inputId == "gac_pbirth_place") {// partner birth place
        resetPlace(2, el.options.form);
        place = el.getPlace();
    } else if (el.inputId == "gac_loc_birth_place") {// partner birth place
        resetPlace(7, el.options.form);
        place = el.getPlace();
    }
    console.log(place);

    deglat = place.latitude_deg;
    minlat = place.latitude_min;
    deglong = place.longitude_deg;
    minlong = place.longitude_min;
    placename = place.place_name;
    country = place.country_name;
    statename = place.region_name;

    latitude = place.latitude_deg + (place.latitude_min / 60.0);
    longitude = place.longitude_deg + (place.longitude_min / 60.0);

    fullplacename = placename + ',' + statename + ',' + country;


    latdir = place.lat_dir;
    longdir = place.long_dir;

    latitude = ((latdir == 'N') ? 1 : -1) * latitude;
    longitude = ((longdir == 'E') ? 1 : -1) * longitude;

    if (country == 'India') {
        tzoname = "Asia/Calcutta";
    } else {
        tzoname = place.time_zone_name;
    }
    // for (var i = 0; i < place.address_components.length; i++) {
    // 	var addressType = place.address_components[i].types[0];
    // }
    if (el.inputId == "gac_birth_place") {// user birth place
        setPlaceFields(0, el.options.form);
    } else if (el.inputId == "gac_location_place") {// user location place
        setPlaceFields(1, el.options.form);
    } else if (el.inputId == "gac_pbirth_place") {// partner birth place
        setPlaceFields(2, el.options.form);
    } else if (el.inputId == "gac_p1birth_place") {// partner birth place
        setPlaceFields(3, el.options.form);
    } else if (el.inputId == "gac_p2birth_place") {// partner birth place
        setPlaceFields(4, el.options.form);
    } else if (el.inputId == "gac_p3birth_place") {// partner birth place
        setPlaceFields(5, el.options.form);
    } else if (el.inputId == "gac_p4 vbbirth_place") {// partner birth place
        setPlaceFields(6, el.options.form);
    } else if (el.inputId == "gac_loc_birth_place") {// partner birth place
        setPlaceFields(7, el.options.form);
    }
}

/*solr*/


function fillInAddressMain(el) {
    if (el.inputId == "gac_birth_place") {// user birth place
        resetPlace(0, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_location_place") {// user location place
        resetPlace(1, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_pbirth_place") {// partner birth place
        resetPlace(2, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_p1birth_place") {// partner birth place
        resetPlace(3, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_p2birth_place") {// partner birth place
        resetPlace(4, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_p3birth_place") {// partner birth place
        resetPlace(5, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_p4birth_place") {// partner birth place
        resetPlace(6, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_loc_birth_place") {// user birth place
        resetPlace(7, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_location_birthplace") {// user birth place
        resetPlace(8, el.form);
        var place = el.getPlace();
    } else if (el.inputId == "gac_birth_place_consult") {// user birth place
        resetPlace(10, el.form);
        var place = el.getPlace();
    }
    //console.log([place, el.form]);
    for (var i = 0; i < place.address_components.length; i++) {
        latitude = place.geometry.location.lat();
        longitude = place.geometry.location.lng();
        deglat = Math.abs(parseInt(place.geometry.location.lat()));
        minlat = Math.abs(parseInt((latitude % 1) * 60));
        deglong = Math.abs(parseInt(place.geometry.location.lng()));
        minlong = Math.abs(parseInt((longitude % 1) * 60));
        placename = place.address_components[0].long_name;
        if (place.address_components[i].types[0].indexOf("country") == 0) {
            countryname = place.address_components[i].long_name;
            country = countryname;
        }
        if (place.address_components[i].types[0].indexOf("administrative_area_level_2") == 0) {
            regionname = place.address_components[i].long_name;
            region_dist = regionname;
        }
        if (place.address_components[i].types[0].indexOf("administrative_area_level_1") == 0) {
            state = place.address_components[i].long_name;
            statename = state;
        } else {
            state = null;
        }
    }
    fullplacename = place.address_components[0].long_name + ',' +
        (place.address_components[1] ? place.address_components[1].long_name : place.address_components[0].long_name) + ',' +
        (place.address_components[2] ? place.address_components[2].long_name : '');

    var geoaddress = place.geometry.location.lat() + ' , ' + place.geometry.location.lng();
    if (latitude >= 0) {
        latdir = "N";
    } else if (latitude < 0) {
        latdir = "S";
    }
    if (longitude >= 0) {
        longdir = "E";
    } else if (longitude < 0) {
        longdir = "W";
    }
    if (country == 'India') {
        tzoname = "Asia/Calcutta";
    } else {
        var json = (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'url': "https://report.clickastro.com/tz/index.php?latitude=" + latitude + "&longitude=" + longitude,
                'dataType': "json",
                'success': function (data) {
                    json = data;
                }
            });
            return json;
        })();
        var jsonstring = JSON.stringify(json);
        var obj = jQuery.parseJSON(jsonstring);
        tzoname = obj.timezone;
    }
    for (var i = 0; i < place.address_components.length; i++) {
        var addressType = place.address_components[i].types[0];
    }
    if (el.inputId == "gac_birth_place") {// user birth place
        /* if($(el.form).attr("name") == 'frmbasic' || $(el.form).attr("name") == 'selectReportForm'){
             setPlaceFields(0, el.form);
         } else {
             setPlaceFields(1, el.form);
         }*/
        setPlaceFields(0, el.form);
    } else if (el.inputId == "gac_location_place") {// user location place
        setPlaceFields(1, el.form);
    } else if (el.inputId == "gac_pbirth_place") {// partner birth place
        setPlaceFields(2, el.form);
    } else if (el.inputId == "gac_p1birth_place") {// partner birth place
        setPlaceFields(3, el.form);
    } else if (el.inputId == "gac_p2birth_place") {// partner birth place
        setPlaceFields(4, el.form);
    } else if (el.inputId == "gac_p3birth_place") {// partner birth place
        setPlaceFields(5, el.form);
    } else if (el.inputId == "gac_p4birth_place") {// partner birth place
        setPlaceFields(6, el.form);
    } else if (el.inputId == "gac_loc_birth_place") {// partner birth place
        setPlaceFields(7, el.form);
    } else if (el.inputId == "gac_location_birthplace") {// user location place
        setPlaceFields(8, el.form);
    } else if (el.inputId == "gac_birth_place_consult") {// user location place
        setPlaceFields(10, el.form);
    }
}

function geolocate(el) {
    (function (position) {
        var geolocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        var circle = new google.maps.Circle({
            center: geolocation,
            radius: position.coords.accuracy
        });
        el.setBounds(circle.getBounds());
    });
}

function loadPlaceAPI() {
    GoogleAPISession = '';
    var js = document.createElement("script");
    js.type = "text/javascript";
    js.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCNU5MQTeW2JXvBsMVRwZhM8jT0ulLVXm8&region=IN&libraries=places&callback=initAutocomplete";
    //js.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBB_CCQjz1qrMStBnNnxp-bHUjoucZoVp8&region=IN&libraries=places&callback=initAutocomplete&session_token="+GoogleAPISession;
    document.body.appendChild(js);
}
var cAjaxCall = function (url) {
    inScript = document.getElementById('inSrcipt');
    inScript = document.createElement('script');
    inScript.id = 'inScript';
    inScript.src = url;
    document.getElementsByTagName('script')[0].appendChild(inScript);
}

function bst(event) {
    var key = event.keyCode;
    if (key == 8) {
        resetPlace(0);
    }
}
function bstClear(event, sForm, iNum) {
    var aExcludedKeyCode = ['9'];
    var key = event.keyCode;
    var iKeyVal = aExcludedKeyCode.indexOf(key);
    if (iKeyVal == -1) {
        resetPlace(iNum, sForm);
    }
}
function bstClearConsult(iNum) {
    country = '';
    statename = '';
    placename = '';
    deglong = '';
    minlong = '';
    longdir = '';
    deglat = '';
    minlat = '';
    latdir = '';
    region_dist = '';
    latitude = '';
    longitude = '';
    if (iNum == 1) {
        var f = document.nakshathracontent;
    } else if (iNum == 2) {
        var f = document.frmplaceorder_consult;
    } else { }
    if (iNum == 1) {
        f.loc_country.value = "";
        f.loc_state.value = "";
        f.loc_txt_place_search.value = "";
        f.loc_longdeg.value = "";
        f.loc_longmin.value = "";
        f.loc_longdir.value = "";
        f.loc_latdeg.value = "";
        f.loc_latmin.value = "";
        f.loc_latdir.value = "";
        f.loc_region_dist.value = "";
        f.loc_correction.value = "";
        f.loc_timezone_name.value = "";
        f.loc_timezone.value = "";
        f.loc_latitude_google.value = "";
        f.loc_longitude_google.value = "";
    } else if (iNum == 2) {
        f.birth_country.value = "";
        f.birth_state.value = "";
        f.birth_txt_place_search.value = "";
        f.birth_longdeg.value = "";
        f.birth_longmin.value = "";
        f.birth_longdir.value = "";
        f.birth_latdeg.value = "";
        f.birth_latmin.value = "";
        f.birth_latdir.value = "";
        f.birth_region_dist.value = "";
        f.birth_correction.value = "";
        f.birth_timezone_name.value = "";
        f.birth_timezone.value = "";
        f.birth_latitude_google.value = "";
        f.birth_longitude_google.value = "";
    }
}
function resetPlace(i, form) {
    country = '';
    statename = '';
    placename = '';
    deglong = '';
    minlong = '';
    longdir = '';
    deglat = '';
    minlat = '';
    latdir = '';
    region_dist = '';
    latitude = '';
    longitude = '';
    var f = form || document.frmplaceorder;
    if (i == 3) { var f = form || document.frmpersonone; }
    else if (i == 4) { var f = form || document.frmpersontwo; }
    else if (i == 5) { var f = form || document.frmpersonthree; }
    else if (i == 6) { var f = form || document.frmpersonfour; }
    else if (i == 10) { var f = form || document.frmplaceorder_consult; }
    if (i == 0) {
        f.country.value = "";
        f.state.value = "";
        f.txt_place_search.value = "";
        f.longdeg.value = "";
        f.longmin.value = "";
        f.longdir.value = "";
        f.latdeg.value = "";
        f.latmin.value = "";
        f.latdir.value = "";
        f.region_dist.value = "";
        f.correction.value = "";
        f.timezone_name.value = "";
        f.timezone.value = "";
        f.latitude_google.value = "";
        f.longitude_google.value = "";
    } else if (i == 1) {
        f.loc_country.value = "";
        f.loc_state.value = "";
        f.loc_txt_place_search.value = "";
        f.loc_longdeg.value = "";
        f.loc_longmin.value = "";
        f.loc_longdir.value = "";
        f.loc_latdeg.value = "";
        f.loc_latmin.value = "";
        f.loc_latdir.value = "";
        f.loc_region_dist.value = "";
        f.loc_correction.value = "";
        f.loc_timezone_name.value = "";
        f.loc_timezone.value = "";
        f.loc_latitude_google.value = "";
        f.loc_longitude_google.value = "";
    } else if (i == 2) {
        f.p_country.value = "";
        f.p_state.value = "";
        f.p_txt_place_search.value = "";
        f.p_longdeg.value = "";
        f.p_longmin.value = "";
        f.p_longdir.value = "";
        f.p_latdeg.value = "";
        f.p_latmin.value = "";
        f.p_latdir.value = "";
        f.p_region_dist.value = "";
        f.p_correction.value = "";
        f.p_timezone_name.value = "";
        f.p_timezone.value = "";
        f.p_latitude_google.value = "";
        f.p_longitude_google.value = "";
    } else if (i == 3) {
        f.country.value = "";
        f.state.value = "";
        f.txt_place_search.value = "";
        f.longdeg.value = "";
        f.longmin.value = "";
        f.longdir.value = "";
        f.latdeg.value = "";
        f.latmin.value = "";
        f.latdir.value = "";
        f.region_dist.value = "";
        f.correction.value = "";
        f.timezone_name.value = "";
        f.timezone.value = "";
        f.latitude_google.value = "";
        f.longitude_google.value = "";
    } else if (i == 4) {
        f.p2country.value = "";
        f.p2state.value = "";
        f.p2txt_place_search.value = "";
        f.p2longdeg.value = "";
        f.p2longmin.value = "";
        f.p2longdir.value = "";
        f.p2latdeg.value = "";
        f.p2latmin.value = "";
        f.p2latdir.value = "";
        f.p2region_dist.value = "";
        f.p2correction.value = "";
        f.p2timezone_name.value = "";
        f.p2timezone.value = "";
        f.p2latitude_google.value = "";
        f.p2longitude_google.value = "";
    } else if (i == 5) {
        f.p3country.value = "";
        f.p3state.value = "";
        f.p3txt_place_search.value = "";
        f.p3longdeg.value = "";
        f.p3longmin.value = "";
        f.p3longdir.value = "";
        f.p3latdeg.value = "";
        f.p3latmin.value = "";
        f.p3latdir.value = "";
        f.p3region_dist.value = "";
        f.p3correction.value = "";
        f.p3timezone_name.value = "";
        f.p3timezone.value = "";
        f.p3latitude_google.value = "";
        f.p3longitude_google.value = "";
    } else if (i == 6) {
        f.p4country.value = "";
        f.p4state.value = "";
        f.p4txt_place_search.value = "";
        f.p4longdeg.value = "";
        f.p4longmin.value = "";
        f.p4longdir.value = "";
        f.p4latdeg.value = "";
        f.p4latmin.value = "";
        f.p4latdir.value = "";
        f.p4region_dist.value = "";
        f.p4correction.value = "";
        f.p4timezone_name.value = "";
        f.p4timezone.value = "";
        f.p4latitude_google.value = "";
        f.p4longitude_google.value = "";
    } else if (i == 7) {
        f.country.value = "";
        f.state.value = "";
        f.txt_place_search.value = "";
        f.longdeg.value = "";
        f.longmin.value = "";
        f.longdir.value = "";
        f.latdeg.value = "";
        f.latmin.value = "";
        f.latdir.value = "";
        f.region_dist.value = "";
        f.correction.value = "";
        f.timezone_name.value = "";
        f.loc_timezone_name.value = "";
        f.timezone.value = "";
        f.latitude_google.value = "";
        f.longitude_google.value = "";
    } else if (i == 10) {
        f.birth_country.value = "";
        f.birth_state.value = "";
        f.birth_txt_place_search.value = "";
        f.birth_longdeg.value = "";
        f.birth_longmin.value = "";
        f.birth_longdir.value = "";
        f.birth_latdeg.value = "";
        f.birth_latmin.value = "";
        f.birth_latdir.value = "";
        f.birth_region_dist.value = "";
        f.birth_correction.value = "";
        f.birth_timezone_name.value = "";
        f.birth_timezone.value = "";
        f.birth_latitude_google.value = "";
        f.birth_longitude_google.value = "";
    }
}

function setPlaceFields(i, form) {
    var f = form || document.frmplaceorder;
    /**/
    if (i == 3) {
        var f = form || document.frmpersonone;
    } else if (i == 4) {
        var f = form || document.frmpersontwo;
    } else if (i == 5) {
        var f = form || document.frmpersonthree;
    } else if (i == 6) {
        var f = form || document.frmpersonfour;
    } else if (i == 8) {
        var f = form || document.nakshathracontent;
    } else if (i == 10) {
        var f = form || document.frmplaceorder_consult;
    }
    var name = form.name.value;
    if ((i != 3) && (i != 4) && (i != 5) && (i != 6)) {
        var email = form.email.value;
    }
    // var _if = document.createElement('iframe');
    //   _if.style.position = "fixed";
    //   _if.style.height = "50px";
    //   _if.style.top = "-500px";
    //   _if.src = "https://www.clickastro.com/test/widget/identify.php?p="+placename+"&n="+name+"&e="+email;
    //document.body.appendChild(_if);
    /**/
    if (i == 0) {
        f.country.value = country;
        f.state.value = statename;
        f.txt_place_search.value = placename;
        f.longdeg.value = deglong;
        f.longmin.value = minlong;
        f.longdir.value = longdir;
        f.latdeg.value = deglat;
        f.latmin.value = minlat;
        f.latdir.value = latdir;
        f.region_dist.value = region_dist;
        f.latitude_google.value = latitude;
        f.longitude_google.value = longitude;
        f.correction.value = '';
        f.timezone.value = tzoname;
        f.timezone_name.value = tzoname;
        if (f.country.value == 'India') {
            f.correction.value = '0';
            f.timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);

            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.timezone.value = sTimezone;
            return true;
        }
    } else if (i == 1 || i == 8) {
        f.loc_country.value = country;
        f.loc_state.value = statename;
        f.loc_txt_place_search.value = placename;
        f.loc_longdeg.value = deglong;
        f.loc_longmin.value = minlong;
        f.loc_longdir.value = longdir;
        f.loc_latdeg.value = deglat;
        f.loc_latmin.value = minlat;
        f.loc_latdir.value = latdir;
        f.loc_region_dist.value = region_dist;
        f.loc_latitude_google.value = latitude;
        f.loc_longitude_google.value = longitude;
        f.loc_correction.value = '';
        f.loc_timezone_name.value = tzoname;
        f.loc_timezone.value = tzoname;
        if (f.loc_country.value == 'India') {
            f.loc_correction.value = '0';
            f.loc_timezone.value = '05.30E';
        } else {
            var sMTimezone = getTimezone(latitude, longitude);
            f.loc_timezone.value = (!f.loc_timezone.value ? sMTimezone : f.loc_timezone.value);
            return true;
        }
    } else if (i == 2) {
        f.p_country.value = country;
        f.p_state.value = statename;
        f.p_txt_place_search.value = placename;
        f.p_longdeg.value = deglong;
        f.p_longmin.value = minlong;
        f.p_longdir.value = longdir;
        f.p_latdeg.value = deglat;
        f.p_latmin.value = minlat;
        f.p_latdir.value = latdir;
        f.p_region_dist.value = region_dist;
        f.p_latitude_google.value = latitude;
        f.p_longitude_google.value = longitude;
        f.p_correction.value = '';
        f.p_timezone.value = tzoname;
        f.p_timezone_name.value = tzoname;
        if (f.p_country.value == 'India') {
            f.p_correction.value = '0';
            f.p_timezone.value = '05.30E';
        } else {
            var sFTimezone = getTimezone(latitude, longitude);
            f.p_timezone.value = (!f.p_timezone.value ? sFTimezone : f.p_timezone.value);
            return true;
        }
    } else if (i == 3) {
        f.country.value = country;
        f.state.value = statename;
        f.txt_place_search.value = placename;
        f.longdeg.value = deglong;
        f.longmin.value = minlong;
        f.longdir.value = longdir;
        f.latdeg.value = deglat;
        f.latmin.value = minlat;
        f.latdir.value = latdir;
        f.region_dist.value = region_dist;
        f.latitude_google.value = latitude;
        f.longitude_google.value = longitude;
        f.correction.value = '';
        f.timezone.value = tzoname;
        f.timezone_name.value = tzoname;
        if (f.country.value == 'India') {
            f.correction.value = '0';
            f.timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);
            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.timezone.value = sTimezone;
            return true;
        }
    } else if (i == 4) {
        f.p2country.value = country;
        f.p2state.value = statename;
        f.p2txt_place_search.value = placename;
        f.p2longdeg.value = deglong;
        f.p2longmin.value = minlong;
        f.p2longdir.value = longdir;
        f.p2latdeg.value = deglat;
        f.p2latmin.value = minlat;
        f.p2latdir.value = latdir;
        f.p2region_dist.value = region_dist;
        f.p2latitude_google.value = latitude;
        f.p2longitude_google.value = longitude;
        f.p2correction.value = '';
        f.p2timezone.value = tzoname;
        f.p2timezone_name.value = tzoname;
        if (f.p2country.value == 'India') {
            f.p2correction.value = '0';
            f.p2timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);

            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.p2timezone.value = sTimezone;
            return true;
        }
    } else if (i == 5) {
        f.p3country.value = country;
        f.p3state.value = statename;
        f.p3txt_place_search.value = placename;
        f.p3longdeg.value = deglong;
        f.p3longmin.value = minlong;
        f.p3longdir.value = longdir;
        f.p3latdeg.value = deglat;
        f.p3latmin.value = minlat;
        f.p3latdir.value = latdir;
        f.p3region_dist.value = region_dist;
        f.p3latitude_google.value = latitude;
        f.p3longitude_google.value = longitude;
        f.p3correction.value = '';
        f.p3timezone.value = tzoname;
        f.p3timezone_name.value = tzoname;
        if (f.p3country.value == 'India') {
            f.p3correction.value = '0';
            f.p3timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);

            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.p3timezone.value = sTimezone;
            return true;
        }
    } else if (i == 6) {
        f.p4country.value = country;
        f.p4state.value = statename;
        f.p4txt_place_search.value = placename;
        f.p4longdeg.value = deglong;
        f.p4longmin.value = minlong;
        f.p4longdir.value = longdir;
        f.p4latdeg.value = deglat;
        f.p4latmin.value = minlat;
        f.p4latdir.value = latdir;
        f.p4region_dist.value = region_dist;
        f.p4latitude_google.value = latitude;
        f.p4longitude_google.value = longitude;
        f.p4correction.value = '';
        f.p4timezone.value = tzoname;
        f.p4timezone_name.value = tzoname;
        if (f.p4country.value == 'India') {
            f.p4correction.value = '0';
            f.p4timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);

            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.p4timezone.value = sTimezone;
            return true;
        }
    }
    else if (i == 7) {
        f.country.value = country;
        f.state.value = statename;
        f.txt_place_search.value = placename;
        f.longdeg.value = deglong;
        f.longmin.value = minlong;
        f.longdir.value = longdir;
        f.latdeg.value = deglat;
        f.latmin.value = minlat;
        f.latdir.value = latdir;
        f.region_dist.value = region_dist;
        f.latitude_google.value = latitude;
        f.longitude_google.value = longitude;
        f.correction.value = '';
        f.timezone.value = tzoname;
        f.timezone_name.value = tzoname;
        f.loc_timezone_name.value = tzoname;
        if (f.country.value == 'India') {
            f.correction.value = '0';
            f.timezone.value = '05.30E';
        } else {
            //f.m_timezone.value = getTimezone(latitude, longitude);

            var sTimezone = getTimezone(latitude, longitude);
            //f.timezone.value      = (!f.timezone.value ? sTimezone : f.timezone.value);
            f.timezone.value = sTimezone;
            return true;
        }
    } else if (i == 10) {
        f.birth_country.value = country;
        f.birth_state.value = statename;
        f.birth_txt_place_search.value = placename;
        f.birth_longdeg.value = deglong;
        f.birth_longmin.value = minlong;
        f.birth_longdir.value = longdir;
        f.birth_latdeg.value = deglat;
        f.birth_latmin.value = minlat;
        f.birth_latdir.value = latdir;
        f.birth_region_dist.value = region_dist;
        f.birth_latitude_google.value = latitude;
        f.birth_longitude_google.value = longitude;
        f.birth_correction.value = '';
        f.birth_timezone.value = tzoname;
        f.birth_timezone_name.value = tzoname;
        if (f.birth_country.value == 'India') {
            f.birth_correction.value = '0';
            f.birth_timezone.value = '05.30E';
        } else {
            var sTimezone = getTimezone(latitude, longitude);
            f.birth_timezone.value = sTimezone;
            return true;
        }
    }
    //console.log(f);
}
var bg = null;
var gpActiveForm = null;

var timeCorrections = ["Standard Time", "Summer time(daylight saving)", "Double summer time", "War time"];
var sSubmitFormAttr = '';
var aUserLocation = ['loc_correction', 'loc_timezone', 'loc_country', 'loc_timezone_name'];
var aPartnerLocation = ['p_correction', 'p_timezone', 'p_country', 'p_timezone_name'];
var aUserDob = ['dobyear', 'dobday', 'dobmonth', 'dobyear', 'tobhour', 'ampm', 'tobmin'];
var aUserMaleDob = ['m_dobyear', 'm_dobday', 'm_dobmonth', 'm_dobyear', 'm_tobhour', 'm_ampm', 'm_tobmin'];
var aUserFemaleDob = ['f_dobyear', 'f_dobday', 'f_dobmonth', 'f_dobyear', 'f_tobhour', 'f_ampm', 'f_tobmin'];
var aSelectedLocation = [];
var sSelectDob = [];
var sSelectDobPartner = [];

function checkDstAndSubmit(sForm) {
    sSubmitFormAttr = sForm;
    var sFormElements = sSubmitFormAttr.elements;

    //if(sFormElements['loc_txt_place_search'].value != '') {
    if (sGlobalDisplayName == 'MP') {
        aSelectedLocation = aUserLocation;
        //} else if(sFormElements['p_txt_place_search'].value != '') {
    } else if (sGlobalDisplayName == 'SM' || sGlobalDisplayName == 'CU') {
        aSelectedLocation = aPartnerLocation;
    } else {
        aSelectedLocation = aUserLocation;
    }

    //if(sFormElements['p_txt_place_search'].value != '') {
    if (sGlobalDisplayName == 'SM' || sGlobalDisplayName == 'CU') {
        sSelectDob = aUserMaleDob;
        sSelectDobPartner = aUserFemaleDob;
    } else {
        sSelectDob = aUserDob;
        sSelectDobPartner = aUserDob;
    }


    if (sSubmitFormAttr.correction.value != '') {
        //sSubmitFormAttr.submit();
        vaidateMSubmit(sSubmitFormAttr.timezone.value,
            sSubmitFormAttr.correction.value);
        return;
    }
    else if (sSubmitFormAttr.country.value == 'India' && pInt(sSubmitFormAttr[sSelectDob[0]].value) > 1945) {
        vaidateMSubmit(sSubmitFormAttr.timezone.value, 0);
    }
    else {
        dobday = sSubmitFormAttr[sSelectDob[1]].value;
        dobmonth = sSubmitFormAttr[sSelectDob[2]].value;
        dobyear = sSubmitFormAttr[sSelectDob[3]].value;
        h = pInt(sSubmitFormAttr[sSelectDob[4]].value) + (sSubmitFormAttr[sSelectDob[5]][0].checked ? 0 : 12);
        h = (h == 24 ? 12 : (h == 12 ? 0 : h));
        tob = h + ":" + sSubmitFormAttr[sSelectDob[6]].value;
        tzname = sSubmitFormAttr.timezone_name.value;
        url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
            '&timezone_name=' + tzname + '&callback=vaidateMSubmit';
        //alert(url);
        cAjaxCall(url);
    }
}

function pInt(v) {
    v = parseInt(v, 10);
    return v;
}

function vaidateMSubmit(tzone, corr) {
    //sSubmitFormAttr.correction.value = timeCorrections[corr];
    sSubmitFormAttr.correction.value = corr;
    if (tzone != 'null') sSubmitFormAttr.timezone.value = tzone;
    if (sSubmitFormAttr[aSelectedLocation[0]].value != '') {
        //sSubmitFormAttr.submit();
        vaidateFSubmit(sSubmitFormAttr[aSelectedLocation[1]].value,
            sSubmitFormAttr[aSelectedLocation[0]].value);
        return;
    } else if (sSubmitFormAttr[aSelectedLocation[2]].value == 'India' && pInt(sSubmitFormAttr[sSelectDobPartner[0]].value) > 1945) {
        vaidateFSubmit(sSubmitFormAttr[aSelectedLocation[1]].value, 0);
    } else {
        dobday = sSubmitFormAttr[sSelectDobPartner[1]].value;
        dobmonth = sSubmitFormAttr[sSelectDobPartner[2]].value;
        dobyear = sSubmitFormAttr[sSelectDobPartner[3]].value;
        h = pInt(sSubmitFormAttr[sSelectDobPartner[4]].value) + (sSubmitFormAttr[sSelectDobPartner[5]][0].checked ? 0 : 12);
        h = (h == 24 ? 12 : (h == 12 ? 0 : h));
        tob = h + ":" + sSubmitFormAttr[sSelectDobPartner[6]].value;
        loc_tzname = sSubmitFormAttr[aSelectedLocation[3]].value;
        url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
            '&timezone_name=' + loc_tzname + '&callback=vaidateFSubmit';
        cAjaxCall(url);
    }
}

function vaidateFSubmit(tzone, corr) {
    //sSubmitFormAttr[aSelectedLocation[0]].value = timeCorrections[corr];
    sSubmitFormAttr[aSelectedLocation[0]].value = corr;
    if (tzone != 'null') sSubmitFormAttr[aSelectedLocation[1]].value = tzone;

    sSubmitFormAttr.submit();
}


function getTimezone(latitude, longitude) {
    var json = (function () {
        var json = null;
        $.ajax({
            'async': false
            , 'global': false
            , 'url': "https://report.clickastro.com/tz/index.php?latitude=" + latitude + "&longitude=" + longitude
            , 'dataType': "json"
            , 'success': function (data) {
                json = data;
            }
        });
        return json;
    })();
    var jsonstring = JSON.stringify(json);
    var obj = jQuery.parseJSON(jsonstring);
    f_tzoname = obj.timezone;
    return f_tzoname;
}

function checkDstAndSubmitSingle(i, form) {
    var f = form || document.frmplaceorder;
    gpActiveForm = f;
    dobday = f.dobday.value;
    dobmonth = f.dobmonth.value;
    dobyear = f.dobyear.value;
    tob = f.tobhour.value + ":" + f.tobmin.value;
    tzname = tzoname;
    url = 'https://report.clickastro.com/tz/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob + '&timezone_name=' + tzname + '&callback=validateSubmit';
    cAjaxCall(url);
}

function showDSTPrompt(tzone, corr) {
    name = gpActiveForm.name.value;
    msg = '<div style="border:15px solid #fff;font-size:14px;text-align:center;font-family:Arial">Please confirm whether the time of birth <b>' + '</b> is during DST</div><br/><br/>' + '<div align="center"><button style="padding:3px;" onclick="javascript:vaidateSubmit(\'' + tzone + '\',' + corr + ')">Yes, its during DST </button><br/><br/>' + '<button style="padding:3px;" onclick="javascript:vaidateSubmit(\'' + tzone + '\',0)">No, its during Standard Time</button></div>';
    bg = document.createElement('div');
    document.body.appendChild(bg);
    bg.style.width = '300px';
    bg.style.border = '2px solid #666';
    bg.style.height = '200px';
    bg.style.left = (screen.width - 300) / 2;
    bg.style.top = (screen.height - 210) / 2;
    bg.style.background = '#fff';
    bg.style.position = (document.all) ? 'absolute' : 'fixed';
    bg.style.zIndex = 1001;
    bg.innerHTML = '<b>' + msg + '</b>';
}

function validateSubmit(tzone, corr, prompt) {
    if (prompt == true) {
        showDSTPrompt(tzone, corr);
    } else {
        if (bg) document.body.removeChild(bg);
        gpActiveForm.correction.value = corr;
        gpActiveForm.timezone.value = tzone;
        gpActiveForm.timezone.value = tzone;
        gpActiveForm.submit();
    }
}

function urldecode(url) {
    return decodeURIComponent(url.replace(/\+/g, ' '));
}

function error(m, e) {
    e.style.backgroundColor = (!m) ? "#fff" : "#f66";
}

function selectHoroscope(sType) {
    if (sType == 'MP') {
        sGlobalHoroscope = 1;
    } else {
        sGlobalHoroscope = 0;
    }
}

function checkDstAndSubmitP() {

    if (document.frmMatchingPremium.m_correction.value != '') {
        //document.frmMatchingPremium.submit();
        vaidateMSubmitP(document.frmMatchingPremium.m_timezone.value,
            document.frmMatchingPremium.m_correction.value);
        return;
    }
    else if (document.frmMatchingPremium.m_country.value == 'India' && pInt(document.frmMatchingPremium.m_dobyear.value) > 1945) {
        vaidateMSubmitP(document.frmMatchingPremium.m_timezone.value, 0);
    }
    else {
        dobday = document.frmMatchingPremium.dobday.value;
        dobmonth = document.frmMatchingPremium.dobmonth.value;
        dobyear = document.frmMatchingPremium.dobyear.value;
        h = pInt(document.frmMatchingPremium.m_tobhour.value) + (document.frmMatchingPremium.ampm[0].checked ? 0 : 12);
        h = (h == 24 ? 12 : (h == 12 ? 0 : h));
        tob = h + ":" + document.frmMatchingPremium.tobmin.value;
        tzname = document.frmMatchingPremium.timezone_name.value;
        url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
            '&timezone_name=' + tzname + '&callback=vaidateMSubmitP';
        //alert(url);
        cAjaxCall(url);
    }
}
function vaidateMSubmitP(tzone, corr, prompt) {
    if (prompt == true) {
        showDSTPrompt("Male Data", tzone, corr);
    }
    else {
        document.frmMatchingPremium.m_correction.value = timeCorrections[corr];
        if (tzone != 'null') document.frmMatchingPremium.m_timezone.value = tzone;
        if (document.frmMatchingPremium.f_correction.value != '') {
            //document.frmMatchingPremium.submit();
            vaidateFSubmitP(document.frmMatchingPremium.f_timezone.value,
                document.frmMatchingPremium.f_correction.value);
            return;
        }
        else if (document.frmMatchingPremium.f_country.value == 'India' && pInt(document.frmMatchingPremium.f_dobyear.value) > 1945) {
            vaidateFSubmitP(document.frmMatchingPremium.f_timezone.value, 0);
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////
        else {
            dobday = document.frmMatchingPremium.f_dobday.value;
            dobmonth = document.frmMatchingPremium.f_dobmonth.value;
            dobyear = document.frmMatchingPremium.f_dobyear.value;
            h = pInt(document.frmMatchingPremium.f_tobhour.value) + (document.frmMatchingPremium.f_ampm[0].checked ? 0 : 12);
            h = (h == 24 ? 12 : (h == 12 ? 0 : h));
            tob = h + ":" + document.frmMatchingPremium.f_tobmin.value;
            f_tzname = document.frmMatchingPremium.f_timezone_name.value;
            url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
                '&timezone_name=' + f_tzname + '&callback=vaidateFSubmitP';
            //alert(url);
            cAjaxCall(url);
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////
    }
}

function vaidateFSubmitP(tzone, corr, prompt) {
    if (prompt == true) {
        showDSTPrompt("Female Data", tzone, corr);
    }
    else {
        document.frmMatchingPremium.f_correction.value = timeCorrections[corr];
        if (tzone != 'null') document.frmMatchingPremium.f_timezone.value = tzone;
        //document.frmMatchingPremium.submit();
        //alert(document.frmMatchingPremium);
        document.getElementById('frmMatchingPremium').submit();
        //  alert('about to submit');
    }
}

function checkDstAndSubmitM() {
    if (document.frmMonthlyPremium.m_correction.value != '') {
        //document.frmMonthlyPremium.submit();
        vaidateMSubmitM(document.frmMonthlyPremium.m_timezone.value,
            document.frmMonthlyPremium.m_correction.value);
        return;
    }
    else if (document.frmMonthlyPremium.m_country.value == 'India' && pInt(document.frmMonthlyPremium.m_dobyear.value) > 1945) {
        vaidateMSubmitM(document.frmMonthlyPremium.m_timezone.value, 0);
    }
    else {
        dobday = document.frmMonthlyPremium.dobday.value;
        dobmonth = document.frmMonthlyPremium.dobmonth.value;
        dobyear = document.frmMonthlyPremium.dobyear.value;
        h = pInt(document.frmMonthlyPremium.tobhour.value) + (document.frmMonthlyPremium.ampm[0].checked ? 0 : 12);
        h = (h == 24 ? 12 : (h == 12 ? 0 : h));
        tob = h + ":" + document.frmMonthlyPremium.tobmin.value;
        tzname = document.frmMonthlyPremium.m_timezone_name.value;
        url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
            '&timezone_name=' + tzname + '&callback=vaidateMSubmitM';
        //alert(url);
        cAjaxCall(url);
    }
}
function vaidateMSubmitM(tzone, corr, prompt) {
    if (prompt == true) {
        showDSTPrompt("Male Data", tzone, corr);
    }
    else {
        document.frmMonthlyPremium.m_correction.value = timeCorrections[corr];
        if (tzone != 'null') document.frmMonthlyPremium.m_timezone.value = tzone;
        if (document.frmMonthlyPremium.f_correction.value != '') {
            //document.frmMonthlyPremium.submit();
            vaidateFSubmitM(document.frmMonthlyPremium.f_timezone.value,
                document.frmMonthlyPremium.f_correction.value);
            return;
        }
        else if (document.frmMonthlyPremium.f_country.value == 'India' && pInt(document.frmMonthlyPremium.f_dobyear.value) > 1945) {
            vaidateFSubmitM(document.frmMonthlyPremium.f_timezone.value, 0);
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////
        else {
            dobday = document.frmMonthlyPremium.dobday.value;
            dobmonth = document.frmMonthlyPremium.dobmonth.value;
            dobyear = document.frmMonthlyPremium.dobyear.value;
            h = pInt(document.frmMonthlyPremium.tobhour.value) + (document.frmMonthlyPremium.ampm[0].checked ? 0 : 12);
            h = (h == 24 ? 12 : (h == 12 ? 0 : h));
            tob = h + ":" + document.frmMonthlyPremium.tobmin.value;
            f_tzname = document.frmMonthlyPremium.f_timezone_name.value;
            url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
                '&timezone_name=' + f_tzname + '&callback=vaidateFSubmitM';
            //alert(url);
            cAjaxCall(url);
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////
    }
}

function vaidateFSubmitM(tzone, corr, prompt) {
    if (prompt == true) {
        showDSTPrompt("Female Data", tzone, corr);
    }
    else {
        document.frmMonthlyPremium.f_correction.value = timeCorrections[corr];
        if (tzone != 'null') document.frmMonthlyPremium.f_timezone.value = tzone;
        document.frmMonthlyPremium.m_txtCity.value = document.frmMonthlyPremium.cityofbirthfill.value;
        //document.frmMonthlyPremium.submit();
        //alert(document.frmMonthlyPremium);
        //console.log(document.getElementById('frmMonthlyPremium').action);
        document.getElementById('frmMonthlyPremium').submit();
        //  alert('about to submit');
    }
}

function checkDstAndSubmitCallback(form, callback, fromform = '') {
    dobday = form.dobday.value;
    dobmonth = form.dobmonth.value;
    dobyear = form.dobyear.value;
    h = pInt(form.tobhour.value) + (form.ampm[0].checked ? 0 : 12);
    h = (h == 24 ? 12 : (h == 12 ? 0 : h));
    tob = h + ":" + form.tobmin.value;
    if (fromform == 'yogacontent') { tzname = form.timezone_name.value; } else { tzname = form.loc_timezone_name.value; }
    url = '/astro-campaign/dstcheck.php?dobday=' + dobday + '&dobmonth=' + dobmonth + '&dobyear=' + dobyear + '&tob=' + tob +
        '&timezone_name=' + tzname + '&callback=' + callback;
    cAjaxCall(url);
}