(function($,WSU){
    WSU.OPC.Comment = {
        init: function(){

            $(document).on('click','.comment-block h3', function(){
                if ($(this).hasClass('open-block')){
                    $(this).removeClass('open-block');
                    $(this).next().addClass('hidden');
                }else{
                    $(this).addClass('open-block');
                    $(this).next().removeClass('hidden');
                }
            });
        }
    };
})(jQuery,jQuery.WSU||{});
