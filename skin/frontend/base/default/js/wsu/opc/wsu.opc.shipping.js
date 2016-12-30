(function($,WSU){
    WSU.OPC.shipping_method = {
        already_choosen: null,
        init: function(){
            this.init_change();
        },
        //create observer for change shipping method.
        init_change: function(){
            if(window.click_to_save){
                if($("#shipping_method_click_to_save").length<=0){
                    $(".shipping-block:not(#opc-address-form-shipping)").prepend("<a id='shipping_method_click_to_save' data-action='' class='to_save'></a>");
                    //$("#shipping_method_click_to_save").addClass("hide");
                    WSU.OPC.Decorator.disableSaveBtn("shipping_method");
                }
            }
            if( null !== WSU.OPC.shipping_method.already_choosen && $('[name="shipping_method"][value="' + WSU.OPC.shipping_method.already_choosen + '"]').length ){
                $('[name="shipping_method"][value="' + WSU.OPC.shipping_method.already_choosen + '"]').attr("checked",true);
            }
            $('#opc-co-shipping-method-form input[type="radio"][name="shipping_method"]').on('change', function(){
                if(window.click_to_save){
                    WSU.OPC.Decorator.resetSaveBtn("shipping_method");
                }
                WSU.OPC.shipping_method.already_choosen = $(this).val();
                WSU.OPC.shipping.validateForm(300,function(){
                    console.log("WSU.OPC.form_status.shipping.ready " + WSU.OPC.form_status.shipping.ready);
                    if( WSU.OPC.form_status.shipping.ready ){ // on change of shipping address save shiping? no no no
                        WSU.OPC.shipping_method.save();
                    }
                });
            });
        },

        validateForm: function(){
            var shippingChecked = false;
            $('#opc-co-shipping-method-form input').each(function(){
                if ($(this).prop('checked')){
                    shippingChecked =  true;
                }
            });
            return shippingChecked;
        },

        save: function(update_payments, reload_totals){
            if (false === WSU.OPC.shipping_method.validateForm()){
                if (WSU.OPC.saveOrderStatus){
                    WSU.OPC.popup_message($('#pssm_msg').html());
                }
                WSU.OPC.saveOrderStatus = false;
                WSU.OPC.Decorator.hideLoader(".shipping-block:not(#opc-address-form-shipping)");
                if( WSU.OPC.defined(update_payments) && update_payments){
                    // if was request to reload payments
                    WSU.OPC.payment.reloadHtml();
                }else{
                    if( ! WSU.OPC.defined(reload_totals) ){
                        reload_totals = false;
                    }
                    if(reload_totals){
                        WSU.OPC.Checkout.pullReview();
                    }else{
                        WSU.OPC.order.unlock();
                    }
                }
                return;
            }

            if (false === WSU.OPC.shipping_method.validateForm()){
                WSU.OPC.popup_message("Please specify shipping method");
                WSU.OPC.Decorator.hideLoader();
                return;
            }

            var form = $('#opc-co-shipping-method-form').serializeArray();
            form = WSU.OPC.Checkout.applySubscribed(form);
            WSU.OPC.Decorator.showLoader(".shipping-block:not(#opc-address-form-shipping)","<h1>Saving</h1>");
            WSU.OPC.Decorator.setSaveBtnDoing("shipping_method","Saving");
            WSU.OPC.ajaxManager.addReq("saveShippingMethod",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShippingMethod',
                dataType: 'json',
                data: form,
                success:WSU.OPC.shipping_method.saveResponse
            });
        },
        saveResponse: function(response){
            //WSU.OPC.Checkout.abortAjax();
            WSU.OPC.Decorator.hideLoader(".shipping-block");
            if ( WSU.OPC.defined(response.error) ){
                WSU.OPC.order.unlock();
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
                WSU.OPC.Decorator.setSaveBtnSaved("shipping_method");
            }

            //IF STATUS TRUE - START SAVE PAYMENT FOR CREATE ORDER
            if (true === WSU.OPC.saveOrderStatus){
                WSU.OPC.payment.validateForm();
            }else{
                WSU.OPC.payment.reloadHtml();
            }
        },

        reloadHtml: function(){//form_type, delay){
            WSU.OPC.shipping_method.already_choosen = $('[name="shipping_method"]').val();
            WSU.OPC.Decorator.showLoader('#opc-co-shipping-method-form',"<h1>Refreshing</h1>");
            WSU.OPC.Decorator.setSaveBtnDoing("shipping_method","Refreshing");
            WSU.OPC.ajaxManager.addReq("reloadShippingsMethods",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/reloadShippingsMethods',
                dataType: 'json',
                success: WSU.OPC.shipping_method.reloadHtmlResponse
            });
        },
        reloadHtmlResponse: function(response){
            if ( WSU.OPC.defined(response.error) ){
                $('.opc-message-container').html(response.message);
                $('.opc-message-wrapper').show();
                WSU.OPC.Decorator.hideLoader('#opc-co-shipping-method-form');
                WSU.OPC.order.unlock();
                return;
            }

            if ( WSU.OPC.defined(response.shipping_methods) ){
                $('#opc-co-shipping-method-form').empty().html(response.shipping_methods);
                if( null !== WSU.OPC.shipping_method.already_choosen && $('[name="shipping_method"][value="' + WSU.OPC.shipping_method.already_choosen + '"]').length ){
                    $('[name="shipping_method"][value="' + WSU.OPC.shipping_method.already_choosen + '"]').attr("checked",true);
                }
                WSU.OPC.Decorator.setSaveBtnSaved("shipping_method");
                WSU.OPC.shipping_method.init_change();
            }
            if (WSU.OPC.defined(response.worked_on)){
                WSU.OPC.Decorator.hideLoader("#opc-co-shipping-method-form");
                if("shipping_method"===response.worked_on){
                    WSU.OPC.Decorator.setSaveBtnSaved("shipping_method");
                }
            }
            if ( WSU.OPC.defined(response.payments) ){

                if("" !== response.payments){
                    $('#checkout-payment-method-load').empty().html(response.payments);

                    WSU.OPC.payment.filterMethods();
                    //payment.initWhatIsCvvListeners();//default logic for view "what is this?"
                }
                if (WSU.OPC.defined(response.worked_on)){
                    if("shipping_method"===response.worked_on){
                        WSU.OPC.Decorator.setSaveBtnSaved("shipping_method");
                    }
                }

                if (false === WSU.OPC.Checkout.isVirtual){
                    var update_payments = false;
                    if ( WSU.OPC.defined(response.reload_payments) ){
                        update_payments = true;
                    }

                    WSU.OPC.shipping_method.save(update_payments);
                }else{
                    $('.shipping-block').hide();
                    $('.payment-block').addClass('clear-margin');
                    WSU.OPC.payment.reloadHtml();
                }
            }
            else{
                if( WSU.OPC.defined(response.reload_totals) ){
                    WSU.OPC.Checkout.pullReview();
                }
            }
        },

        /** APPLY SHIPPING METHOD FORM TO BILLING FORM **/
        appendData: function(form){
            var formShippimgMethods = $('#opc-co-shipping-method-form').serializeArray();
            $.each(formShippimgMethods, function(index, data){
                form.push(data);
            });

            return form;
        },
    };

    WSU.OPC.shipping = {
        validate_timeout: false,
        _data:null,

        init: function(){
            WSU.OPC.Decorator.createLoader("#opc-co-shipping-method-form");
            WSU.OPC.shipping.init_change();
            WSU.OPC.shipping_method.init();
        },

        init_change: function(){
            WSU.OPC.initChangeAddress('shipping');
            $('#shipping-address-select').on("change",function(){
                if ("" === $(this).val()){
                    $('#shipping-new-address-form').show();
                }else{
                    $('#shipping-new-address-form').hide();
                    WSU.OPC.shipping.validateForm();
                }
            });
            if(window.click_to_save){
                if($("#shipping_click_to_save").length<=0){
                    $("#opc-address-form-shipping").prepend("<a id='shipping_click_to_save' data-action='' class='to_save'></a>");
                    //$("#shipping_click_to_save").addClass("hide");
                    WSU.OPC.Decorator.disableSaveBtn("shipping");
                }
            }
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


                if ( $('input[name="billing[use_for_shipping]"]').is(':checked') ){
                    WSU.OPC.form_status.shipping.skipping = true;
                }else{
                    WSU.OPC.form_status.shipping.skipping = false;
                }

                var valid = false;
                if( WSU.OPC.form_status.shipping.skipping ){
                    WSU.OPC.clearAddressForm("shipping");
                    WSU.OPC.form_status.shipping.ready = true;
                    valid = true;
                }else{
                    valid = WSU.OPC.validateAddressForm('shipping');
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
                            WSU.OPC.shipping_method.reloadHtml(mode);
                        }
                    }
                }
                if( WSU.OPC.defined(callback) && "function" === typeof callback ){
                    callback(valid);
                }
            },delay);
        },

        /** METHOD CREATE AJAX REQUEST FOR UPDATE SHIPPIN METHOD **/
        save: function(){
            var form = $('#opc-address-form-shipping').serializeArray();
            form = WSU.OPC.shipping_method.appendData(form);
            WSU.OPC.Decorator.showLoader(".shipping-block#opc-address-form-shipping","<h1>Saving</h1>");
            WSU.OPC.Decorator.setSaveBtnDoing("shipping","Saving");
            WSU.OPC.ajaxManager.addReq("saveShipping",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveShipping',
                dataType: 'json',
                data: form,
                success:WSU.OPC.shipping.prepareAddressResponse
            });
        },
        saveResponse: function(response){
            WSU.OPC.Checkout.prepareAddressResponse(response,"shipping");
        },
    };
})(jQuery,jQuery.WSU||{});
