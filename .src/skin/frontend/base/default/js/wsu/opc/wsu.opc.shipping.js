(function($,WSU){
    WSU.OPC.shipping = {

        validate_timeout: false,
        _data:null,

        init: function(){
            WSU.OPC.Decorator.createLoader("#opc-co-shipping-method-form");
            WSU.OPC.initChangeAddress('shipping');
            this.initChangeSelectAddress();
            this.initChangeShippingMethod();

            if(window.click_to_save){
                if($("#shipping_method_click_to_save").length<=0){
                    $(".shipping-block:not(#opc-address-form-shipping)").prepend("<a id='shipping_method_click_to_save' data-action='' class='to_save'></a>");
                    //$("#shipping_method_click_to_save").addClass("hide");
                    WSU.OPC.Decorator.disableSaveBtn("shipping_method");
                }
                if($("#shipping_click_to_save").length<=0){
                    $("#opc-address-form-shipping").prepend("<a id='shipping_click_to_save' data-action='' class='to_save'></a>");
                    //$("#shipping_click_to_save").addClass("hide");
                    WSU.OPC.Decorator.disableSaveBtn("shipping");
                }
            }
        },




        /** CREATE EVENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
        initChangeSelectAddress: function(){
            $('#shipping-address-select').on("change",function(){
                if ("" === $(this).val()){
                    $('#shipping-new-address-form').show();
                }else{
                    $('#shipping-new-address-form').hide();
                    WSU.OPC.shipping.validateForm();
                }
            });
        },

        //create observer for change shipping method.
        initChangeShippingMethod: function(){
            if(window.click_to_save){
                if($("#shipping_click_to_save").length<=0){
                    $(".shipping-block").prepend("<a id='shipping_click_to_save' data-action='' class='to_save'></a>");
                }
                WSU.OPC.Decorator.setSaveBtnAction("shipping",function(){
                    WSU.OPC.shipping.save();
                });
                WSU.OPC.Decorator.disableSaveBtn("shipping");
            }
            $('#opc-co-shipping-method-form input[type="radio"][name="shipping_method"]').on('change', function(){
                if(window.click_to_save){
                    WSU.OPC.Decorator.resetSaveBtn("shipping_method");
                }
                WSU.OPC.shipping.validateForm(300,function(){
                    console.log("WSU.OPC.form_status.shipping.ready " + WSU.OPC.form_status.shipping.ready);
                    if( WSU.OPC.form_status.shipping.ready ){ // on change of shipping address save shiping? no no no
                        WSU.OPC.shipping.saveShippingMethod();
                    }
                });
            });
        },

        validateForm: function(delay, callback){
            clearTimeout(WSU.OPC.shipping.validate_timeout);
            if( WSU.OPC.defined(delay) || !delay){
                delay = 100;
            }

            WSU.OPC.shipping.validate_timeout = setTimeout(function(){
                var mode = WSU.OPC.billing.need_reload_shippings_payment;
                WSU.OPC.billing.need_reload_shippings_payment = false;

                WSU.OPC.Decorator.resetSaveBtn("shipping_method,shipping");

                var valid = WSU.OPC.validateAddressForm('shipping');
                WSU.OPC.form_status.shipping.ready = valid;

                if (valid){
                    if(window.click_to_save){
                        WSU.OPC.Decorator.setSaveBtnAction("shipping_method,shipping",function(){
                            WSU.OPC.shipping.save();
                        });
                    }else{
                        WSU.OPC.shipping.save();
                    }
                }
                else{
                    if(window.click_to_save){
                        WSU.OPC.Decorator.disableSaveBtn("shipping");
                    }
                    if(mode !== false){
                        WSU.OPC.Checkout.checkRunReloadShippingsMethods(mode);
                    }
                }

                if( WSU.OPC.defined(callback) && "function" === typeof callback ){
                    callback(valid);
                };
            },delay);
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
            if (false === WSU.OPC.shipping.validateShippingMethod()){
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

            if (false === WSU.OPC.shipping.validateShippingMethod()){
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
                success:WSU.OPC.shipping.prepareShippingMethodResponse
            });
        },

        /** PARSE RESPONSE FROM AJAX SAVE SHIPPING METHOD **/
        prepareShippingMethodResponse: function(response){
            WSU.OPC.Checkout.xhr = null;
            WSU.OPC.Decorator.hideLoader(".shipping-block");
            if ( WSU.OPC.defined(response.error) ){
                WSU.OPC.Checkout.unlockPlaceOrder();
                WSU.OPC.Plugin.dispatch('error');
                WSU.OPC.popup_message(response.message);
                WSU.OPC.saveOrderStatus = false;
                return;
            }

            if ( WSU.OPC.defined(response.review) && false === WSU.OPC.saveOrderStatus){
                try{
                    WSU.OPC.Decorator.updateGrandTotal(response);
                    $('#opc-review-block').html(response.review);
                }catch(e){ }
                WSU.OPC.Checkout.removePrice();
                //WSU.OPC.recheckAgree();
            }

            if(window.click_to_save){
                if (WSU.OPC.defined(response.worked_on)){
                    WSU.OPC.Decorator.setSaveBtnSaved(response.worked_on);
                }
                WSU.OPC.Decorator.disableSaveBtn('shipping');
            }

            //IF STATUS TRUE - START SAVE PAYMENT FOR CREATE ORDER
            if (true === WSU.OPC.saveOrderStatus){
                WSU.OPC.validatePayment();
            }else{
                WSU.OPC.Checkout.pullPayments();
            }
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
