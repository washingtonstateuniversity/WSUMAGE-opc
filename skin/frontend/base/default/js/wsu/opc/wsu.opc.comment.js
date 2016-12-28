(function($,WSU){
    WSU.OPC.Comment = {
        init: function(){
            $('.comment-block h3').on('click', function(){
                if ($(this).hasClass('open-block')){
                    $(this).removeClass('open-block');
                    $(this).next().addClass('hidden');
                }else{
                    $(this).addClass('open-block');
                    $(this).next().removeClass('hidden');
                }
            });
            $('#customer_comment').on('change',function () {
                if (WSU.OPC.Checkout.config.comment !== "0"){
                    WSU.OPC.saveCustomerComment();
                }
            });
        },
        /** SAVE CUSTOMER COMMNET **/
        saveCustomerComment: function(){
            WSU.OPC.ajaxManager.addReq("saveComment",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/comment',
                dataType: 'json',
                data: {"comment": $('#customer_comment').val()},
                success: function(){}
            });
        },
        getComment: function(form){
            var com = $('#customer_comment').val();
            form.push({"name":"customer_comment", "value":com});
            return form;
        },
    };
})(jQuery,jQuery.WSU||{});
