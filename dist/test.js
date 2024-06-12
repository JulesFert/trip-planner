"use strict";
let app = {
    lat: [],
    lng: [],
    destinationName: "",
    arrivalDate: [],
    duration: [],
    destinationslist: [],
    destinationAdded: false,
    count: 0,
    map: null,
    routeLayer: null,
    init: function () {
        var _a;
        // j'initialise l'autocomplétion avec l'API google places
        app.initAutocomplete();
        // je crée la carte avec Leaflet
        app.createMap();
        // j'ajoute un écouteur d'évenement au form pour le submit
        (_a = document.getElementById('destination-form')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', app.handleSubmitForm);
        // he charge les données du local storage
        app.loadFromLocalStorage();
        console.log('init ok');
    },
    initAutocomplete: function () {
        // je vais chercher l'input du form
        const input = document.getElementById('autocomplete');
        // je charge la constante 'options'
        const options = {
            types: ['(cities)'],
            componentRestrictions: { country: 'fr' }
        };
        // je vais chercher un nouvel objet places que je charge avec l'input et les options
        const autocomplete = new google.maps.places.Autocomplete(input, options);
        // j'ajoute un écouteur d'évènement sur l'objet autocomplete
        // lorsque l'user sélectionne un lieu dans la liste de suggestion
        autocomplete.addListener('place_changed', () => {
            // je récupère l'objet place, qui correspond au lieu sélectionné
            const place = autocomplete.getPlace();
            // si le lieu contient des coordonnées
            if (place.geometry && place.geometry.location) {
                // je les stock
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                // je les stock dans le module plus haut
                app.lat.push(lat);
                app.lng.push(lng);
                // je stock aussi le nom de la destination
                app.destinationName = input.value;
            }
            else {
                console.log('No details available for input: ' + input.value);
            }
        });
    },
    createMap: function (latt = 45.764043, lngg = 4.835659) {
        const lyon = {
            lat: latt,
            lng: lngg
        };
        const zoomLevel = 7;
        // Initialisation de la carte et stockage dans app.map
        app.map = L.map('map').setView([lyon.lat, lyon.lng], zoomLevel);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(app.map);
    },
    handleSubmitForm: function (event) {
        // je stoppe le chargement de la page
        event.preventDefault();
        // si la destination rentrée existe déjà dans le tableau destinationList
        if (app.destinationslist.includes(app.destinationName)) {
            // erreur
            console.log('Vous ne pouvez pas rentrer deux fois la meme destination !');
            // je clean tous les form
            const inputElements = document.querySelectorAll('#destination-form input');
            const inputArray = Array.from(inputElements);
            for (const input of inputArray) {
                input.value = '';
            }
        }
        else {
            // Affiche le marqueur à l'emplacement indiqué
            L.marker([app.lat[app.count], app.lng[app.count]]).addTo(app.map);
            // je récupère la date d'arrivée ainsi que la durée de séjour
            const arrivalDateElement = document.getElementById('arrival-date');
            const stayDaysElement = document.getElementById('stay-days');
            if (arrivalDateElement && stayDaysElement) {
                app.arrivalDate.push(arrivalDateElement.value);
                app.duration.push(stayDaysElement.value);
            }
            // je clean tous les form
            const inputElements = document.querySelectorAll('#destination-form input');
            const inputArray = Array.from(inputElements);
            for (const input of inputArray) {
                input.value = '';
            }
            // je stock l'info qu'une destination est rentrée et incrémente le compte de 1 
            app.destinationAdded = true;
            app.count += 1;
            // j'ajoute la destination rentrée dans le tableau destinationList
            app.destinationslist.push(app.destinationName);
        }
        // je met à jour l'itinéraire
        app.updateItinerary();
        // je trace la route entre les points
        app.drawRoute();
        // je sauvegarde dans le localStorage
        app.saveToLocalStorage();
    },
    updateItinerary: function () {
        var _a;
        // dans tous les cas, j'ajoute la nouvelle destination à l'itinéraire 
        // je récupère la liste itinéraire
        const itineraryList = (_a = document.getElementById('itinerary')) !== null && _a !== void 0 ? _a : document.createElement('ul');
        // je crée un élément li vide
        const destinationToAdd = document.createElement('li');
        // je lui ajoute le nom de la destination
        destinationToAdd.textContent = app.destinationName;
        // je crée aussi un p avec la date d'arrivée
        const arrivalDateDisplay = document.createElement('p');
        const durationTrip = document.createElement('p');
        // je lui ajoute le contenu de la date d'arrivée
        arrivalDateDisplay.textContent = app.arrivalDate[app.count - 1];
        durationTrip.textContent = app.duration[app.count - 1];
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Supprimer';
        deleteButton.addEventListener('click', () => app.handleDeleteDestination(app.count - 1));
        // je les ajoute à la liste <ul>
        itineraryList.append(destinationToAdd);
        destinationToAdd.append(arrivalDateDisplay);
        destinationToAdd.append(durationTrip);
        destinationToAdd.append(deleteButton);
    },
    handleDeleteDestination: function (index) {
        // Remove destination from arrays
        app.lat.splice(index, 1);
        app.lng.splice(index, 1);
        app.destinationslist.splice(index, 1);
        app.arrivalDate.splice(index, 1);
        app.duration.splice(index, 1);
        // Update count
        app.count -= 1;
        // Save updated data to localStorage
        app.saveToLocalStorage();
        // Redraw map and itinerary
        app.redrawMapAndItinerary();
    },
    redrawMapAndItinerary: function () {
        var _a;
        // Clear map and itinerary list
        app.map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                app.map.removeLayer(layer);
            }
        });
        const itineraryList = (_a = document.getElementById('itinerary')) !== null && _a !== void 0 ? _a : document.createElement('ul');
        itineraryList.innerHTML = '';
        // Add markers and itinerary items for remaining destinations
        app.lat.forEach((lat, index) => {
            L.marker([lat, app.lng[index]]).addTo(app.map);
            const destinationToAdd = document.createElement('li');
            destinationToAdd.textContent = app.destinationslist[index];
            const arrivalDateDisplay = document.createElement('p');
            const durationTrip = document.createElement('p');
            arrivalDateDisplay.textContent = app.arrivalDate[index];
            durationTrip.textContent = app.duration[index];
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => app.handleDeleteDestination(index));
            destinationToAdd.append(arrivalDateDisplay);
            destinationToAdd.append(durationTrip);
            destinationToAdd.append(deleteButton);
            itineraryList.append(destinationToAdd);
        });
        // Draw the route with remaining destinations
        app.drawRoute();
    },
    drawRoute: function () {
        if (app.lat.length < 2)
            return;
        const waypoints = app.lat.map((lat, index) => ({ lat: lat, lng: app.lng[index] }));
        const directionsService = new google.maps.DirectionsService();
        const directionsRequest = {
            origin: waypoints[0],
            destination: waypoints[waypoints.length - 1],
            travelMode: google.maps.TravelMode.DRIVING,
            waypoints: waypoints.slice(1, -1).map(waypoint => ({ location: new google.maps.LatLng(waypoint.lat, waypoint.lng), stopover: true })),
            optimizeWaypoints: true
        };
        directionsService.route(directionsRequest, function (response, status) {
            if (status === 'OK') {
                const route = response.routes[0];
                const line = [];
                route.legs.forEach((leg) => {
                    leg.steps.forEach((step) => {
                        step.path.forEach((point) => {
                            line.push([point.lat(), point.lng()]);
                        });
                    });
                });
                if (app.routeLayer) {
                    app.map.removeLayer(app.routeLayer);
                }
                app.routeLayer = L.polyline(line, { color: 'blue' }).addTo(app.map);
            }
            else {
                console.error('Directions request failed due to ' + status);
            }
        });
    },
    saveToLocalStorage: function () {
        const data = {
            lat: app.lat,
            lng: app.lng,
            destinationslist: app.destinationslist,
            count: app.count,
            arrivalDate: app.arrivalDate,
            duration: app.duration
        };
        localStorage.setItem('tripPlannerData', JSON.stringify(data));
    },
    loadFromLocalStorage: function () {
        const storedDataString = localStorage.getItem('tripPlannerData');
        if (storedDataString !== null) {
            const data = JSON.parse(storedDataString);
            if (data) {
                app.lat = data.lat;
                app.lng = data.lng;
                app.destinationslist = data.destinationslist;
                app.count = data.count;
                app.arrivalDate = data.arrivalDate;
                app.duration = data.duration;
                app.lat.forEach((lat, index) => {
                    L.marker([lat, app.lng[index]]).addTo(app.map);
                });
                app.updateItineraryFromStorage();
                app.drawRoute();
            }
        }
    },
    updateItineraryFromStorage: function () {
        var _a;
        const itineraryList = (_a = document.getElementById('itinerary')) !== null && _a !== void 0 ? _a : document.createElement('ul');
        itineraryList.innerHTML = '';
        app.destinationslist.forEach((destination, index) => {
            const destinationToAdd = document.createElement('li');
            destinationToAdd.textContent = destination;
            const arrivalDateDisplay = document.createElement('p');
            const durationTrip = document.createElement('p');
            arrivalDateDisplay.textContent = app.arrivalDate[index];
            durationTrip.textContent = app.duration[index];
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => app.handleDeleteDestination(index));
            destinationToAdd.append(arrivalDateDisplay);
            destinationToAdd.append(durationTrip);
            destinationToAdd.append(deleteButton);
            itineraryList.append(destinationToAdd);
        });
    },
};
// Initialise l'application lorsque la page est chargée
// document.addEventListener('DOMContentLoaded', app.init)
function initMap() {
    app.init();
}
