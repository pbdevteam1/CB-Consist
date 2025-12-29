let filesList = {},
  submitterBtn,
  submitUrl,
  advancedBtnClicked = false;

var $ = jQuery,
  clientIp,
  clickedFormButton = '';
var parseUrl = {
    url: '',
    schema: '',
    domain: '',
    path: '',
    vars: {},
    /**
     * Return the url of the current page if no parameter is given or return the parameter as it is.
     * @param {string} url - The URL to be returned.
     * @returns {string} The URL.
     */
    getUrl: function (url) {
      this.url = url ?? window.location.href;
      return this.url;
    },
    /**
     * Returns the schema of a URL.
     * @param {string} [url] - The URL from which to get the schema.
     *   If not given, the current page URL is used.
     * @returns {string} The schema of the URL.
     * @example
     * parseUrl.getProtocol('https://example.com/'); // Returns 'https'
     */
    getProtocol: function (url) {
      url = url ?? this.getUrl();
      const parsed = new URL(url);

      return (this.protocol = parsed.protocol);
    },
    /**
     * Returns the domain of a URL.
     * @param {string} [url] - The URL from which to get the domain.
     *   If not given, the current page URL is used.
     * @returns {string} The domain of the URL.
     * @example
     * parseUrl.getHostname('https://example.com/'); // Returns 'example.com'
     */
    getHostname: function (url) {
      url = url || this.getUrl();
      const parsed = new URL(url);

      return (this.hostname = parsed.hostname);
    },
    /**
     * Returns the path of a URL.
     * @param {string} [url] - The URL from which to get the path.
     *   If not given, the current page URL is used.
     * @returns {string} The path of the URL.
     * @example
     * parseUrl.getPathname('https://example.com/path'); // Returns '/path'
     */
    getPathname: function (url) {
      url = url || this.getUrl();
      const parsed = new URL(url);

      return (this.pathname = parsed.pathname);
    },
    /**
     * Returns the query string variables of a URL as a key-value object.
     * @param {string} [url] - The URL from which to get the query string variables.
     *   If not given, the current page URL is used.
     * @returns {Object} The query string variables as a key-value object.
     * @example
     * parseUrl.getVars('https://example.com/?foo=bar&baz=1'); // Returns {foo: 'bar', baz: '1'}
     */
    getVars: function (url) {
      url = url ?? this.getUrl();
      const searchParams = new URL(url).searchParams;
      const paramsObject = {};

      for (const [key, value] of searchParams.entries()) {
        paramsObject[key] = value;
      }

      return (this.vars = paramsObject);
    },
    /**
     * Returns an object containing the full URL, schema, domain, path, and query variables of a given URL.
     * If no URL is provided, it uses the current page URL.
     * @param {string} [url] - The URL to parse. If not provided, the current page URL is used.
     * @returns {Object} An object with the following properties:
     *   - {string} url: The full URL.
     *   - {string} schema: The schema of the URL (e.g., 'https').
     *   - {string} domain: The domain of the URL (e.g., 'example.com').
     *   - {string} path: The path of the URL.
     *   - {Object} vars: The query string variables as a key-value object.
     */
    getAll: function (url) {
      url = url ?? this.getUrl();
      const parsed = new URL(url);
      const searchParams = parsed.searchParams;
      const paramsObject = {};

      for (const [key, value] of searchParams.entries()) {
        paramsObject[key] = value;
      }

      return {
        url: url,
        protocol: parsed.protocol,
        host: parsed.host,
        pathname: parsed.pathname,
        vars: paramsObject,
      };
    },
  },
  isObject = (variable) => {
    return (
      typeof variable === 'object' &&
      variable !== null &&
      !Array.isArray(variable)
    );
  },
  isJSON = (variable) => {
    return (
      Object.prototype.toString.call(variable) === '[object Object]' &&
      !Array.isArray(variable)
    );
  },
  /**
   * This function will setfield's options or set the value of the field (depending on its type)
   *
   * element:  jQuery element. The element we about to set
   * data:     Any. The data to set the element with
   * setValue: Boolean. By default its true and will set the value of the field according to its type.
   *           If false, the function will create the field options (if this is a type of field
   *           with options like select, autocomplete, table, etc. With other fields, like text,
   *           date, it will set the value.
   */
  setElementData = (element, data, setValue = true) => {
    try {
      let elementType;
      if (element.length) {
        elementType = $(element).prop('nodeName').toLowerCase();
        if (elementType === 'div') {
          elementType = $(element).data('element_type').toLowerCase();
        }
      }
      elementType =
        elementType === 'input'
          ? $(element).hasClass('cautocomplete')
            ? 'autocomplete'
            : $(element).hasClass('cdatetime')
            ? 'datetime'
            : $(element).attr('type')
          : elementType;
      if (elementType) {
        switch (elementType) {
          case 'text':
          case 'password':
          case 'url':
          case 'tel':
          case 'email':
          case 'hidden':
          case 'number':
            if (typeof data !== 'string')
              throw new Error('data for text must be a string');

            $(element).val(data);
            break;
          case 'textarea':
            if (typeof data !== 'string')
              throw new Error('data for textarea must be a string');

            $(element).html('');
            $(element).append(data);
            break;
          case 'range':
            if (setValue) {
              if (typeof data !== 'string')
                throw new Error('data for range must be a string');

              $(element).val(data).trigger('input');
            } else {
              try {
                if (typeof data.min !== 'undefined') {
                  $(element).attr('min', data.min);
                } else {
                  $(element).attr('min', '1');
                }
                if (typeof data.max !== 'undefined') {
                  $(element).attr('max', data.max);
                } else {
                  $(element).attr('max', '10');
                }
                if (typeof data.step !== 'undefined') {
                  $(element).attr('step', data.step);
                } else {
                  $(element).attr('step', '1');
                }
                if (
                  typeof data.min !== 'undefined' &&
                  typeof data.max !== 'undefined' &&
                  typeof data.step !== 'undefined' &&
                  typeof data.labels !== 'undefined' &&
                  Array.isArray(data.labels) &&
                  data.labels.length
                ) {
                  $(element).next('.range_data.container').html('');
                  var rMin = +data.min,
                    rMax = +data.max,
                    rStep = +data.step;

                  for (i = rMin; i <= rMax; i += rStep) {
                    var label = data.labels.find((item) => +item.value === i);
                    if (label) {
                      if (label.label) {
                        var align = label.align
                          ? `text-align:${label.align}`
                          : '';
                        $(element)
                          .next('.range_data.container')
                          .append(
                            `<div value='${i}' style='${align}'>${label.label}</div>`
                          );
                      } else {
                        $(element)
                          .next('.range_data.container')
                          .append(`<div value='${i}' style=''></div>`);
                      }
                    } else {
                      $(element)
                        .next('.range_data.container')
                        .append(`<div value='${i}' style=''></div>`);
                    }
                  }
                }

                if (typeof data.value !== 'undefined')
                  $(element).attr('value', data.value);

                $(element).val(data.value).trigger('input');
              } catch (error) {
                throw new Error('value for range is not formatted correctly');
              }
            }
            break;
          case 'datetime':
            if (typeof data !== 'string')
              throw new Error('data for text must be a string');

            var fp = $(element).flatpickr(
              window[`${$(element).attr('id')}FlatpickrOptions`]
            );
            fp.setDate(data);
            break;
          case 'autocomplete':
            if (setValue) {
              // Set the value of the autocomplete field
              if (typeof data !== 'string')
                throw new Error('data for autocomplete must be a string');

              $(element).val(data);
            } else {
              // Build the autocomplete field options
              if (!isObject(data))
                throw new Error('data for autocomplete must be an object');

              window[`${$(element).attr('id')}_fieldVars`].options = data;
              setAutocomplete(element, Object.keys(data));
            }
            break;
          case 'select':
            if (setValue) {
              // Set the value of the select field
              if (typeof data !== 'string' && !Array.isArray(data))
                throw new Error('data for select must be a string or array');

              let selectValue;
              if (Array.isArray(data) && !data.length)
                throw new Error('data for select cannot be an empty array');

              if (Array.isArray(data) && !$(element).attr('multiple')) {
                selectValue = data[data.length - 1];
              } else {
                selectValue = data;
              }

              $(element).val(selectValue).trigger('change');
            } else {
              // Build the select field options
              if (!isObject(data))
                throw new Error('values for select must be an object');

              var select = element,
                multiSelect =
                  $(element).attr('multiple') === 'multiple' ? true : false,
                defaultValue = $(element).data('default').toString().split('|'),
                valuesArray = [];
              // Clear old options
              $(element).html('');
              // Build new options from data
              for (var key in data) {
                $(element).append(
                  `<option value="${data[key]}">${key}</option>`
                );
                valuesArray.push(data[key]);
              }
              // Set default value(s)
              if (multiSelect) {
                $(element).val(defaultValue).trigger('change');
              } else {
                if (valuesArray.includes(defaultValue[0])) {
                  $(element).val(defaultValue[0]).trigger('change');
                }
              }
            }
            break;
          case 'radio':
          case 'checkbox':
            if (setValue) {
              if (!Array.isArray(data))
                throw new Error('data for radio/checkbox must be an array');

              var radioCechboxFields = $(element).find('input');
              $(radioCechboxFields).prop('checked', false).trigger('change');
              for (i = 0; i < radioCechboxFields.length; i++) {
                var inputField = $(radioCechboxFields[i]);
                if (data.includes(inputField.val())) {
                  inputField.prop('checked', true).trigger('change');
                }
              }
            } else {
              if (!isObject(data))
                throw new Error('data for radio/checkbox must be an object');

              createRadioCheckboxFromOnloadData(element, elementType, data);
            }
            break;
          case 'table':
            if (!Array.isArray(data))
              throw new Error('data for table must be an array');

            populateTable(element, data);
            break;
          case 'stepper':
            if (!Array.isArray(data))
              throw new Error('data for stepper must be an array');

            // Clear any old stepper html
            $(element).html('');
            for (i = 0; i < data.length; i++) {
              var step = data[i];
              buildStep(element, i, step);
            }
            break;
          default:
            console.log(
              `DEBUG: element type "${elementType}" is not recognized`
            );
            break;
        }
      }
    } catch (error) {
      console.error(`DEBUG: setElementData warning: ${error.message}`);
    }
  },
  populateForm = (formId, data, valuesOrData = true) => {
    var disabledFields = $(`form#${formId}`).find('[disabled]');
    disabledFields.prop('disabled', false);

    for (var fid in data) {
      var element = $(`#${fid}`);
      setElementData(element, data[fid], valuesOrData);
    }
    $(disabledFields).prop('disabled', true);
  },
  generateCombinedQuery = (vars = {}, additionalVars = undefined) => {
    const urlQueryVars = parseUrl.getVars?.() || {};
    const merged = { ...vars };

    if (Array.isArray(additionalVars)) {
      for (const key of additionalVars) {
        if (key in urlQueryVars) merged[key] = urlQueryVars[key];
      }
    } else if (additionalVars && typeof additionalVars === 'object') {
      for (const key of Object.keys(additionalVars)) {
        merged[key] = additionalVars[key];
      }
    }

    return {
      obj: merged,
      str: $.param(merged, true),
    };
  },
  validateUrl = function (text) {
    try {
      if (!text || !text.length) return false;
      return true;
    } catch (error) {
      return false;
    }

    try {
      if (!text || !text.length) return false;
      var pat =
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        regEx = new RegExp(pat);
      return text.match(regEx);
    } catch (error) {
      console.error('DEBUG: validateUrl error', error.message);
    }
  };
