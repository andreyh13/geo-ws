Google Maps Web Services Requests Builder
==========================================

![WS Builder](/image/docs/geo-ws.png?raw=true "Maps WS Builder")

## Description
This application allows to construct Google Maps WebServices HTTPS requests.

The Google Maps Web Services Requests Builder application is available for the following Google Maps 
APIs:

 - [Geocoding API]
 - [Directions API]
 - [Distance Matrix API]
 - [Elevation API]
 - [Time Zone API]
 - [Places API]
 - [Roads API]

### Settings

To start working with Requests Builder please fill in the Settings for your API keys, client ID, crypto key, etc. 

![Settings Config](/image/docs/geo-ws-settings.png?raw=true "Maps WS Builder Settings")

Please put the following values:
 - In **API key** field you should enter the value of the free version's API key that you generated in your developer console project. Please follow [documentation](https://developers.google.com/maps/documentation/geocoding/get-api-key) for more details. Please note that you have to enable all APIs mentioned above in your project to be able to construct all free version's requests.
 - **Client ID** and **Crypto Key**. If you have a Google Maps for Work license you should enter there the corresponding values of your client ID and cryptographic key. Please read [authenticate and authorize Maps for Work documentation](https://developers.google.com/maps/documentation/business/webservices/auth) for more details.
 - **Places for Work API key**. If you have a Places API for Work license please enter here the value of the API key from your locked Places API - Zagat Content project.
 - **Roads for Work API key**. If you have a Maps for Work license and enabled the Roads API, please enter here the value of the API key from your locked Roads API project.
 - **Server URL**. Please enter the http://aux.xomena.elementfx.com/geows.php
 - **Digital Signature URL**. Please enter the http://aux.xomena.elementfx.com/geowssign.php
 - If you would like to execute all stored requests on page load, please mark the corresponding checkbox.
 
 ### Select version and format
 
 ### Select web service
 
 ### List of parameters 
 
 ### Web Service URL and response text
 
 ### Visualization of results on map
 
 ### Export and import
 
[Geocoding API]: https://developers.google.com/maps/documentation/geocoding 
[Directions API]: https://developers.google.com/maps/documentation/directions
[Distance Matrix API]: https://developers.google.com/maps/documentation/distancematrix
[Elevation API]: https://developers.google.com/maps/documentation/elevation
[Time Zone API]: https://developers.google.com/maps/documentation/timezone
[Places API]: https://developers.google.com/places/documentation/index
[Roads API]: https://developers.google.com/maps/documentation/roads