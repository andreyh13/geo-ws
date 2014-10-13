(function($){
    var API_KEY = "AIzaSyA67JIj41Ze0lbc2KidOgQMgqLOAZOcybE";
    var CLIENT_ID = "gme-addictive";
    
    function getNewId(){
        getNewId.count = ++getNewId.count || 1;
        return getNewId.count;
    }
    
    var instance_col = new com.xomena.geo.Collections.InstanceCollection();
    instance_col.add(new com.xomena.geo.Models.Instance({id: getNewId()}));
    
    //DOM ready initialization
    $(function(){
        // creates view for collection and renders collection
        var instancesView = new com.xomena.geo.Views.InstancesView({collection: instance_col});
        instancesView.render();
        
        //adding new instance
        $("#add-instance").click(function(){
            var m_instance = new com.xomena.geo.Models.Instance({id: getNewId()});
            instance_col.add(m_instance);
            var m_instanceView = new com.xomena.geo.Views.InstanceView({model: m_instance});
            $("#instances-container").append(m_instanceView.el);
            return false;
        });
    });
})(jQuery);