/**
 * Removes data for fields that are set to not be sent in form data post
 * @param {object} data - Form data object
 * @param {object} [options={ excludeHiddenFields: true }] - Options to control the filtering
 * @param {boolean} [options.excludeHiddenFields=true] - Whether to exclude fields that are hidden
 * @returns {object} The filtered form data object
 */
var removeExcludedFieldsData = (
    data,
    options = { excludeHiddenFields: true }
  ) => {
    var { excludeHiddenFields } = options;

    let filteredData = data;
    var dataKeys = Object.keys(data);

    dataKeys.map((k) => {
      var wrapperElement = $(`#${k}`).closest('.elementor-field-group');
      var sendDataInPost = $(wrapperElement).data('post-data');

      if (excludeHiddenFields) {
        var hiddenField = $(wrapperElement).data('hidden_field');
        if (hiddenField === 'hidden') filteredData[k] = '';
      }

      if (sendDataInPost !== undefined && !sendDataInPost) {
        delete filteredData[k];
      }
    });

    return filteredData;
  },
  getAdditionalFormData = function (form) {
    var form_id = $(form).attr('id'),
      formDataParams = window[`cform_${form_id}`]?.additional_form_data,
      today = new Date();
    let formData = {};
    if (formDataParams) {
      for (var param of formDataParams) {
        switch (param) {
          case 'date':
            formData = {
              ...formData,
              date: `${today.getFullYear()}-${`0${today.getMonth() + 1}`.slice(
                -2
              )}-${`0${today.getDate()}`.slice(-2)}`,
            };
            break;
          case 'time':
            formData = {
              ...formData,
              time: `${`0${today.getHours()}`.slice(
                -2
              )}:${`0${today.getMinutes()}`.slice(
                -2
              )}:${`0${today.getSeconds()}`.slice(-2)}`,
            };
            break;
          case 'link_to_page':
            formData = {
              ...formData,
              link_to_page: window.location.href,
            };
            break;
          case 'user_agent':
            formData = {
              ...formData,
              user_agent: window.navigator.userAgent,
            };
            break;
          case 'sender_IP':
            formData = { ...formData, client_ip: clientIp };
            break;
          case 'form_ID':
            formData = { ...formData, form_id: form_id };
            break;
        }
      }
    }

    return formData;
  },
  getFormSerializeData = async function (form) {
    return new Promise(async (resolve) => {
      var disabledFields = $(form).find('[disabled]');
      disabledFields.prop('disabled', false);
      var formData = $(form).serializeArray();
      $(disabledFields).prop('disabled', true);

      let innerFormData = {};

      var form_id = $(form).attr('id');
      var includedForms = $(`#${form_id}`).find('form');
      if (includedForms.length) {
        for (form of includedForms) {
          innerFormData = {
            ...(await getFormSerializeData(form)),
            ...innerFormData,
          };
        }
        resolve({
          ...[...Object.values(formData), ...Object.values(innerFormData)],
        });
      } else {
        resolve(formData);
      }
    });
  },
  getSignatureData = function (form) {
    var form_id = $(form).attr('id');
    if ($(form).find('.elementor-field-type-signature')) {
      var sigFields = $(form).find('.elementor-field-type-signature img');
      var sigData = [];
      for (var sig of sigFields) {
        sigData[$(sig).attr('name')] = $(sig).attr('src');
      }
      return sigData;
    } else {
      return false;
    }
  },
  getFileUploadData = async (form) => {
    if ($(form).find('.elementor-upload-field')) {
      var filesFields = $(form).find('.elementor-upload-field');
      var data = {};
      for (var fileField of filesFields) {
        var fileFieldName = $(fileField).attr('name');
        data[fileFieldName] = [];

        if (filesList[fileFieldName] !== undefined) {
          for (file of filesList[fileFieldName]) {
            base64 = await getBase64(file);
            data[fileFieldName].push({ fileName: file.name, base64: base64 });
          }
        }
      }
      return data;
    } else {
      return {};
    }
  },
  getTableRowData = (columnIds, row) => {
    var columns = $(row).find('td'),
      rowData = {};
    let c = 0;
    for (var column of columns) {
      // TODO: handle remove row ???
      if (columnIds[c] !== 'row-index' && columnIds[c] !== 'row-delete') {
        if ($(column).data('column_type') === 'checkbox') {
          rowData[columnIds[c]] = $(column).text().split(',');
        } else {
          rowData[columnIds[c]] = $(column).text();
        }
      }
      c++;
    }

    return rowData;
  },
  getTableData = (form) => {
    var data = {};
    // New table data
    var tables = $(form).find('table.consist-data-table');
    if (tables.length) {
      for (var table of tables) {
        if ($(table).hasClass('send-table-data')) {
          var tableId = $(table).attr('id');
          data[tableId] = [];
          var rows = $(table).find('tbody').find('tr');
          if (rows.length) {
            var headerColumns = $(table).find('thead').find('tr').find('th'),
              columnIds = [];
            for (var c of headerColumns) {
              columnIds.push($(c).data('column-id'));
            }
            for (var row of rows) {
              data[tableId].push(getTableRowData(columnIds, row));
            }
          }
        }
      }
    }
    // Old table data
    if ($(form).find('table.consist-table')) {
      var tables = $(form).find('table.consist-table');
      for (var table of tables) {
        if ($(table).hasClass('send-table-data')) {
          var tableId = $(table).attr('id');
          data[tableId] = [];
          if ($(table).find('tbody').find('tr')) {
            var rows = $(table).find('tbody').find('tr');
            for (var row of rows) {
              var columns = $(row).find('td');
              var rowData = {};
              for (var column of columns) {
                if (!$(column).hasClass('remove-row')) {
                  if ($(column).data('column_type') === 'checkbox') {
                    rowData[$(column).data('col')] = $(column)
                      .text()
                      .split(',');
                  } else {
                    rowData[$(column).data('col')] = $(column).text();
                  }
                }
              }
              data[tableId].push(rowData);
            }
          }
        }
      }

      return data;
    } else {
      return {};
    }
  },
  getAutocompleteData = (form) => {
    if ($(form).find('.cautocomplete')) {
      var autocompleteFields = $(form).find('.cautocomplete');
      var data = {};
      for (var autocompleteField of autocompleteFields) {
        var autocompleteFieldName = $(autocompleteField).attr('name');
        var variableName = `${$(autocompleteField).attr('id')}_fieldVars`;
        if (window[variableName].options !== undefined) {
          var fieldOptionsKeys = Object.values(window[variableName].options);
          var fieldOptionsValues = Object.keys(window[variableName].options);
        }
        var fieldSelectedValue = $(autocompleteField).val();
        if (fieldOptionsValues !== undefined) {
          var index = fieldOptionsValues.indexOf(fieldSelectedValue);
        }
        data[autocompleteFieldName] =
          fieldOptionsKeys !== undefined && index !== -1
            ? fieldOptionsKeys[index]
            : '';
      }
      return data;
    } else {
      return {};
    }
  };
