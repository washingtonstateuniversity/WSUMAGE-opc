(function($,WSU){

    WSU.OPC.billing = {
        bill_need_update: true,
        need_reload_shippings_payments: false,
        validate_timeout: false,
        _data:null,

        init: function(){
            // should be an option but this is to shim
            //$('[name="billing[use_for_shipping]"]:checked').trigger("click");
            console.log("init billing");
            WSU.OPC.billing.bill_need_update = true;
            WSU.OPC.Decorator.createLoader("#opc-address-form-billing");
            //set flag use billing for shipping and init change flag
            var use_for_ship = false;
            var el = $('input[name="billing[use_for_shipping]"]');
            if( WSU.OPC.defined(el) ){
                if(el.prop('type') === 'checkbox'){
                    if(el.is(':checked')){
                        use_for_ship = true;
                    }
                }else{
                    use_for_ship = true;
                }
            }else{
                use_for_ship = true;
            }

            if(use_for_ship){
                this.setBillingForShipping(true);
            }else{
                this.setBillingForShipping(false, true);
            }
            if(window.click_to_save){
                if($("#billing_click_to_save").length<=0){
                    $("#co-billing-form").prepend("<a id='billing_click_to_save' data-action='' class='to_save'></a>");
                    $("#billing_click_to_save").addClass("hide");
                }
            }

            WSU.OPC.Checkout.setUpShippingBillingSwitcher();

            //update password field
            $('input[name="billing[create_account]"]').on("change",function(){
                if ( $('input[name="billing[create_account]"]').is(':checked') ){
                    $('#register-customer-password').removeClass('hidden');
                    $('input[name="billing[customer_password]"]').addClass('required-entry');
                    $('input[name="billing[confirm_password]"]').addClass('required-entry');
                }else{
                    $('#register-customer-password').addClass('hidden');
                    $('input[name="billing[customer_password]"]').removeClass('required-entry');
                    $('input[name="billing[confirm_password]"]').removeClass('required-entry');
                    $('#register-customer-password input').val('');
                }
            });

            WSU.OPC.initChangeAddress('billing');
            this.initChangeSelectAddress();
        },

        validateForm: function(delay, callback){
            clearTimeout(WSU.OPC.billing.validate_timeout);
            if( WSU.OPC.defined(delay) || false === delay){
                delay = 100;
            }
            WSU.OPC.billing.validate_timeout = setTimeout(function(){
                //console.log("checking valid");
                var mode = WSU.OPC.billing.need_reload_shippings_payment;
                WSU.OPC.billing.need_reload_shippings_payment = false;
                WSU.OPC.Decorator.resetSaveBtn("billing");

                var valid = WSU.OPC.validateAddressForm('billing');
                WSU.OPC.form_status.billing.ready = valid;
                if (valid){

                    console.log("VALID billing info");
                    if(window.click_to_save){
                        WSU.OPC.Decorator.setSaveBtnAction("billing",function(){
                            WSU.OPC.billing.save();
                        });
                        $("#billing_click_to_save:not(.saved)").trigger("click");
                    }else{
                        WSU.OPC.billing.save();
                    }
                }else{
                    console.log("INvalid billing info");
                    if(window.click_to_save){
                        $("#billing_click_to_save").addClass("hide");
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


        /** CREATE EVENT FOR CHANGE ADDRESS TO NEW OR FROM ADDRESS BOOK **/
        initChangeSelectAddress: function(){
            $('#billing-address-select').change(function(){
                if ($(this).val()==''){
                    $('#billing-new-address-form').show();
                }else{
                    $('#billing-new-address-form').hide();
                    WSU.OPC.billing.validateForm();
                }
            });
        },

        /** SET SHIPPING AS BILLING TO TRUE OR FALSE **/
        setBillingForShipping:function(useBilling, skip_copy){
            if (useBilling==true){
                $('input[name="billing[use_for_shipping]"]').prop('checked', true);
                $('input[name="shipping[same_as_billing]"]').prop('checked', true);
                $('#opc-address-form-shipping').addClass('hidden');
            }else{
                if( !WSU.OPC.defined(skip_copy) ){
                    skip_copy = true;
                }
                $('input[name="billing[use_for_shipping]"]').prop('checked', false);
                $('input[name="shipping[same_as_billing]"]').prop('checked', false);
                $('#opc-address-form-shipping').removeClass('hidden');
                WSU.OPC.initChangeAddress('shipping');
                if(!skip_copy){
                    WSU.OPC.billing.pushBilingToShipping();
                }
            }
        },

        /** COPY FIELD FROM BILLING FORM TO SHIPPING **/
        pushBilingToShipping:function(clearShippingForm){
            //pull country
            var valueCountry = $('#billing-new-address-form select[name="billing[country_id]"]').val();
            $('#opc-address-form-shipping  select[name="shipping[country_id]"] [value="' + valueCountry + '"]').prop("selected", true);
            shippingRegionUpdater.update();


            //pull region id
            var valueRegionId = $('#billing-new-address-form select[name="billing[region_id]"]').val();
            $('#opc-address-form-shipping  select[name="shipping[region_id]"] [value="' + valueRegionId + '"]').prop("selected", true);

            //pull other fields
            $('#billing-new-address-form input').not(':hidden, :input[type="checkbox"]').each(function(){
                var name = $(this).attr('name');
                var value = $(this).val();
                var shippingName =  name.replace( /billing/ , 'shipping');
                $('#opc-address-form-shipping input[name="'+shippingName+'"]').val(value);
            });

            //pull address field
            $('#billing-new-address-form input[name="billing[street][]"]').each(function(indexBilling){
                var valueAddress = $(this).val();
                $('#opc-address-form-shipping input[name="shipping[street][]"]').each(function(indexShipping){
                    if (indexBilling==indexShipping){
                        $(this).val(valueAddress);
                    }
                });
            });

            //init trigger change shipping form
            $('#opc-address-form-shipping select[name="shipping[country_id]"]').change();
        },



        save: function(){
            var form = $('#opc-address-form-billing').serializeArray();
            form = WSU.OPC.Checkout.applyShippingMethod(form);
            form = WSU.OPC.Checkout.applySubscribed(form);
            form.push({ "name":"billing[use_for_shipping]", "value": jQuery('[name*=use_for_shipping]:checked').length });
            if($('input[name="billing[use_for_shipping]"]').is(':checked')){
                WSU.OPC.Decorator.showLoader();
            }else{
                WSU.OPC.Checkout.lockPlaceOrder(1);
            }

            WSU.OPC.billing.bill_need_update = false;
            WSU.OPC.displayShippingMethodAccurrecy('billing');
            WSU.OPC.Decorator.showLoader("#opc-address-form-billing","<h1>Saving billing information</h1>");
            WSU.OPC.ajaxManager.addReq("saveBilling",{
                type: 'POST',
                url: WSU.OPC.Checkout.config.baseUrl + 'onepage/json/saveBilling',
                dataType: 'json',
                data: form,
                success: WSU.OPC.Checkout.prepareAddressResponse
            });
        }
    };
})(jQuery,jQuery.WSU||{});
