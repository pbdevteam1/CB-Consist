(function ($) {
  $(document).ready(function () {
    /**
     * Handles the success actions after form submission.
     *
     * This function performs different actions based on the form's configuration:
     * - If a post-submit success function is specified, it executes that function.
     * - If a redirect URL is specified, it redirects the browser to that URL.
     * - If a success message is specified, it displays an alert with that message.
     *
     * @param {HTMLFormElement} form - The form element that was submitted.
     */
    var successActionHandler = function (form) {
      var formId = $(form).attr('id');
      var {
        submit_actions,
        post_sub_success_function_name,
        redirect_to,
        submit_success_message,
      } = window[`cform_${formId}`];
      if (
        submit_actions.includes('post_submit_function_call') &&
        post_sub_success_function_name
      ) {
        console.log('DEBUG: Running post submit success function');
        try {
          window[post_sub_success_function_name]();
        } catch {
          console.error(
            `ERROR: Function ${post_sub_success_function_name} does not exist`
          );
        }
      }
      if (submit_actions.includes('redirect') && redirect_to) {
        window.location.replace(redirect_to);
      } else if (submit_success_message) {
        alert(submit_success_message);
      }
    };
    /**
     * Checks for reserved keywords in the form submission response
     * and executes the corresponding actions.
     *
     * @param {object} data - The form submission response data.
     */
    var reservedKeywordsHandler = async (data) => {
      console.log('DEBUG: Cecking for reserved keywords in response');
      var { alert_message, redirect_url, searchReplace } = data;
      if (alert_message) {
        alert(alert_message);
      }
      if (redirect_url) {
        window.location.replace(redirect_url);
      }
      if (searchReplace) {
        $('.search-replace, .searchReplace')
          .not('style, script')
          .each((_, element) => {
            var htmlContent = $(element).html();
            $.each(searchReplace, (search, repalce) => {
              var regex = new RegExp(`{{${search}}}`, 'gi');
              htmlContent = htmlContent.replace(regex, repalce);
            });

            $(element).html(htmlContent);
          });
      }
    };
    /**
     * Handles the error actions after a form submission fails.
     *
     * This function checks if there is a specified error message for the form
     * and displays it as an alert. It is triggered when there is an error during
     * the form submission process.
     *
     * @param {HTMLFormElement} form - The form element that was submitted.
     */
    var errorActionHandler = function (form) {
      var formId = $(form).attr('id');
      var { submit_error_message } = window[`cform_${formId}`];
      if (submit_error_message) {
        alert(submit_error_message);
      }
    };
    /**
     * Handles the submission of a form.
     *
     * This function performs several actions including:
     * - Checking conditions on elements with the 'has-conditioning' class before submitting the form.
     * - Triggering a loading indicator if the loaderOn function is defined.
     * - Determining the correct URL for form submission, either the form's default URL or an advanced URL if specified.
     * - Calling a pre-submit function if defined.
     * - Gathering form data and sending it to the determined URL via an AJAX POST request.
     * - Handling the success and error responses from the AJAX request by calling appropriate handler functions.
     * - Ensuring that the loaderOff function is called upon completion if it is defined.
     *
     * @param {HTMLFormElement} form - The form element that is being submitted.
     */
    var formSubmitHandler = function (form) {
      $('button[role=cbutton]').prop('disabled', true);
      var formId = $(form).attr('id');
      var formVars = window[`cform_${formId}`];
      var {
        form_submit_url,
        pre_sub_function_name,
        submit_response_type,
        submit_actions,
        post_sub_error_function_name,
        submit_success_message,
      } = formVars;
      // Check conditions before submit
      var conditinedElements = $('.has-conditioning');
      for (element of conditinedElements) {
        runConditions(element);
      }

      if (typeof loaderOn === 'function') {
        loaderOn();
      }
      var btnOp = submitterBtn?.attr('op') || 'submit';
      switch (btnOp) {
        case 'advanced':
        case 'stepper':
          submitUrl = $(submitterBtn).data('advanced_url');
          break;
        case 'submit':
        default:
          submitUrl = form_submit_url;
          break;
      }
      try {
        if (pre_sub_function_name) {
          window[pre_sub_function_name]();
        }
      } catch {
        console.error(
          `ERROR: Function ${pre_sub_function_name} does not exist`
        );
      }
      formDataPromise = getFormData(form, {
        excludeHiddenFields: true,
        log: true,
      });
      formDataPromise.then((formData) => {
        if (submitterBtn) {
          formData.clickedButton = $(submitterBtn).attr('id') || '';
        }
        $(form).data('submit-success-data', '');
        $(form).data('submit-error-data', '');

        if (validateUrl(submitUrl)) {
          $.ajax({
            type: 'POST',
            url: submitUrl,
            data: JSON.stringify(formData),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            // crossDomain: true,
            success: async (data) => {
              console.log(`DEBUG: Form ${formId} ${btnOp} success'`, data);
              $(form).data('submit-success-data', JSON.stringify(data));
              $(form).data('submit-error-data', '');
              switch (btnOp) {
                default:
                case 'submit':
                  successActionHandler(form);
                  var valuesOrData =
                    submit_response_type === 'values' ? true : false;
                  await reservedKeywordsHandler(data);
                  // Form submit populate
                  await populateForm(formId, data, valuesOrData);
                  $('body').trigger('change');
                  console.log('DEBUG: Form populated', formId, data);
                  break;
                case 'advanced':
                  var valuesOrData =
                    $(submitterBtn).data('advanced_submit_type') === 'values'
                      ? true
                      : false;
                  await reservedKeywordsHandler(data);
                  // Advanced button submit populate
                  await populateForm(formId, data, valuesOrData);
                  $('body').trigger('change');
                  console.log('DEBUG: Form populated', formId, data);
                  break;
                case 'stepper':
                  alert(submit_success_message);
                  break;
              }
            },
            error: (data) => {
              console.log('DEBUG: Form submit error', data);
              $(form).data('submit-success-data', '');
              $(form).data(
                'submit-error-data',
                JSON.stringify({
                  status: data.status,
                  statusText: data.statusText,
                  responseJSON: data.responseJSON,
                  responseText: data.responseText,
                })
              );
              if (
                submit_actions.includes('post_submit_function_call') &&
                post_sub_error_function_name
              ) {
                console.log('DEBUG: Running post submit error function');
                try {
                  if (post_sub_error_function_name) {
                    window[post_sub_error_function_name]();
                  }
                } catch {
                  console.error(
                    `ERROR: Function ${post_sub_error_function_name} does not exist`
                  );
                }
              }
              errorActionHandler(form);
            },
            complete: () => {
              $('button[role=cbutton]').prop('disabled', false);
              submitterBtn = undefined;
              if (typeof loaderOff === 'function') {
                loaderOff();
              }
              $(form).trigger('cform:submitComplete');
            },
          });
        }
      });
    };
    /**
     * @function formInvalidHandler
     * @description Handles the form submission fail.
     * @param {Object} e - The event object.
     * @param {Object} validator - The validator object.
     * @returns {void}
     */
    var formInvalidHandler = (e, validator) => {
      console.log('DEBUG: Form failed to submit');
      var formId = validator.currentForm.id;
      var formVars = window[`cform_${formId}`];
      if (formVars !== undefined) {
        var { submit_error_alert, alert_error_message } = formVars;
      }
      if (submit_error_alert === 'yes') {
        alert(alert_error_message);
      }
    };
    /**
     * Builds the modal form for the table, either advanced or normal.
     *
     * @function buildTableModalForm
     * @description Builds the modal form for the table, either advanced or normal.
     * @returns {void}
     */
    var buildTableModalForm = () => {
      let openModalButtons = $(
        'button[op="open_modal"], button[op="open_advanced_modal"]'
      );
      openModalButtons.each((_, b) => {
        let modalFormId = $(b).data('modal_form_id');
        let modalTableType = $(b).data('table_type');
        let tableId = $(b).data('table_id');

        let modalCheckboxFields = $(`#${modalFormId}`).find(
          'div[data-element_type="checkbox"]'
        );
        modalCheckboxFields.each((_, c) => {
          $(`#${tableId}`)
            .find(`#${$(c).attr('id')}`)
            .attr('data-column_type', 'checkbox');
        });

        let modalSection = $(`#${modalFormId}`).closest(
          'form.elementor-section, form.elementor-container, form.e-con'
        );

        const modalWrapper = $(
          `<div id="${modalFormId}_wrapper" class="modal-wrapper modal"></div>`
        );
        $(modalSection).addClass('modal_form').wrap(modalWrapper);

        let modalPostId = $('div[data-elementor-type="wp-page"]').data(
          'elementor-id'
        );
        $(modalSection).attr('id', `${modalFormId}_section`);
        $(modalSection).addClass(`elementor-${modalPostId}`);

        let modalButtons = $(modalSection).find('button[role="cbutton"]');
        modalButtons.each((_, mb) => {
          switch (modalTableType) {
            case 'advanced':
              $(mb)
                .attr('op', $(mb).attr('op') + '_advanced_modal')
                .addClass(`table_id__${tableId}`);
              break;
            default:
            case 'normal':
              $(mb).attr('op', $(mb).attr('op') + '_modal');
              break;
          }

          $(mb).click(async function (e) {
            e.preventDefault();
            let modalForm = $(`#${modalFormId}_section`),
              table = $(`#${tableId}`),
              columns = $(table).find('th'),
              modalFormData,
              modalFormDataJSON = {};
            $(modalForm).validate();
            switch ($(mb).attr('op')) {
              case 'submit_advanced_modal':
                if (!modalForm.valid()) {
                  return;
                }
                modalFormData = await getFormData(modalForm, {
                  excludeHiddenFields: false,
                  log: true,
                });
                addRowAdvanced(table, columns, modalFormData);
                $(modalForm).closest('div.blocker').click();
                break;
              default:
              case 'submit_modal':
                console.log('DEBUG: Submit normal modal popup');

                if (!modalForm.valid()) {
                  return;
                }
                modalFormData = $(modalForm).serializeArray();
                for (var i = 0; i < modalFormData.length; i++) {
                  if (
                    modalFormData[i].name[modalFormData[i].name.length - 1] ==
                    ']'
                  ) {
                    var checkboxName = modalFormData[i].name,
                      checkboxData = '';
                    for (; modalFormData[i].name == checkboxName; i++) {
                      checkboxData += `${modalFormData[i].value}, `;
                      if (i == modalFormData.length - 1) {
                        break;
                      }
                    }
                    checkboxData = checkboxData.substring(
                      0,
                      checkboxData.length - 2
                    );
                    checkboxName = checkboxName.substring(
                      0,
                      checkboxName.length - 2
                    );

                    modalFormDataJSON[checkboxName] = checkboxData;
                  }

                  modalFormDataJSON[modalFormData[i].name] =
                    modalFormData[i].value;
                }

                addRow(table, modalFormDataJSON);

                $(modalForm).closest('div.blocker').click();
                break;
            }

            // Reset the modal form whether it's submitted or reset
            var inputFields = $(modalForm).find('input:not([readonly])'),
              selectFields = $(modalForm).find('select:not([readonly])');
            // sigFields = $(modalForm).find('.elementor-field-type-signature img');

            for (var input of inputFields) {
              switch ($(input).attr('type')) {
                case 'checkbox':
                case 'radio':
                  checkRadioDefault(input);
                  break;
                default:
                  $(input).val($(input).data('default') || '');
                  break;
              }
              for (var select of selectFields) {
                selectDefault(
                  select,
                  $(select).parents('.elementor-field-group').data('default')
                );
              }
            }
          });
        });

        let modalButtonId = $(b).attr('id'),
          modalLink;
        switch (modalTableType) {
          case 'advanced':
            modalLink = `<p><a href="#${modalFormId}_wrapper" rel="modal:open" id="${modalButtonId}_advanced_modal"></a></p>`;
            $('body').append(modalLink);
            break;
          default:
          case 'normal':
            modalLink = `<p><a href="#${modalFormId}_wrapper" rel="modal:open" id="${modalButtonId}_modal"></a></p>`;
            $('body').append(modalLink);
            break;
        }
        $(`#${modalFormId}_wrapper`).hide();
      });
    };
    /**
     * Hides or shows an element with a given transition type
     * @param {string} elementId - The element ID to hide or show
     * @param {object} transition - An object containing the transition type, duration and easing
     * @param {string} transition.type - Type of transition to use (show, slideToggle, slideUp, slideDown, hide)
     * @param {number} transition.duration - Duration of the transition in milliseconds
     * @param {string} transition.easing - Easing to use for the transition
     */
    var hideShowElement = (elementId, transition = {}) => {
      const { type = 'hide', duration = 0, easing = 'linear' } = transition;
      switch (type) {
        case 'show':
          $(elementId).show(duration, easing);
          break;
        case 'slideToggle':
          $(elementId).slideToggle(duration, easing);
          break;
        case 'slideUp':
          $(elementId).slideUp(duration, easing);
          break;
        case 'slideDown':
          $(elementId).slideDown(duration, easing);
          break;
        case 'hide':
        default:
          $(elementId).hide(duration, easing);
          break;
      }
    };
    /**
     * Handles stepper button functionality with optional validation skipping
     * (the default is to validate)
     * @param {HTMLElement} button - The button element that was clicked
     * @returns {Promise<void>}
     */
    var stepperButtonFunctionality = async (button) => {
      // Get section/container with the button that was clicked
      var section = $(button).parents('.consist-inner-step');
      var inputs = section.find(
        ':input:not([readonly], select:not([readonly]))'
      );
      var $form = $(button).closest('form');
      var validator = $form.data('validator') || $form.validate();
      var originalIgnore = validator.settings.ignore;
      if ($(button).data('no_validation_step')) {
        inputs.addClass('skip-validate');
        if (originalIgnore.indexOf('.skip-validate') === -1) {
          validator.settings.ignore =
            (originalIgnore ? originalIgnore + ', ' : '') + '.skip-validate';
        }
      } else {
        if (!$form.valid()) {
          return;
        }
      }
      validator.settings.ignore = originalIgnore;
      inputs.removeClass('skip-validate');

      var submitUrl = $(button).data('advanced_url'); // Because we use the same setting for both button types
      let submitSuccessData = null;
      let submitErrorData = null;
      if (submitUrl) {
        // Run pre-submit function (if exists and is callable)
        var preSubmitFunction = $(button).data('function_before_step_submit');
        if (
          preSubmitFunction &&
          typeof window[preSubmitFunction] === 'function'
        ) {
          try {
            window[preSubmitFunction]();
          } catch (e) {
            console.error(
              `ERROR: Function ${preSubmitFunction} threw an error`,
              e
            );
          }
        } else if (preSubmitFunction) {
          console.error(`ERROR: Function ${preSubmitFunction} does not exist`);
        }

        // Submit form
        await new Promise((resolve) => {
          $form.one('cform:submitComplete', resolve);
          $form.submit();
        });

        // Check post response data
        if ($form.data('submit-success-data')) {
          try {
            submitSuccessData = JSON.parse($form.data('submit-success-data'));
          } catch (e) {
            console.error('ERROR: Failed to parse submit-success-data', e);
          }
        }
        if ($form.data('submit-error-data')) {
          try {
            submitErrorData = JSON.parse($form.data('submit-error-data'));
          } catch (e) {
            console.error('ERROR: Failed to parse submit-error-data', e);
          }
        }

        // Run post-submit function
        if (
          (submitSuccessData && !submitErrorData) ||
          (submitErrorData?.status >= 200 && submitErrorData?.status < 300)
        ) {
          var postSubmitFunction = $(button).data('function_after_step_submit');
          if (
            postSubmitFunction &&
            typeof window[postSubmitFunction] === 'function'
          ) {
            try {
              window[postSubmitFunction]();
            } catch (e) {
              console.error(
                `ERROR: Function ${postSubmitFunction} threw an error`,
                e
              );
            }
          } else if (postSubmitFunction) {
            console.error(
              `ERROR: Function ${postSubmitFunction} does not exist`
            );
          }
        }
      }

      // Switch steps if data.stop_process is undefined or false
      var nextStep = $(button).data('next_step_id');
      if (
        (nextStep && !submitUrl && !submitSuccessData?.stop_process) ||
        (nextStep &&
          submitUrl &&
          ((submitSuccessData && !submitErrorData) ||
            (submitErrorData?.status >= 200 &&
              submitErrorData?.status < 300)) &&
          !submitSuccessData?.stop_process)
      ) {
        if (nextStep) {
          hideShowElement(`div#${nextStep}, section#${nextStep}`, {
            type: 'show',
          });
        }
        var currentStep = $(button).parents('.consist-inner-step').attr('id');
        if (currentStep && currentStep !== nextStep) {
          hideShowElement(`div#${currentStep}, section#${currentStep}`, {
            type: 'hide',
          });
        }
      }
    };

    let forms = $('.cform'),
      buttons = $('button[role=cbutton]'),
      widgets = $('[role=consist_widget'),
      conditinedElements = $('.has-conditioning'),
      $div,
      $form,
      onload,
      submitterBtn,
      stepSections = $('div[data-step]');
    // Debounce timer for keyup-driven conditioning
    let conditioningDebounceTimer = null;

    // Bind change/keyup/click/blur/focus eventsin in document for the conditioning
    $(document).on('change keyup click blur focus', 'body', function (e) {
      // if (e.type === 'keyup') {
      //   if (conditioningDebounceTimer) {
      //     clearTimeout(conditioningDebounceTimer);
      //   }
      //   conditioningDebounceTimer = setTimeout(() => {
      //     for (element of conditinedElements) {
      //       runConditions(element);
      //     }
      //   }, 500);
      //   return;
      // }
      // For other events - run immediately
      for (element of conditinedElements) {
        runConditions(element);
      }
    });

    $(document).on('click', 'button[role=cbutton]', function () {
      submitterBtn = $(this);
    });

    // Run on all buttons and bind if 'op' not submit
    buttons.each((_, b) => {
      if ($(b).attr('op') !== 'submit') {
        $(b).on('click', async function (e) {
          var buttonOp = $(b).attr('op');
          submitterBtn = $(this);
          if (buttonOp !== 'advanced') {
            e.preventDefault();
          }
          console.log(`DEBUG: ${buttonOp.toUpperCase()} was clicked`);
          switch (buttonOp) {
            case 'reset':
              var form = $(this).closest('form'),
                inputFields = $(form).find(':input:not([readonly], select)'),
                selectFields = $(form).find('select:not([readonly])'),
                sigFields = $(form).find('.elementor-field-type-signature img');

              for (var input of inputFields) {
                switch ($(input).attr('type')) {
                  case 'checkbox':
                  case 'radio':
                    checkRadioDefault(input);
                    break;
                  case 'file':
                    $(input)[0].files = new DataTransfer().files;
                    filesList[$(input).attr('name')] = [];
                    $(`#${$(input).attr('id')}-table tbody`).html('');
                    break;
                  default:
                    $(input).val($(input).data('default') || '');
                    break;
                }
              }

              for (var select of selectFields) {
                selectDefault(
                  select,
                  $(select).parents('.elementor-field-group').data('default')
                );
              }

              for (var sig of sigFields) {
                $(sig).attr(
                  'src',
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gIRESAmxMFZvQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAC0lEQVQI12NgAAIAAAUAAeImBZsAAAAASUVORK5CYII='
                );
              }
              break;
            case 'save':
              // TODO: save form (TBD)
              break;
            case 'advanced':
            default:
              // Do nothing
              break;
            case 'stepper':
              await stepperButtonFunctionality(this);
              break;
            case 'open_modal':
              // Old table modal
              console.log('DEBUG: Open popup');
              var modal = $(`#${$(b).attr('id')}_modal`);
              modal.trigger('click');
              break;
            case 'open_advanced_modal':
              // New table modal
              console.log('DEBUG: Open popup');
              var modal = $(`#${$(b).attr('id')}_advanced_modal`);
              modal.trigger('click');
              break;
          }
        });
      }
    });

    // textarea character counter
    let textareas = $('textarea.cinput');
    $(textareas).each((i, a) => {
      $(`#${$(a).attr('id')}_current-chars`).text($(a).val().length);

      $(a).keyup(function (e) {
        $(`#${$(a).attr('id')}_current-chars`).text($(a).val().length);
      });
    });

    var a = [];
    for (var widget of widgets) {
      var onloadUrl = $(widget).data('onload_url');
      if (onloadUrl) {
        a.push(populateFieldOptions(widget, onloadUrl));
      }
    }

    // Run functions after all forms are rendered
    document.addEventListener('allCformsRendered', () => {
      buildTableModalForm();
    });

    // Keep track of the number of forms that have been rendered
    let renderedFormsCount = 0;
    document.addEventListener('cFormRendered', () => {
      renderedFormsCount++;
      if (renderedFormsCount === forms.length) {
        document.dispatchEvent(new CustomEvent('allCformsRendered'));
      }
    });

    // Populate all forms when all ajax requests are resolved, whether successful or not
    $.when(...a).always(function (...k) {
      // Run on all forms in page
      forms.each((_, f) => {
        var formId = $(f).attr('id');
        var formVars = window[`cform_${formId}`];
        if (formVars !== undefined) {
          var {
            form_onload_url,
            form_submit_url,
            focus_on_error_field,
            query_params,
            first_step_id,
          } = formVars;
        }
        onload = form_onload_url
          ? parseUrl.getAll(form_onload_url)
          : { pathname: false };

        // Build the form's pseudo DOM elements
        if ($(f).closest('section').length > 0) {
          $div = $(f).closest('section[data-element_type="section"]');
        }

        if ($(f).closest('.e-con').length > 0) {
          $div = $(f).closest('div[data-element_type="container"]');
        }

        $form = $(
          `<form id="${formId}" method="post" action="${form_submit_url}"></form>`
        ).append($div.contents());
        $.each($div.prop('attributes'), function () {
          $form.attr(this.name, this.value);
        });
        $div.replaceWith($form);
        $form.addClass('cform');

        // Remove the original form widget
        $(f).closest('.elementor-widget-consist-form').remove();

        // Bind validation to the form
        var form_id = $(f).attr('id');
        $(`form#${form_id}`).validate({
          focusInvalid: focus_on_error_field === 'yes' ? true : false,
          errorElement: 'span',
          errorPlacement: (error, element) => {
            if (element.attr('type') === 'radio') {
              error.insertAfter(element.closest('.elementor-radio-wrapper'));
            } else if (element.attr('type') === 'checkbox') {
              error.insertAfter(element.closest('.elementor-checkbox-wrapper'));
            } else {
              error.insertAfter(element);
            }
          },
          onfocusout: function (element) {
            this.element(element);
          },
          submitHandler: formSubmitHandler,
          invalidHandler: formInvalidHandler,
          ignore: ':hidden, input[type=range]',
        });

        // Populate form data
        if (onload.pathname) {
          const { obj: onloadParams } = generateCombinedQuery(
            onload.vars,
            query_params
          );
          onloadUrl = `${onload.protocol}${onload.protocol ? '//' : ''}${
            onload.host
          }${onload.pathname}`;
          $.ajax({
            type: 'GET',
            url: onloadUrl,
            data: onloadParams,
            dataType: 'json',
            success: async (data) => {
              var formId = $(f).attr('id');
              var formVars = window[`cform_${formId}`];
              if (formVars !== undefined) {
                var { form_onload_type, post_onload_function_name } = formVars;
              }
              var valuesOrData = form_onload_type === 'values' ? true : false;
              await populateForm(formId, data, valuesOrData);
              $('body').trigger('change');
              console.log('DEBUG: Populate success', data);
              console.log('DEBUG: Alert message', data['alert_message']);
              await reservedKeywordsHandler(data);
              try {
                if (post_onload_function_name) {
                  window[post_onload_function_name]();
                }
              } catch {
                console.error(
                  `ERROR: Function ${post_onload_function_name} does not exist`
                );
              }
              // TODO: Populate the form on all widget types
            },
            error: (data) => {
              console.error('DEBUG: Failed to get onload data.');
              // TODO: Alert user?
            },
          });
        }

        // Run all conditions
        for (element of conditinedElements) {
          runConditions(element);
        }

        // Show first step if defined
        if (first_step_id) {
          hideShowElement(`div#${first_step_id}, section#${first_step_id}`, {
            type: 'show',
          });
        }

        console.log(`DEBUG: Form #${formId} is rendered'`);
        document.dispatchEvent(new CustomEvent('cFormRendered'));
      });
    });
  });
})(jQuery);