/**
 * Returns an object with the form data.
 * @param {Object} form The form element
 * @param {Object} options The options object
 * @return {Object} The form data object
 */
var getFormData = async (form, options) => {
    var sData = await getFormSerializeData(form),
      sigData = getSignatureData(form),
      uploadData = await getFileUploadData(form),
      tableData = getTableData(form),
      autocompleteData = getAutocompleteData(form);
    // console.log('DEBUG: sData', sData);
    // console.log('DEBUG: sigData', sigData);
    // console.log('DEBUG: uploadData', uploadData);
    // console.log('DEBUG: tableData', tableData);
    // console.log('DEBUG: autocompleteData', autocompleteData);
    let formData = getAdditionalFormData(form),
      fieldName;
    formData = {
      ...formData,
      ...sigData,
      ...uploadData,
      ...tableData,
      ...autocompleteData,
    };
    $.each(sData, (k, v) => {
      fieldName = v.name;
      if (fieldName in autocompleteData) {
        return;
      }
      if (fieldName.substr(-2, 2) === '[]') {
        fieldName = v.name.substr(0, v.name.length - 2);
        if (formData[fieldName] === undefined) {
          formData[fieldName] = [];
        }
        formData[fieldName].push(v.value);
      } else if (Object.keys(formData).includes(fieldName)) {
        if (Array.isArray(formData[fieldName])) {
          formData[fieldName].push(v.value);
        } else {
          formData[fieldName] = [formData[fieldName]];
          formData[fieldName].push(v.value);
        }
      } else {
        formData[fieldName] = v.value;
      }
    });
    formData = removeExcludedFieldsData(formData, options);
    if (options.log) {
      console.log('DEBUG: excluded form data', options.excludeHiddenFields);
      console.log('DEBUG: formData', formData);
    }
    return formData;
  },
  checkRadioDefault = function (input) {
    $(input).removeAttr('checked');
    let defaultValues = $(`.elementor-field-type-${$(input).attr('type')}`)
      .data('default')
      .toString();
    defaultValues = defaultValues.includes('|')
      ? defaultValues.split('|')
      : [defaultValues];
    if (defaultValues.includes($(input).val().toString())) {
      $(input).attr('checked', true).click();
    }
  },
  selectDefault = function (element, defaults) {
    for (var option of $(element).find('option')) {
      $(option).removeAttr('selected');
    }
    if (defaults) {
      if ($(element).attr('multiple')) {
        var selectedOptions = defaults.split('|');
        for (var option in selectedOptions) {
          $(`option[value=${option}]`).attr('selected', true);
        }
        $(element).val(selectedOptions).change();
      } else {
        let selectedOption = defaults.toString();
        if (selectedOption.includes('|')) {
          selectedOption = selectedOption.split('|')[0];
        }
        $(`option[value=${selectedOption}]`).attr('selected', true);
        $(element).val(selectedOption).change();
      }
    } else {
      var firstOption = $(element).find('option').first();
      $(firstOption).attr('selected', true);
      $(element).val($(firstOption).val()).change();
    }
  },
  populateFieldOptions = function (widget, onloadUrl) {
    let i, id, element;
    if (validateUrl(onloadUrl)) {
      return $.ajax({
        type: 'get',
        url: onloadUrl,
        dataType: 'json',
        success: function (data) {
          console.log('DEBUG: Field onload data:', data);
          try {
            var elementType = $(widget).data('element_type');
            let setValue = true;
            // TODO: Once all widget's onload will take no ID, there will be no need for fieldData
            let fieldData = data[id] || data;
            switch (elementType) {
              case 'text':
              case 'date':
              case 'time':
                element = $(widget).find('input');
                break;
              case 'range':
                element = $(widget).find('input');
                setValue = false;
                break;
              case 'textarea':
                break;
              case 'select':
                element = $(widget).find('select');
                setValue = false;
                fieldData = data;
                break;
              case 'radio':
              case 'checkbox':
                element = $(widget);
                setValue = false;
                // TODO: Once all widget's onload will take no ID, take the data responce as is
                fieldData = data;
                break;
              case 'autocomplete':
                element = $(widget).find('input');
                setValue = false;
                // TODO: Once all widget's onload will take no ID, take the data responce as is
                fieldData = data;
                break;
              case 'table':
                element = $(widget).find('table');
                fieldData = data.data;
                break;
              case 'steper':
                console.log('stepper');
                break;
            }
            id = $(element).attr('id');
            // TODO: Once all widget's onload will take no ID, return to pass the data
            setElementData(element, fieldData, setValue);
          } catch (error) {
            console.error('DEBUG: Field onload error', error.message);
          }
        },
        error: function (data) {
          console.log('DEBUG: Field onload error:', data);
        },
      });
    }
  },
  populateTable = (table, tableData) => {
    var tableType = $(table).hasClass('dataTable') ? 'advanced' : 'normal',
      columns = $(table).find('th'),
      tableId = $(table).attr('id');
    // Clear table data
    switch (tableType) {
      case 'advanced':
        window[`table_${tableId}`].rows().remove().draw(false);
        break;
      default:
      case 'normal':
        $(table).find('tbody').html('');
        break;
    }

    // Add rows to table
    for (var row of tableData) {
      switch (tableType) {
        case 'advanced':
          addRowAdvanced(table, columns, row);
          break;
        default:
        case 'normal':
          addRow(table, row);
          break;
      }
    }
  },
  createRadioCheckboxFromOnloadData = (element, elementType, data) => {
    var label = $(element).children().first('label');
    var inputLabelClassTypography =
      $(element).data('typography') === 'custom'
        ? 'class="custom-typography"'
        : '';
    var inlineWrapper = $(element).find('.inline-wrapper');
    // Remove previous input fields in group
    if (inlineWrapper.length) {
      $(inlineWrapper).html('');
    } else {
      $(element).html('').append(label);
    }

    id = $(element).attr('id');
    i = 0;
    let option;
    for (var key in data) {
      option = `<div class="elementor-field-option elementor-size-sm" style="margin:0 5px;">
        <input type="${elementType}" value="${data[key]}" id="${id}-${i}" name="${id}[]"></input>
        <label for="${id}-${i}" ${inputLabelClassTypography}>${key}</label>
        </div>`;
      if (inlineWrapper.length) {
        $(inlineWrapper).append(option);
      } else {
        $(element).append(option);
      }
      i++;
    }
  },
  createSelectFromOnloadData = (element, data) => {
    var select = element,
      defaultValue = $(element).data('default'),
      valuesArray = [];
    // clear old options
    $(select).html('');
    // Build options from data
    for (var key in data) {
      $(select).append(`<option value="${data[key]}">${key}</option>`);
      valuesArray.push(data[key]);
    }
    if (valuesArray.includes(defaultValue)) {
      $(select).val(defaultValue).trigger('change');
    }
  };
