(function($){
    var API_KEY = "AIzaSyA67JIj41Ze0lbc2KidOgQMgqLOAZOcybE";
    var CLIENT_ID = "gme-addictive";
    
    var services = [
        {
            name: "Geocoding API",
            alias: "geocoding"
        },
        {
            name: "Directions API",
            alias: "directions"
        },
        {
            name: "Distance Matrix API",
            alias: "distancematrix"
        },
        {
            name: "Elevation API",
            alias: "elevation"
        },
        {
            name: "Time Zone API",
            alias: "timezone"
        }
    ];
    
    //DOM ready initialization
    $(function(){
       $.each(services, function(index,service){
           $("<option value='"+service.alias+"'>"+service.name+"</option>").appendTo("#ws-choose");
       }); 
    });
    
})(jQuery);