(function($,WSU){
    WSU.OPC.Decorator = {
        createLoader: function(parentBlock){//,message){
            if(window.click_to_save){

            }else{
                var jObj =  WSU.OPC.defined(parentBlock) ? parentBlock:"#general_message";
                if($(jObj+' .opc-ajax-loader').length<=0){
                    $(jObj).append("<div class='opc-ajax-loader'></div>");
                }
                if($(jObj+' .opc-ajax-loader .loader').length<=0){
                    $(jObj+' .opc-ajax-loader').append("<div class='loader'></div>");
                }
                if($(jObj+' .opc-ajax-loader .loader .message').length<=0){
                    $(jObj+' .opc-ajax-loader .loader').append("<div class='message'></div>");
                }
            }
        },
        showLoader: function(parentBlock,message){
            var jObj = WSU.OPC.defined(parentBlock) ? parentBlock:"#general_message";
            var html = WSU.OPC.defined(message) ? message:"";
            if(window.click_to_save){
                var asText = "" !== html ? $(html).text() : "Saving " + $(jObj + " h3").text();
                //$(jObj+' .to_save').addClass("saving");
                $(jObj+' .to_save').attr("data-action",asText);
                //$(jObj+' .to_save.saving:after').css("content",'"'+asText+'"');
            }else{

                WSU.OPC.Decorator.createLoader(parentBlock, message);
                $(jObj+' .opc-ajax-loader .loader .message').html(html);
                $(jObj+' .opc-ajax-loader').show();
                //console.log("masking "+jObj+" with a message of "+html);
            }
            $('.opc-btn-checkout').attr("disabled",true);
            $('.opc-btn-checkout').addClass('button-disabled');
        },

        resetSaveBtn: function(mode){
            $.each(mode.split(","), function(idx, itm){
                $("#"+itm.trim()+"_click_to_save").removeClass("saved");
                $("#"+itm.trim()+"_click_to_save").removeClass("hide");
                $("#"+itm.trim()+"_click_to_save").data("action","");
            });
        },
        setSaveBtnSaved: function(mode){
            $.each(mode.split(","), function(idx, itm){
                $("#"+itm.trim()+"_click_to_save").addClass("saved");
                $("#"+itm.trim()+"_click_to_save").addClass("hide");
                $("#"+itm.trim()+"_click_to_save").data("action","");
            });
        },
        setSaveBtnAction: function(mode,action){
            $.each(mode.split(","), function(idx, itm){
                $("#"+itm.trim()+"_click_to_save").off().on("click",action);
            });
        },

        setSaveBtnDoing: function(mode,asText){
            $.each(mode.split(","), function(idx, itm){
                console.log("-------- for setSaveBtnDoing "+ itm + " with " + asText);
                $("#"+itm.trim()+"_click_to_save").data("action",asText);
            });
        },


        disableSaveBtn: function(mode){
            $.each(mode.split(","), function(idx, itm){
                $("#"+itm.trim()+"_click_to_save").addClass("hide");
                $("#"+itm.trim()+"_click_to_save").data("action","");
            });
        },


        hideLoader: function(parentBlock){
            var jObj = WSU.OPC.defined(parentBlock) ? parentBlock:"#general_message";
            if(window.click_to_save){
                //$(jObj+' .to_save').removeClass("saving");
                $(jObj+' .to_save').attr("data-action","");
            }else{
                $(jObj+' .opc-ajax-loader').hide();
                $(jObj+' .opc-ajax-loader .loader .message').remove();
            }
            $('.opc-btn-checkout').removeClass('button-disabled');
            $('.opc-btn-checkout').removeAttr("disabled");
            //console.log("hidgin mask of "+jObj+" with a message of ");
        },
        initReviewBlock: function(){
            $('a.review-total').on('click',function(e){
                e.preventDefault();
                if ($(this).hasClass('open')){
                    $(this).removeClass('open');
                    $('#opc-review-block').addClass('hidden');
                }else{
                    $(this).addClass('open');
                    $('#opc-review-block').removeClass('hidden');
                }
            });
        },
        updateGrandTotal: function(response){
            $('.opc-review-actions h5 span').html(response.grandTotal);
            $('.review-total span').html(response.grandTotal);
        },

        setActivePayment: function(){
            //check and setup current active method
            this.setCurrentPaymentActive();

            $(document).on('click','#checkout-payment-method-load dt', function(){
                $('#checkout-payment-method-load dt').removeClass('active');
                $(this).addClass('active');
            });
        },

        setCurrentPaymentActive: function(){
            var method = payment.currentMethod;
            $('#co-payment-form input[type="radio"]:checked').closest('dt').addClass('active');
            $('#p_method_'+method).parent().addClass('active');
        }
    };
})(jQuery,jQuery.WSU||{});