/**
 * Evaluates a condition string on a form
 * @param {string} str Condition string. Multiple lines are joined with ' && '.
 * @param {HTMLFormElement} form Form to evaluate the condition on.
 * @returns {Promise<boolean>} Result of the evaluation.
 */
var evaluateConditionString = async function (str, form) {
  try {
    const isFieldHidden = (name) => {
      // Check both name and name[] in a single selector, then look up the group once.
      const $group = $(`[name="${name}"], [name="${name}[]"]`).closest(
        '.elementor-field-group'
      );
      return $group.data('hidden_field') === 'hidden';
    };

    var formData = await getFormData(form, { excludeHiddenFields: false });
    var strLines = str.split('\n').map((line) => {
      var fieldNames = [...line.matchAll(/\{.*?\}/gm)].map((f) =>
        f[0].trim().replaceAll(/\{|\}/g, '')
      );
      const hasHiddenField = fieldNames.some(isFieldHidden);

      return hasHiddenField ? 'true' : `(${line})`;
    });
    str = strLines.join(' && ');
    [...str.matchAll(/\{.*?\}/gm)].map((f) => {
      var fname = f[0].trim().replaceAll(/\{|\}/g, '');
      var $fnameGroup = $(`[name="${fname}"], [name="${fname}[]"]`).attr(
        'type'
      );
      if ($fnameGroup) {
        switch ($fnameGroup) {
          case 'select':
            if (Array.isArray(formData[fname])) {
              str = str.replaceAll(
                f,
                `"${JSON.stringify(formData[fname]).replaceAll('"', '\\"')}"`
              );
            } else {
              str = str.replaceAll(f, `"[\\"${formData[fname]}\\"]"`);
            }
            break;
          case 'checkbox':
            str = str.replaceAll(
              f,
              `"${
                Array.isArray(formData[fname])
                  ? JSON.stringify(formData[fname]).replaceAll('"', '\\"')
                  : '[\\"\\"]'
              }"`
            );
            break;
          case 'radio':
            str = str.replaceAll(
              f,
              `"${
                Array.isArray(formData[fname])
                  ? JSON.stringify(formData[fname]).replaceAll(/[\["\]]/g, '')
                  : ''
              }"`
            );
            break;
          case 'signature':
            str = str.replaceAll(
              f,
              `"${formData[fname]}" !== "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gIRESAmxMFZvQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAC0lEQVQI12NgAAIAAAUAAeImBZsAAAAASUVORK5CYII="`
            );
            break;
          default:
            str = str.replaceAll(
              f,
              `"${formData[fname].replaceAll(/(["\\\r\\\n])/g, '\\$1')}"`
            );
            break;
        }
      }
    });

    return { str, condition: strLines.join(' && '), eval: eval(str) };
  } catch (error) {
    console.error(`DEBUG: Evaluation error on a condition ${str}.`, error);
    console.error(`DEBUG: Evaluate result`, true);
    return true;
  }
};
/**
 * Runs a condition on an element.
 * @param {HTMLElement} element - Element containing the condition.
 * @returns {Promise<void>} Resolves when the condition is evaluated.
 */
