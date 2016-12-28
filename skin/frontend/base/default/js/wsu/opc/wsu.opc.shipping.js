(function($,WSU){
    WSU.OPC.Shipping = {
        ship_need_update: true,
        validate_timeout: false,
        shipping_data:null,
        init: function(){
            WSU.OPC.Shipping.ship_need_update = true;
            WSU.OPC.Decorator.createLoader("#opc-co-shipping-method-form");
            this.initChangeAddress();
            this.initChangeSelectAddress();
            this.initChangeShippingMethod();

            if(window.click_to_save){
                if($("#shipping_method_click_to_save").length<=0){
                    $(".shipping-block:not(#opc-address-form-shipping)").prepend("<a id='shipping_method_click_to_save' class='to_save'></a>");
                    $("#shipping_method_click_to_save").addClass("hide");
                }
                if($("#shipping_click_to_save").length<=0){
                    $("#opc-address-form-shipping").prepend("<a id='shipping_click_to_save' class='to_save'></a>");
                    $("#shipping_click_to_save").addClass("hide");
                }
            }
        },

        is_shipping_dirty: function(){
            var shipping = $("#opc-address-form-shipping").serialize();
            if( shipping === WSU.OPC.Shipping.shipping_data ){
                return false;
            }else{
                WSU.OPC.Shipping.shipping_data = shipping;
                return true;
            }
        },
        /** CREATE EVENT FOR UPDATE SHIPPING BLOCK **/
        initChangeAddress: function(){

            $('#opc-address-form-shipping :input').blur(function(){
                if(WSU.OPC.Shipping.is_shipping_dirty()){
                    WSU.OPC.Shipping.validateForm();
                    if(window.click_to_save){
                        if( 0 === $(":focus").closest('#shipping-new-address-form').length ){
                            //console.log($(e.target).attr('class'));
                            $("#shipping_click_to_save:not(.saved)").trigger("click");
                        }
                    }
                }
            });

            $('#opc-address-form-shipping input').keydown(function(){
                if(WSU.OPC.Shipping.is_shipping_dirty()){
                    clearTimeout(WSU.OPC.Checkout.ajaxProgress);
                    WSU.OPC.Checkout.abortAjax();

                    // check if zip
                    var el_id = $(this).attr('id');
                    if(el_id === 'shipping:postcode'){
                        WSU.OPC.Checkout.reloadShippingsPayments('shipping');
                    }

                    WSU.OPC.Shipping.validateForm(300);
                }

            });

            $('#opc-address-form-shipping select').not('#shipping-address-select').change(function(){
                // check if country
                if(WSU.OPC.Shipping.is_shipping_dirty()){
                    var el_id = $(this).attr('id');
                    if(el_id === 'shipping:country_id' || el_id === 'shipping:region_id'){
                        WSU.OPC.Checkout.reloadShippingsPayments('shipping', 800);
                    }

                    WSU.OPC.Shipping.ship_need_update = true;
                    WSU.OPC.Shipping.validateForm();
                }
            });

        },

        /** CREATE EVENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
        initChangeSelectAddress: function(){
            $('#shipping-address-select').on("change",function(){
                if ("" === $(this).val()){
                    $('#shipping-new-address-form').show();
                }else{
                    $('#shipping-new-address-form').hide();
                    WSU.OPC.Shipping.validateForm();
                }
            });


        },

        //create observer for change shipping method.
        initChangeShippingMethod: function(){
            $('#opc-co-shipping-method-form input[type="radio"][name="shipping_method"]').on('change', function(){
                if(window.click_to_save){
                    $("#shipping_method_click_to_save").removeClass("hide");
                }
                WSU.OPC.Shipping.saveShippingMethod();
            });
        },

        validateForm: function(delay){
            clearTimeout(WSU.OPC.Shipping.validate_timeout);
            if( WSU.OPC.defined(delay) || !delay){
                delay = 100;
            }

            WSU.OPC.Shipping.validate_timeout = setTimeout(function(){
                var mode = WSU.OPC.Billing.need_reload_shippings_payment;
                WSU.OPC.Billing.need_reload_shippings_payment = false;
                $("#shipping_method_click_to_save").removeClass("saved");
                var valid = WSU.OPC.Shipping.validateAddressForm();
                if (valid){
                    if(window.click_to_save){
                        $("#shipping_method_click_to_save").removeClass("hide");
                        $("#shipping_method_click_to_save").off().on("click",function(){
                            WSU.OPC.Shipping.save();
                        });
                    }else{
                        WSU.OPC.Shipping.save();
                    }
                }
                else{
                    if(window.click_to_save){
                        $("#shipping_click_to_save").addClass("hide");
                    }
                    if(mode !== false){
                        WSU.OPC.Checkout.checkRunReloadShippingsPayments(mode);
                    }
                }
            },delay);
        },

        /** VALIDATE ADDRESS BEFORE SEND TO SAVE QUOTE**/
        validateAddressForm: function(form){
            // check all required fields not empty
            var is_empty = false;
            $('#opc-address-form-shipping .required-entry').each(function(){
                if($(this).val() === '' && $(this).css('display') !== 'none' && !$(this).attr('disabled'))
                    is_empty = true;
            });

            if(is_empty){
                return false;
            }

            var addressForm = new Validation('opc-address-form-shipping', { onSubmit : false, stopOnFirst : false, focusOnError : false});
            if (addressForm.validate()){
                return true;
            }else{
                return false;
            }
        },

        /** METHOD CREATE AJAX REQUEST FOR UPDATE SHIPPIN METHOD **/
        save: function(){
            var form = $('#opc-address-form-shipping').serializeArray();
                form = WSU.OPC.Checkout.applyShippingMethod(form);
                WSU.OPC.Decorator.showLoader(".shipping-block#opc-address-form-shipping","<h1>Saving shipping address</h1>");
                WSU.OPC.ajaxManager.addReq("saveShipping",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShipping',
                dataType: 'json',
                data: form,
                success:WSU.OPC.Checkout.prepareAddressResponse
            });
        },

        saveShippingMethod: function(update_payments, reload_totals){
            if (false === WSU.OPC.Shipping.validateShippingMethod()){
                if (WSU.OPC.saveOrderStatus){
                    WSU.OPC.popup_message($('#pssm_msg').html());
                }
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader(".shipping-block:not(#opc-address-form-shipping)");
                if( WSU.OPC.defined(update_payments) && update_payments){
                    // if was request to reload payments
                    WSU.OPC.Checkout.pullPayments();
                }else{
                    if( ! WSU.OPC.defined(reload_totals) ){
                        reload_totals = false;
                    }
                    if(reload_totals){
                        WSU.OPC.Checkout.pullReview();
                    }else{
                        WSU.OPC.Checkout.unlockPlaceOrder();
                    }
                }
                return;
            }

            if (false === WSU.OPC.Shipping.validateShippingMethod()){
                WSU.OPC.popup_message("Please specify shipping method");
                WSU.OPC.Decorator.hideLoader();
                return;
            }

            var form = $('#opc-co-shipping-method-form').serializeArray();
            form = WSU.OPC.Checkout.applySubscribed(form);
            WSU.OPC.Decorator.showLoader(".shipping-block:not(#opc-address-form-shipping)","<h1>Saving shipping choice</h1>");
            WSU.OPC.ajaxManager.addReq("saveShippingMethod",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShippingMethod',
                dataType: 'json',
                data: form,
                success:WSU.OPC.Checkout.prepareShippingMethodResponse
            });
        },

        validateShippingMethod: function(){
            var shippingChecked = false;
            $('#opc-co-shipping-method-form input').each(function(){
                if ($(this).prop('checked')){
                    shippingChecked =  true;
                }
            });

            return shippingChecked;
        }
    };
})(jQuery,jQuery.WSU||{});
