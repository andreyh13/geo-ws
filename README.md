Google Maps Web Services and Image APIs Requests Builder
==========================================

![WS Builder](/image/docs/geo-ws.png?raw=true "Maps WS Builder")

## Description
This application allows to construct and test Google Maps Web Service, Static Maps API and Street View Image API HTTP requests. 
You can access it at [andreyh13.github.io/geo-ws](http://andreyh13.github.io/geo-ws/).

**Google Maps Web Services and Image APIs Requests Builder** is available for the following Google Maps 
APIs:

 - [Geocoding API]
 - [Directions API]
 - [Distance Matrix API]
 - [Elevation API]
 - [Time Zone API]
 - [Places API]
 - [Roads API]
 - [Static Maps API]
 - [Street View Image API]
 - [Street View Image Metadata]

### Settings

To start working with Requests Builder please fill in the Settings for your API keys, client ID, crypto key, etc. 

![Settings Config](/image/docs/geo-ws-settings.png?raw=true "Maps WS Builder Settings")

Please put the following values for different types of authentication:

#### Standard 
 - In **API key** field you should enter the value of the free version's Server API key. You can generate an API key in your developer console project. Please follow the [documentation](https://developers.google.com/maps/documentation/geocoding/get-api-key) for further details. Also note that you have to enable all aforementioned APIs in your project to be able to construct all standard (free) version's requests.
 
#### Premium Plan
 - In **API key** field you should enter the value of the Premium plan's Server API key. You can generate an API key in your developer console project. Please follow the [documentation](https://developers.google.com/maps/premium/overview#api-key) for further details.
 - **Client ID** and **Crypto Key**. If you have a Premium Plan license you should enter there the corresponding values of your client ID and cryptographic key. Please read [authenticate and authorize documentation](https://developers.google.com/maps/documentation/geocoding/get-api-key#client-id) for more details.
 
#### Maps for Work (previous license)
 - **Client ID** and **Crypto Key**. If you have a Google Maps for Work license you should enter there the corresponding values of your client ID and cryptographic key. Please read [authenticate and authorize Maps for Work documentation](https://developers.google.com/maps/premium/previous-licenses/webservices/auth) for further details.
 - **Places for Work API key**. If you have a Places API for Work license please enter here the value of the Server API key from your locked Places API - Zagat Content project.
 - **Roads for Work API key**. If you have a Maps for Work license and enabled the Roads API, please enter here the value of the API key from your locked Roads API project.
 
#### Other parameters
 - **Server URL**. Please enter the `http://aux.xomena.elementfx.com/geows.php`
 - If you would like to execute all stored requests on page load, please mark the corresponding checkbox.
 
### Select authentication method and format
 
 **Google Maps Web Services Requests Builder** allows the following types of authentication:
  - _Standard_ (free version)
  - _Premium plan_ (with Server API key)
  - _Premium plan_ (with client ID and digital signature)
  - _Maps for Work_

Output formats may be _JSON_ or _XML_. Please do not forget to set corresponding values for API keys, client ID and Crypto key in the Settings.
 
 ![Authentication Formats](/image/docs/geo-ws-version-format.png?raw=true "Maps WS Builder Authentication and Format")
 
 You can easily add and remove instances of requests in Request Builder application using corresponding buttons.
 
### Select web service
 
 For each request instance you can specify what Web Service it represents. Select the Web Service from the dropdown box:
 
 ![WS Select](/image/docs/geo-ws-services.png?raw=true "Maps WS Builder Select Web Service")
 
### List of parameters 
 
 Once selected the web service for the request instance you will see a list of available parameters. You can play with parameters and see how they affect the response of corresponding web service. Each parameter has a short description. You can see the description of parameter when you hover the question mark icon.
 
 ![Parameters Tooltips](/image/docs/geo-ws-params-tooltips.png?raw=true "Maps WS Builder Parameters and Tooltips")
 
### Web Service URL and response text
 
 Once you have set all parameters you can execute the request and see the generated URL and response in _JSON_ or _XML_ format. Click the **Execute** button of the request instance and you will see something similar to the following picture
 
 ![URL Results](/image/docs/geo-ws-results.png?raw=true "Maps WS Builder URL and Results")
 
 You can inspect the resulting URL and response text.
 
### Visualization of results on map
 
 To better understand the output of the response we provide a vizualization of results on map. You can click the **Map** tab and analyze the web service's response there. 
 
 ![Maps Maps](/image/docs/geo-ws-maps.png?raw=true "Maps WS Builder Maps")
 
 Hopefully this feature can solve many doubts regarding the web services responses and results. 
 
### Export and import
 
 You can export requests to files and use them later or send files to your colleagues. Also you can import saved requests from files.
 
 To do this, please click the menu icon on top left corner of the application
 
 ![Import-Export](/image/docs/geo-ws-import-export.png?raw=true "Maps WS Builder Import-Export")
 
 If you would like to export your requests, you will see the following dialog where you can select the requests and save them to file.
 
 ![Export](/image/docs/geo-ws-export.png?raw=true "Maps WS Builder Export")
 
 If you select import operation in the menu, you will see the following dialog where you can select a file and import requests.
 
 ![Import](/image/docs/geo-ws-import.png?raw=true "Maps WS Builder Import")

## Supported browsers

This application works with the following browsers

- Chrome / Chromium 45+
- Opera 32+
- Firefox 42+

 
[Geocoding API]: https://developers.google.com/maps/documentation/geocoding 
[Directions API]: https://developers.google.com/maps/documentation/directions
[Distance Matrix API]: https://developers.google.com/maps/documentation/distancematrix
[Elevation API]: https://developers.google.com/maps/documentation/elevation
[Time Zone API]: https://developers.google.com/maps/documentation/timezone
[Places API]: https://developers.google.com/places/documentation/index
[Roads API]: https://developers.google.com/maps/documentation/roads
[Static Maps API]: https://developers.google.com/maps/documentation/static-maps/intro
[Street View Image API]: https://developers.google.com/maps/documentation/streetview/intro
[Street View Image Metadata]: https://developers.google.com/maps/documentation/streetview/metadata