var runConditions = async function (element) {
  var conditionType = $(element).data('condition-type');
  var condition = $(element).data('condition');
  var form = $(element).parents('form');
  if (condition) {
    var conditionEvaluate = await evaluateConditionString(condition, form);
    var elementToManipulate = $(element).find('.elementor-field-group');
    switch (conditionType) {
      case 'show':
        if (conditionEvaluate.eval) {
          $(element).show();
          elementToManipulate.data('hidden_field', 'shown');
        } else {
          $(element).hide();
          elementToManipulate.data('hidden_field', 'hidden');
        }
        break;
      case 'hide':
        if (conditionEvaluate.eval) {
          $(element).hide();
          elementToManipulate.data('hidden_field', 'hidden');
        } else {
          $(element).show();
          elementToManipulate.data('hidden_field', 'shown');
        }
        break;
    }
    // console.log(
    //   `DEBUG: Condition \`${conditionEvaluate.condition}\` result: ${conditionEvaluate.eval}`
    // );
    // console.log(`DEBUG: Condition type \`${conditionType}\``);
  }
};

(async ($) => {
  try {
    var data = await $.getJSON('https://api.ipify.org?format=json');
    clientIp = data.ip;
  } catch (error) {
    console.error('DEBUG: Error fetching IP address.');
  }
})(jQuery);

/* ====== Get clicked button accross platforms (solves an issue on iOS) ====== */
document.addEventListener('click', function (e) {
  if (e.target.matches('button')) {
    e.target.focus();
    clickedFormButton = $(e.target).attr('op');
  }
});
/* ====== Add form validation methods========================================= */
$.validator.addMethod(
  'email',
  function (text, element) {
    var pat =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return this.optional(element) || text.match(pat);
  },
  $.validator.format(consist_utils.generalMessages.validation.email)
);
$.validator.addMethod(
  'id_number',
  function (text, element) {
    if (text.length !== 9) return this.optional(element);
    let sum = 0,
      incNum;
    for (var i in text) {
      incNum = Number(text[i]) * ((i % 2) + 1);
      sum += incNum > 9 ? incNum - 9 : incNum;
    }
    return this.optional(element) || sum % 10 === 0;
  },
  $.validator.format(consist_utils.generalMessages.validation.id_number)
);
$.validator.addMethod(
  'pattern',
  function (text, element) {
    var pat = new RegExp(element.pattern);
    return this.optional(element) || text.match(pat);
  },
  $.validator.format(consist_utils.generalMessages.validation.pattern)
);
var minimumselectionErrorMessage;
$.validator.addMethod(
  'minimumselection',
  function (text, element) {
    minimumselectionErrorMessage = element.getAttribute(
      'data-msg-minimumselection'
    );
    var count = 0;
    var minimum = 0;
    if (element.type == 'checkbox') {
      var parentId = element.id.substr(0, element.id.lastIndexOf('-'));
      minimum = document.getElementById(parentId).getAttribute('data-minimum');
      var options = $(`input[id*=${parentId}]`);
      for (var i = 0; i < options.length; i++) {
        if (options[i].checked) {
          count++;
        }
      }
    } else {
      minimum = element.getAttribute('data-minimum');
      var options = element.children;
      for (var i = 0; i < options.length; i++) {
        if (options[i].selected) {
          count++;
        }
      }
    }

    return count >= minimum;
  },
  $.validator.format(minimumselectionErrorMessage)
);
$.validator.addMethod(
  'time_range',
  function (text, element) {
    var min,
      max,
      minValid = true,
      maxValid = true;
    val = new Date('01-01-2011 ' + element.value);
    if (element.hasAttribute('minhour')) {
      min = new Date('01-01-2011 ' + element.getAttribute('minhour'));
      minValid = val >= min;
    }
    if (element.hasAttribute('maxhour')) {
      var max = new Date('01-01-2011 ' + element.getAttribute('maxhour'));
      maxValid = val <= max;
    }
    if (max < min) {
      return minValid || maxValid;
    }
    return minValid && maxValid;
  },
  $.validator.format(consist_utils.generalMessages.validation.time_range)
);
$.validator.addMethod(
  'date_range',
  function (text, element) {
    parsed_date = element.value;
    if (!parsed_date) {
      return true;
    }
    if (parsed_date.includes('-')) {
      date_format = element.getAttribute('dateformat').split('-');
      parsed_date = parsed_date.split('-');
    } else if (parsed_date.includes('/')) {
      date_format = element.getAttribute('dateformat').split('/');
      parsed_date = parsed_date.split('/');
    } else if (parsed_date.includes('.')) {
      date_format = element.getAttribute('dateformat').split('.');
      parsed_date = parsed_date.split('.');
    } else if (parsed_date.includes(' ')) {
      date_format = element.getAttribute('dateformat').split(' ');
      parsed_date = parsed_date.split(' ');
    }
    new_date = `${parsed_date[date_format.indexOf('Y')]}-${
      parsed_date[date_format.indexOf('m')]
    }-${parsed_date[date_format.indexOf('d')]}`;
    valid = true;
    if (element.min) {
      valid = new Date(new_date) >= new Date(element.min);
    }
    if (element.max) {
      valid = valid && new Date(element.max) >= new Date(new_date);
    }
    return valid;
  },
  $.validator.format(consist_utils.generalMessages.validation.date_range)
);
$.validator.addMethod(
  'signature_required',
  function (text, element) {
    return text === 'valid';
  },
  $.validator.format(
    consist_utils.generalMessages.validation.signature_required
  )
);
$.validator.addMethod(
  'max_files_validate',
  function (text, element) {
    let fileFieldName = element.getAttribute('name'),
      maxFiles = element.getAttribute('data-max_files');
    if (filesList[fileFieldName].length > maxFiles) {
      return false;
    }
    return true;
  },
  $.validator.format(
    consist_utils.generalMessages.validation.max_files_validate
  )
);
$.validator.addMethod(
  'max_size_validate',
  function (text, element) {
    let fileFieldName = element.getAttribute('name'),
      max_size = element.getAttribute('data-max_size');
    for (var i = 0; i < filesList[fileFieldName].length; i++) {
      if (filesList[fileFieldName][i].size / 1024 / 1024 > max_size) {
        return false;
      }
    }
    return true;
  },
  $.validator.format(consist_utils.generalMessages.validation.max_size_validate)
);
$.validator.addMethod('min_validate', function (text, element) {
  let min = element.getAttribute('min_validate');
  if (parseInt(element.value) < parseInt(min)) {
    return false;
  }
  return true;
});
$.validator.addMethod('max_validate', function (text, element) {
  let max = element.getAttribute('max_validate');
  if (parseInt(element.value) > parseInt(max)) {
    return false;
  }
  return true;
});
$.validator.addMethod('step_validate', function (text, element) {
  if (element.getAttribute('type') !== 'range') {
    let step = element.getAttribute('step_validate');
    if (element.value && parseInt(element.value) % parseInt(step) !== 0) {
      return false;
    }
  }
  return true;
});
$.validator.addMethod(
  'file_types_validate',
  function (text, element) {
    let fileFieldName = $(element).attr('name'),
      fileTypes = $(element)
        .data('file_types')
        .split(',')
        .map((t) => t.toLowerCase().trim());

    for (var i = 0; i < filesList[fileFieldName].length; i++) {
      if (
        !fileTypes.includes(
          filesList[fileFieldName][i].name.split('.').pop().toLowerCase()
        )
      ) {
        return false;
      }
    }
    return true;
  },
  $.validator.format(
    consist_utils.generalMessages.validation.file_type_validate
  )
);
$.validator.addMethod(
  'require_from_list_validate',
  function (text, element) {
    return (
      element.getAttribute('value_is_from_list') === 'true' ||
      element.value === ''
    );
  },
  $.validator.format(
    consist_utils.generalMessages.validation.require_from_list_validate
  )
);
$.validator.addMethod('number', function (text, element) {
  return this.optional(element) || text.match(new RegExp('^[0-9]*$'));
});

/* =========================================================================== */
